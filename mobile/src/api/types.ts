export type Phase =
  | 'cancelled'
  | 'upcoming'
  | 'registration_open'
  | 'awaiting_submissions'
  | 'submission_open'
  | 'judging'
  | 'results_announced';

export type DeadlineKind =
  | 'registration_opens'
  | 'registration_closes'
  | 'submission_starts'
  | 'submission_ends'
  | 'results';

export interface Lifecycle {
  phase: Phase;
  registrationOpen: boolean;
  submissionOpen: boolean;
  isFull: boolean;
  nextDeadline: { kind: DeadlineKind; at: string } | null;
}

export interface Availability {
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  lifecycle: Lifecycle;
}

export interface CompetitionSummary extends Availability {
  id: string;
  slug: string;
  title: string;
  category: string;
  prizePool: number;
  entryFee: number;
  currency: string;
  judgeName: string;
}

export interface CompetitionDetail extends CompetitionSummary {
  isMultiWin: boolean;
  givesCertificate: boolean;
  judge: {
    name: string;
    title: string;
    experienceYears: number | null;
    photoUrl: string | null;
    introVideoUrl: string | null;
  };
  schedule: {
    registrationOpensAt: string;
    registrationClosesAt: string;
    submissionStartsAt: string;
    submissionEndsAt: string;
    resultAt: string;
  };
  about: string;
  judgingParameters: string[];
  rules: string[];
  rewards: { position: number; amount: number }[];
  previousWinners: { name: string; position: number; photoUrl: string | null; videoUrl: string | null }[];
  prizeInfoVideoUrl: string | null;
  disclaimer: string | null;
  ad: { imageUrl: string; targetUrl: string | null } | null;
  referral: { rewardPerSignup: number };
}

export type RegistrationStatus = 'pending_payment' | 'confirmed' | 'expired' | 'refund_due' | 'cancelled';

export interface Registration {
  id: string;
  status: RegistrationStatus;
  amount: number;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  razorpayOrderId: string | null;
  submission: { fileName: string; mimeType: string; size: number; submittedAt: string } | null;
}

export interface CompetitionResponse {
  serverTime: string;
  competition: CompetitionDetail;
  viewer: { registration: Registration | null } | null;
}

export interface PaymentOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  referralCode: string;
  referralLink: string;
}

export interface ReferralStats {
  code: string;
  link: string;
  rewardPerSignup: number;
  signups: number;
  earnings: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  text: string;
  rating: number;
  avatarUrl: string | null;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
