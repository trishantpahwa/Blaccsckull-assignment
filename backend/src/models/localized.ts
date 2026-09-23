import { Schema } from 'mongoose';

export const localizedText = new Schema(
  {
    en: { type: String, required: true, trim: true },
    hi: { type: String, trim: true },
  },
  { _id: false },
);

export const localizedList = new Schema(
  {
    en: { type: [String], default: [] },
    hi: { type: [String], default: [] },
  },
  { _id: false },
);
