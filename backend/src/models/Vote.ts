import { Schema, model, type InferSchemaType } from 'mongoose';

// One row per (entry, voter). The unique index is what makes a vote count at most once,
// even when the same user double-taps from two devices.
const voteSchema = new Schema(
  {
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

voteSchema.index({ registration: 1, user: 1 }, { unique: true });
voteSchema.index({ user: 1, competition: 1 });

export type Vote = InferSchemaType<typeof voteSchema>;
export const VoteModel = model('Vote', voteSchema);
