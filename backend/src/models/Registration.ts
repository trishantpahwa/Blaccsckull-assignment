import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const REGISTRATION_STATUSES = ['pending_payment', 'confirmed', 'expired', 'refund_due', 'cancelled'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

// Statuses that occupy a spot and block the user from registering again.
export const ACTIVE_STATUSES: RegistrationStatus[] = ['pending_payment', 'confirmed'];

const submissionSchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
    // Entrants can keep their video out of the public showcase; judges still see it.
    hidden: { type: Boolean, default: false },
  },
  { _id: false },
);

const registrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: REGISTRATION_STATUSES, required: true },
    amount: { type: Number, required: true, min: 0 },
    holdExpiresAt: { type: Date },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    confirmedAt: { type: Date },
    submission: submissionSchema,
    // Denormalised from the votes collection so the leaderboard is a single indexed sort.
    voteCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

registrationSchema.index(
  { competition: 1, user: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_STATUSES } } },
);
registrationSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
registrationSchema.index({ status: 1, holdExpiresAt: 1 });
registrationSchema.index({ user: 1, createdAt: -1 });
registrationSchema.index({ competition: 1, status: 1, voteCount: -1, 'submission.submittedAt': 1 });

export type Registration = InferSchemaType<typeof registrationSchema>;
export type RegistrationDoc = HydratedDocument<Registration>;
export const RegistrationModel = model('Registration', registrationSchema);
