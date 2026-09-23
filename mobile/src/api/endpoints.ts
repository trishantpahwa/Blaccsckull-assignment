import { request } from './client';
import type {
  Availability,
  CompetitionResponse,
  CompetitionSummary,
  PaymentOrder,
  RazorpaySuccess,
  ReferralStats,
  Registration,
  Testimonial,
  User,
} from './types';
import type { Lang } from '@/i18n';

export const api = {
  signup: (body: { name: string; email: string; password: string; referralCode?: string }) =>
    request<{ token: string; user: User }>('/auth/signup', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body }),
  me: () => request<{ user: User }>('/auth/me'),

  competitions: (lang: Lang) =>
    request<{ serverTime: string; competitions: CompetitionSummary[] }>(`/competitions?lang=${lang}`),
  competition: (slug: string, lang: Lang) => request<CompetitionResponse>(`/competitions/${slug}?lang=${lang}`),
  availability: (slug: string) =>
    request<Availability & { serverTime: string }>(`/competitions/${slug}/availability`),

  register: (slug: string) =>
    request<{ registration: Registration; payment: PaymentOrder | null }>(`/competitions/${slug}/registrations`, {
      method: 'POST',
    }),
  verifyPayment: (registrationId: string, body: RazorpaySuccess) =>
    request<{ registration: Registration }>(`/registrations/${registrationId}/verify`, { method: 'POST', body }),
  uploadSubmission: (registrationId: string, form: FormData) =>
    request<{ registration: Registration }>(`/registrations/${registrationId}/submission`, {
      method: 'POST',
      body: form,
    }),

  testimonials: (lang: Lang) => request<{ testimonials: Testimonial[] }>(`/testimonials?lang=${lang}`),
  referrals: () => request<ReferralStats>('/referrals/me'),
};
