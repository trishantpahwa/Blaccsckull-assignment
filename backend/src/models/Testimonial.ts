import { Schema, model, type InferSchemaType } from 'mongoose';
import { localizedText } from './localized';

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: localizedText,
    text: { type: localizedText, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatarUrl: String,
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Testimonial = InferSchemaType<typeof testimonialSchema>;
export const TestimonialModel = model('Testimonial', testimonialSchema);
