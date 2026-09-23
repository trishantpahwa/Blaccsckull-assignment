import mongoose, { Types, type ClientSession } from 'mongoose';
import { env } from '../config/env';
import { AppError, conflict, notFound } from '../lib/errors';
import { logger } from '../lib/logger';
import { CompetitionModel } from '../models/Competition';
import { ACTIVE_STATUSES, RegistrationModel, type RegistrationDoc, type RegistrationStatus } from '../models/Registration';
import { isRegistrationWindowOpen } from './lifecycle';
import { paymentGateway, type GatewayOrder } from './paymentGateway';

function isDuplicateKeyError(err: unknown) {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

async function reserveSpot(competitionId: Types.ObjectId, session: ClientSession, now?: Date) {
  const filter: Record<string, unknown> = {
    _id: competitionId,
    status: 'published',
    $expr: { $lt: ['$bookedCount', '$capacity'] },
  };
  if (now) filter['schedule.registrationClosesAt'] = { $gt: now };

  const res = await CompetitionModel.updateOne(filter, { $inc: { bookedCount: 1 } }, { session });
  return res.modifiedCount === 1;
}

async function releaseSpot(competitionId: Types.ObjectId, session: ClientSession) {
  await CompetitionModel.updateOne(
    { _id: competitionId, bookedCount: { $gt: 0 } },
    { $inc: { bookedCount: -1 } },
    { session },
  );
}

/**
 * Moves a pending registration to `to` and gives its spot back. Safe to call concurrently:
 * only the caller whose status update actually matched releases the spot.
 */
export async function releaseHold(registrationId: Types.ObjectId, to: Extract<RegistrationStatus, 'expired' | 'cancelled'>) {
  return mongoose.connection.transaction(async (session) => {
    const reg = await RegistrationModel.findOneAndUpdate(
      { _id: registrationId, status: 'pending_payment' },
      { $set: { status: to }, $unset: { holdExpiresAt: 1 } },
      { session, returnDocument: 'after' },
    );
    if (!reg) return false;
    await releaseSpot(reg.competition, session);
    return true;
  });
}

export async function releaseExpiredHolds(now = new Date(), batchSize = 500) {
  const expired = await RegistrationModel.find(
    { status: 'pending_payment', holdExpiresAt: { $lte: now } },
    { _id: 1 },
  )
    .limit(batchSize)
    .lean();

  let released = 0;
  for (const { _id } of expired) {
    if (await releaseHold(_id, 'expired')) released++;
  }
  return released;
}

export interface StartRegistrationResult {
  registration: RegistrationDoc;
  order: GatewayOrder | null;
}

function orderFor(reg: RegistrationDoc, currency: string): GatewayOrder | null {
  return reg.razorpayOrderId ? { id: reg.razorpayOrderId, amount: reg.amount, currency } : null;
}

export async function startRegistration(slug: string, userId: string, now = new Date()): Promise<StartRegistrationResult> {
  const competition = await CompetitionModel.findOne({ slug, status: { $ne: 'draft' } });
  if (!competition) throw notFound('Competition not found');
  if (competition.status === 'cancelled') throw conflict('COMPETITION_CANCELLED', 'This competition has been cancelled');

  const user = new Types.ObjectId(userId);
  const existing = await RegistrationModel.findOne({
    competition: competition._id,
    user,
    status: { $in: ACTIVE_STATUSES },
  });

  if (existing?.status === 'confirmed') {
    throw conflict('ALREADY_REGISTERED', 'You are already registered for this competition');
  }
  if (existing?.holdExpiresAt && existing.holdExpiresAt > now) {
    if (!existing.razorpayOrderId) {
      throw conflict('REGISTRATION_IN_PROGRESS', 'A registration is already in progress, please retry');
    }
    return { registration: existing, order: orderFor(existing, competition.currency) };
  }
  if (existing) {
    // The sweeper hasn't picked this hold up yet; release it so the user can start over.
    await releaseHold(existing._id, 'expired');
  }

  if (now < competition.schedule.registrationOpensAt) {
    throw conflict('REGISTRATION_NOT_OPEN', 'Registration has not opened yet');
  }
  if (!isRegistrationWindowOpen(competition.schedule, now)) {
    throw conflict('REGISTRATION_CLOSED', 'Registration for this competition has closed');
  }

  const isFree = competition.entryFee === 0;
  if (!isFree) paymentGateway.assertConfigured();

  let registration: RegistrationDoc;
  try {
    registration = await mongoose.connection.transaction(async (session) => {
      const reserved = await reserveSpot(competition._id, session, now);
      if (!reserved) throw conflict('SOLD_OUT', 'All spots for this competition have been booked');

      const [created] = await RegistrationModel.create(
        [
          {
            competition: competition._id,
            user,
            amount: competition.entryFee,
            status: isFree ? 'confirmed' : 'pending_payment',
            holdExpiresAt: isFree ? undefined : new Date(now.getTime() + env.HOLD_MINUTES * 60_000),
            confirmedAt: isFree ? now : undefined,
          },
        ],
        { session },
      );
      return created;
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      // Lost a race against another request from the same user (e.g. a double tap).
      throw conflict('REGISTRATION_IN_PROGRESS', 'A registration is already in progress, please retry');
    }
    throw err;
  }

  if (isFree) return { registration, order: null };

  // The order is created outside the transaction so a slow gateway never holds a lock on the
  // competition document.
  let order: GatewayOrder;
  try {
    order = await paymentGateway.createOrder({
      amount: competition.entryFee,
      currency: competition.currency,
      receipt: registration._id.toString(),
      notes: {
        registrationId: registration._id.toString(),
        competitionId: competition._id.toString(),
        userId,
      },
    });
  } catch (err) {
    logger.error({ err, registrationId: registration._id }, 'Failed to create payment order');
    await releaseHold(registration._id, 'cancelled');
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'PAYMENT_GATEWAY_ERROR', 'Could not start the payment, please try again');
  }

  registration.razorpayOrderId = order.id;
  await registration.save();
  return { registration, order };
}

/**
 * Marks the registration behind a captured payment as confirmed. Called from both the client
 * verification endpoint and the webhook, so it has to be idempotent.
 */
export async function confirmPayment(orderId: string, paymentId: string, now = new Date()) {
  const reg = await RegistrationModel.findOne({ razorpayOrderId: orderId });
  if (!reg) throw notFound('No registration found for this order');

  if (reg.status === 'confirmed' || reg.status === 'refund_due') return reg;

  if (reg.status === 'pending_payment') {
    const confirmed = await RegistrationModel.findOneAndUpdate(
      { _id: reg._id, status: 'pending_payment' },
      { $set: { status: 'confirmed', razorpayPaymentId: paymentId, confirmedAt: now }, $unset: { holdExpiresAt: 1 } },
      { returnDocument: 'after' },
    );
    if (confirmed) return confirmed;
    // The sweeper expired it between our read and write; fall through to the late payment path.
  }

  // Payment arrived after the hold was released. Try to give the user a spot again, otherwise
  // flag the payment for a refund.
  try {
    return await mongoose.connection.transaction(async (session) => {
      const current = await RegistrationModel.findById(reg._id).session(session);
      if (!current) throw notFound('No registration found for this order');
      if (current.status === 'confirmed' || current.status === 'refund_due') return current;

      const reserved = await reserveSpot(current.competition, session);
      current.status = reserved ? 'confirmed' : 'refund_due';
      current.razorpayPaymentId = paymentId;
      current.holdExpiresAt = undefined;
      if (reserved) current.confirmedAt = now;
      await current.save({ session });
      return current;
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    // The user already has another active registration, so this payment is a duplicate.
    return RegistrationModel.findOneAndUpdate(
      { _id: reg._id, status: { $in: ['expired', 'cancelled'] } },
      { $set: { status: 'refund_due', razorpayPaymentId: paymentId }, $unset: { holdExpiresAt: 1 } },
      { returnDocument: 'after' },
    );
  }
}
