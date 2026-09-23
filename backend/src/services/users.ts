import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { conflict, unauthorized } from '../lib/errors';
import { absoluteUrl, referralLink } from '../lib/urls';
import { UserModel, type UserDoc } from '../models/User';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function randomCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function userView(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: absoluteUrl(user.avatarUrl),
    referralCode: user.referralCode,
    referralLink: referralLink(user.referralCode),
  };
}

export async function createUser(input: { name: string; email: string; password: string; referralCode?: string }) {
  const email = input.email.toLowerCase();
  if (await UserModel.exists({ email })) {
    throw conflict('EMAIL_TAKEN', 'An account with this email already exists');
  }

  const referrer = input.referralCode
    ? await UserModel.exists({ referralCode: input.referralCode.toUpperCase() })
    : null;
  const passwordHash = await bcrypt.hash(input.password, 10);

  let user: UserDoc | null = null;
  for (let attempt = 0; attempt < 5 && !user; attempt++) {
    try {
      user = await UserModel.create({
        name: input.name,
        email,
        passwordHash,
        referralCode: randomCode(),
        referredBy: referrer?._id,
      });
    } catch (err) {
      const dup = (err as { code?: number; keyPattern?: Record<string, unknown> }) ?? {};
      if (dup.code !== 11000) throw err;
      if (dup.keyPattern?.email) throw conflict('EMAIL_TAKEN', 'An account with this email already exists');
      // Referral code collision, try another one.
    }
  }
  if (!user) throw new Error('Could not generate a unique referral code');

  if (referrer) {
    await UserModel.updateOne(
      { _id: referrer._id },
      { $inc: { referralCount: 1, referralEarnings: env.REFERRAL_REWARD } },
    );
  }
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  // Compare against a dummy hash for unknown emails so response time doesn't leak which emails exist.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Incorrect email or password');
  return user;
}
