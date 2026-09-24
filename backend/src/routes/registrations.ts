import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import type { Types } from 'mongoose';
import { z } from 'zod';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { CompetitionModel } from '../models/Competition';
import { RegistrationModel } from '../models/Registration';
import { registrationView } from '../services/competitionView';
import { isSubmissionWindowOpen } from '../services/lifecycle';
import { paymentGateway } from '../services/paymentGateway';
import { confirmPayment } from '../services/registrations';
import { deleteSubmissionFile, streamSubmission, submissionUpload } from '../services/submissions';

export const registrationsRouter = Router();

async function loadOwnRegistration(req: Request) {
  const registration = await RegistrationModel.findById(req.params.id);
  if (!registration || registration.user.toString() !== req.userId) throw notFound('Registration not found');
  return registration;
}

registrationsRouter.get('/:id', requireAuth, async (req, res) => {
  res.json({ registration: registrationView(await loadOwnRegistration(req)) });
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

registrationsRouter.post('/:id/verify', requireAuth, writeLimiter, validateBody(verifySchema), async (req, res) => {
  const registration = await loadOwnRegistration(req);
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  if (registration.razorpayOrderId !== orderId) {
    throw badRequest('ORDER_MISMATCH', 'This payment does not belong to this registration');
  }
  if (!paymentGateway.isValidPaymentSignature(orderId, paymentId, signature)) {
    throw badRequest('INVALID_SIGNATURE', 'Payment could not be verified');
  }

  const updated = await confirmPayment(orderId, paymentId);
  res.json({ registration: registrationView(updated!) });
});

// Runs before multer so we reject the request before accepting a large upload.
async function assertCanSubmit(req: Request, _res: Response, next: NextFunction) {
  const registration = await loadOwnRegistration(req);
  if (registration.status !== 'confirmed') {
    throw forbidden('NOT_REGISTERED', 'Complete your registration before submitting');
  }
  const competition = await CompetitionModel.findById(registration.competition, { schedule: 1, status: 1 }).lean();
  if (!competition || competition.status !== 'published') throw conflict('COMPETITION_UNAVAILABLE', 'This competition is not accepting submissions');
  if (!isSubmissionWindowOpen(competition.schedule, new Date())) {
    throw conflict('SUBMISSION_CLOSED', 'Submissions are not open right now');
  }
  next();
}

registrationsRouter.post(
  '/:id/submission',
  requireAuth,
  writeLimiter,
  assertCanSubmit,
  submissionUpload.single('file'),
  async (req, res) => {
    const file = req.file as (Express.Multer.File & { id: Types.ObjectId }) | undefined;
    if (!file) throw badRequest('FILE_REQUIRED', 'Attach a video file in the "file" field');

    const previous = await RegistrationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, status: 'confirmed' },
      {
        // Field-level sets keep the entrant's showcase visibility choice across re-uploads.
        $set: {
          'submission.fileId': file.id,
          'submission.fileName': file.originalname,
          'submission.mimeType': file.mimetype,
          'submission.size': file.size,
          'submission.submittedAt': new Date(),
        },
      },
      { returnDocument: 'before' },
    );
    if (!previous) {
      await deleteSubmissionFile(file.id);
      throw conflict('NOT_REGISTERED', 'Your registration is no longer active');
    }
    if (previous.submission?.fileId) await deleteSubmissionFile(previous.submission.fileId);

    const updated = await RegistrationModel.findById(req.params.id);
    res.status(201).json({ registration: registrationView(updated!) });
  },
);

registrationsRouter.get('/:id/submission/file', requireAuth, async (req, res) => {
  const registration = await loadOwnRegistration(req);
  if (!registration.submission) throw notFound('No submission uploaded yet');
  streamSubmission(req, res, registration.submission, 'private, no-store');
});

const visibilitySchema = z.object({ hidden: z.boolean() });

// Lets an entrant pull their video out of the public showcase (or put it back).
registrationsRouter.patch('/:id/submission', requireAuth, writeLimiter, validateBody(visibilitySchema), async (req, res) => {
  const updated = await RegistrationModel.findOneAndUpdate(
    { _id: req.params.id, user: req.userId, 'submission.fileId': { $exists: true } },
    { $set: { 'submission.hidden': req.body.hidden } },
    { returnDocument: 'after' },
  );
  if (!updated) throw notFound('No submission uploaded yet');
  res.json({ registration: registrationView(updated) });
});
