export const en = {
  goBack: 'Go back',
  retry: 'Try again',
  close: 'Close',
  loading: 'Loading…',

  tabs: { home: 'Home', explore: 'Explore', competitions: 'Competitions', profile: 'Profile' },

  registered: 'Registered',
  paymentPending: 'Payment pending',
  multiWin: 'Multi-Win',
  winnersGetCertificate: 'Winners get certificate',
  prizePool: 'Prize Pool',
  entryFee: 'Entry Fee',
  free: 'Free',
  onlySpotsLeft: 'Only {n} spots left',
  onlyOneSpotLeft: 'Only 1 spot left',
  spotsLeft: '{n} spots left',
  allSpotsBooked: 'All spots booked',
  booked: '{booked} / {capacity} Booked',

  judge: 'Judge',
  yearsExperience: '{n}+ Years of Experience',
  introVideo: 'Intro Video',

  deadline: {
    registration_opens: 'Registration opens in',
    registration_closes: 'Registration closes in',
    submission_starts: 'Submissions open in',
    submission_ends: 'Submissions close in',
    results: 'Results in',
  },
  resultsAnnounced: 'Results have been announced',
  competitionCancelled: 'This competition has been cancelled',
  hurryUp: 'Hurry up!',

  importantDates: 'Important Dates',
  registerBefore: 'Register Before',
  submissionStarts: 'Submission Starts',
  submissionEnds: 'Submission Ends',
  resultDate: 'Result Date',

  previousWinners: 'Previous Winners',
  winner: '{position} Winner',

  aboutCompetition: 'About Competition',
  judgingParameters: 'Judging Parameters',
  rulesEligibility: 'Rules & Eligibility',
  viewMore: 'View more',
  viewLess: 'View less',

  rewards: 'Rewards',
  allPositions: '(All Positions)',
  disclaimer: 'Disclaimer:',

  howPrizeMoney: 'How will you receive prize money?',
  watchVideo: 'Watch video to know more',
  refundPolicy: 'Refund policy',
  refundPolicyText:
    'If your payment goes through after all spots are booked, or the competition is cancelled, the full entry fee is refunded to your original payment method within 5 to 7 working days. Entry fees are not refundable once your registration is confirmed and the competition goes ahead.',
  securePayments: 'Secure payments powered by',

  referTitle: 'Refer & Earn more discount',
  copyLink: 'Copy Link',
  copied: 'Copied',
  referNow: 'Refer Now',
  youEarn: 'You earn',
  forEverySignup: 'for every signup',
  referralLoginHint: 'Log in to get your referral link',
  shareMessage: 'Join me on Feedants and take part in {title}. Sign up with my link: {link}',
  referralStats: '{signups} signups · {earnings} earned',

  hearFromUsers: 'Hear From Our Users',
  hearFromUsersSubtitle: 'See what participants say about Feedants',
  adHere: 'Ad Here',

  cta: {
    loginToRegister: 'Log in to register',
    entryFeeSub: 'Entry fee {fee}',
    register: 'Register Now',
    registerSub: 'Pay {fee} to confirm your spot',
    registerFree: 'Register for free',
    completePayment: 'Complete Payment',
    holdSub: 'Your spot is held for {time}',
    soldOut: 'All spots booked',
    soldOutSub: 'Registration is full',
    registrationOpens: 'Registration opens soon',
    registrationOpensSub: 'Opens on {date}',
    registrationClosed: 'Registration closed',
    uploadSubmission: 'Upload Submission',
    replaceSubmission: 'Replace Submission',
    submittedSub: 'Submitted {file}',
    submissionOpensSub: 'Opens on {date}',
    submissionsClosed: 'Submissions closed',
    resultsOnSub: 'Results on {date}',
    resultsAnnounced: 'Results announced',
    refundDue: 'Spots filled before your payment',
    refundDueSub: 'Your refund is being processed',
    cancelled: 'Competition cancelled',
    uploading: 'Uploading…',
    processing: 'Please wait…',
  },

  payment: {
    confirming: 'Confirming your payment…',
    success: 'You are registered! Good luck.',
    failed: 'Payment failed. Your spot stays held for a few minutes, try again.',
    cancelled: 'Payment cancelled. Your spot stays held for a few minutes.',
    unavailable: 'Could not open the payment page.',
  },
  submissionSuccess: 'Your submission has been uploaded.',
  fileTooLarge: 'Videos must be 100 MB or smaller.',

  auth: {
    loginTitle: 'Welcome back',
    loginSubtitle: 'Log in to register for competitions',
    signupTitle: 'Create your account',
    signupSubtitle: 'Join Feedants and start competing',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    referralCode: 'Referral code (optional)',
    login: 'Log in',
    signup: 'Sign up',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    logout: 'Log out',
    invalidEmail: 'Enter a valid email address',
    shortPassword: 'Password must be at least 8 characters',
    shortName: 'Enter your name',
  },

  list: {
    title: 'Competitions',
    empty: 'No competitions right now. Check back soon.',
    searchPlaceholder: 'Search competitions',
    phase: {
      cancelled: 'Cancelled',
      upcoming: 'Opening soon',
      registration_open: 'Registration open',
      awaiting_submissions: 'Registration closed',
      submission_open: 'Submissions open',
      judging: 'Judging',
      results_announced: 'Results out',
    },
  },

  home: {
    greeting: 'Hi {name}',
    guest: 'Hi there',
    subtitle: 'Find a competition and show your talent',
    featured: 'Open for registration',
  },
  create: {
    title: 'Create',
    body: 'Posting your own content is coming soon. For now, upload your entry from a competition page.',
  },
  profile: {
    title: 'Profile',
    guest: 'You are not logged in',
    referralCode: 'Your referral code',
    referrals: 'Referrals',
    earnings: 'Earnings',
  },
  testimonials: {
    title: 'Hear From Our Users',
    empty: 'No reviews yet.',
  },

  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
  ordinal: (n: number) => {
    const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
    return `${n}${suffix}`;
  },
};

export type Dictionary = typeof en;
