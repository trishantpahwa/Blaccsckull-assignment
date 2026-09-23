import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { localizedList, localizedText } from './localized';

const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: localizedText, required: true },
    experienceYears: { type: Number, min: 0 },
    photoUrl: String,
    introVideoUrl: String,
  },
  { _id: false },
);

const rewardSchema = new Schema(
  {
    position: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const winnerSchema = new Schema(
  {
    name: { type: String, required: true },
    position: { type: Number, required: true, min: 1 },
    photoUrl: String,
    videoUrl: String,
  },
  { _id: false },
);

const scheduleSchema = new Schema(
  {
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultAt: { type: Date, required: true },
  },
  { _id: false },
);

const competitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: localizedText, required: true },
    category: { type: localizedText, required: true },
    isMultiWin: { type: Boolean, default: false },
    givesCertificate: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    // Amounts are in paise.
    prizePool: { type: Number, required: true, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    judge: { type: judgeSchema, required: true },
    schedule: { type: scheduleSchema, required: true },
    about: { type: localizedText, required: true },
    judgingParameters: { type: localizedList, default: () => ({}) },
    rules: { type: localizedList, default: () => ({}) },
    rewards: { type: [rewardSchema], default: [] },
    previousWinners: { type: [winnerSchema], default: [] },
    prizeInfoVideoUrl: String,
    disclaimer: localizedText,
    ad: {
      imageUrl: String,
      targetUrl: String,
    },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft', index: true },
  },
  { timestamps: true },
);

export type Competition = InferSchemaType<typeof competitionSchema>;
export type CompetitionDoc = HydratedDocument<Competition>;
export const CompetitionModel = model('Competition', competitionSchema);
