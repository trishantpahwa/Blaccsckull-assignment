import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { z } from 'zod';
import { CompetitionModel } from '../models/Competition';

const MAX_RUPEES = 10_00_000;
const paise = () =>
  z
    .number()
    .int('must be a whole number of paise')
    .min(0, "can't be negative")
    .max(MAX_RUPEES * 100, 'is too large');

const text = (max: number) => z.string().trim().min(1, 'is required').max(max);
const lines = z.array(z.string().trim().min(1).max(300)).max(20).default([]);

export const createCompetitionSchema = z
  .object({
    title: z.string().trim().min(3, 'must be at least 3 characters').max(80),
    category: text(30),
    about: text(2000),
    entryFee: paise(),
    capacity: z.number().int().min(1, 'must be at least 1').max(10_000),
    rewards: z.array(paise().min(100, 'must be at least ₹1')).min(1, 'add at least one reward').max(20),
    givesCertificate: z.boolean().default(false),
    judge: z.object({
      name: text(60),
      title: text(80),
      experienceYears: z.number().int().min(0).max(80).optional(),
    }),
    schedule: z.object({
      registrationOpensAt: z.coerce.date(),
      registrationClosesAt: z.coerce.date(),
      submissionStartsAt: z.coerce.date(),
      submissionEndsAt: z.coerce.date(),
      resultAt: z.coerce.date(),
    }),
    judgingParameters: lines,
    rules: lines,
  })
  .superRefine((input, ctx) => {
    const s = input.schedule;
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    if (s.registrationClosesAt <= s.registrationOpensAt) {
      issue(['schedule', 'registrationClosesAt'], 'Registration must close after it opens');
    }
    if (s.registrationClosesAt <= new Date()) {
      issue(['schedule', 'registrationClosesAt'], 'Registration must close in the future');
    }
    if (s.submissionStartsAt < s.registrationOpensAt) {
      issue(['schedule', 'submissionStartsAt'], "Submissions can't open before registration does");
    }
    // Registered users need a chance to submit, so submissions can't end before registration closes.
    if (s.submissionEndsAt <= s.submissionStartsAt || s.submissionEndsAt < s.registrationClosesAt) {
      issue(['schedule', 'submissionEndsAt'], 'Submissions must end after they start and after registration closes');
    }
    if (s.resultAt < s.submissionEndsAt) {
      issue(['schedule', 'resultAt'], "Results can't be announced before submissions end");
    }
    if (input.rewards.length > input.capacity) {
      issue(['rewards'], 'There are more rewards than spots');
    }
    if (input.rewards.some((amount, i) => i > 0 && amount > input.rewards[i - 1])) {
      issue(['rewards'], 'A lower position can’t get a bigger reward than a higher one');
    }
  });

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'competition';
}

export async function createCompetition(input: CreateCompetitionInput, userId: string) {
  const base = slugify(input.title);

  for (let attempt = 0; attempt < 5; attempt++) {
    // The suffix keeps slugs unique when two people pick the same title.
    const slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
    try {
      return await CompetitionModel.create({
        slug,
        title: { en: input.title },
        category: { en: input.category },
        about: { en: input.about },
        isMultiWin: input.rewards.length > 1,
        givesCertificate: input.givesCertificate,
        prizePool: input.rewards.reduce((sum, amount) => sum + amount, 0),
        entryFee: input.entryFee,
        capacity: input.capacity,
        judge: {
          name: input.judge.name,
          title: { en: input.judge.title },
          experienceYears: input.judge.experienceYears,
        },
        schedule: input.schedule,
        rewards: input.rewards.map((amount, i) => ({ position: i + 1, amount })),
        judgingParameters: { en: input.judgingParameters, hi: [] },
        rules: { en: input.rules, hi: [] },
        status: 'published',
        createdBy: new Types.ObjectId(userId),
      });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  throw new Error('Could not generate a unique slug');
}
