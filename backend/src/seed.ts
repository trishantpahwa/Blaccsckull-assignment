import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from './config/env';
import { connectDb, disconnectDb } from './db';
import { CompetitionModel } from './models/Competition';
import { ACTIVE_STATUSES, RegistrationModel } from './models/Registration';
import { TestimonialModel } from './models/Testimonial';
import { UserModel } from './models/User';
import { VoteModel } from './models/Vote';
import { submissionsBucket } from './services/submissions';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const rupees = (n: number) => n * 100;

const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function classicalDance(now: number) {
  const closes = now + DAY + 6 * HOUR + 28 * 60_000;
  return {
    slug: 'feedants-classical-dance',
    title: { en: 'Feedants Classical Dance', hi: 'फीडैंट्स शास्त्रीय नृत्य' },
    category: { en: 'Dance', hi: 'नृत्य' },
    isMultiWin: true,
    givesCertificate: true,
    prizePool: rupees(1500),
    entryFee: rupees(99),
    capacity: 20,
    judge: {
      name: 'Manju Dubey',
      title: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
      experienceYears: 12,
      photoUrl: '/static/images/judge-manju-dubey.jpg',
      introVideoUrl: SAMPLE_VIDEO,
    },
    schedule: {
      registrationOpensAt: new Date(now - 5 * DAY),
      registrationClosesAt: new Date(closes),
      submissionStartsAt: new Date(now - 2 * HOUR),
      submissionEndsAt: new Date(closes + 20 * DAY),
      resultAt: new Date(closes + 22 * DAY),
    },
    about: {
      en: 'This is an online classical dance competition open for all age groups.\nParticipate from anywhere and showcase your talent.\nExpress your passion through traditional dance.\nRecord a solo performance of 2 to 5 minutes in any Indian classical form such as Kathak, Bharatanatyam, Odissi, Kuchipudi, Manipuri or Mohiniyattam, and upload it before the submission deadline.',
      hi: 'यह सभी आयु वर्गों के लिए खुली एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है।\nकहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ।\nपारंपरिक नृत्य के माध्यम से अपने जुनून को व्यक्त करें।\nकथक, भरतनाट्यम, ओडिसी, कुचिपुड़ी, मणिपुरी या मोहिनीअट्टम जैसी किसी भी भारतीय शास्त्रीय शैली में 2 से 5 मिनट का एकल प्रदर्शन रिकॉर्ड करें और सबमिशन की अंतिम तिथि से पहले अपलोड करें।',
    },
    judgingParameters: {
      en: [
        'Technique and precision of footwork (30%)',
        'Expression and abhinaya (25%)',
        'Rhythm and sync with music (20%)',
        'Costume and overall presentation (15%)',
        'Originality of choreography (10%)',
      ],
      hi: [
        'तकनीक और पदचालन की सटीकता (30%)',
        'भाव और अभिनय (25%)',
        'लय और संगीत के साथ तालमेल (20%)',
        'वेशभूषा और समग्र प्रस्तुति (15%)',
        'नृत्य संरचना की मौलिकता (10%)',
      ],
    },
    rules: {
      en: [
        'Open to participants of all ages. Participants under 18 need consent from a parent or guardian.',
        'Only solo performances are accepted.',
        'The video must be between 2 and 5 minutes long and recorded in a single take.',
        'Only one submission per participant. You can replace it until the submission deadline.',
        'Only entries from participants who have paid the entry fee are judged.',
        'The judge’s decision is final.',
      ],
      hi: [
        'सभी आयु के प्रतिभागियों के लिए खुला। 18 वर्ष से कम आयु के प्रतिभागियों को माता-पिता या अभिभावक की सहमति आवश्यक है।',
        'केवल एकल प्रदर्शन स्वीकार किए जाएँगे।',
        'वीडियो 2 से 5 मिनट का होना चाहिए और एक ही टेक में रिकॉर्ड किया गया हो।',
        'प्रत्येक प्रतिभागी केवल एक प्रविष्टि भेज सकता है। अंतिम तिथि तक इसे बदला जा सकता है।',
        'केवल प्रवेश शुल्क का भुगतान करने वाले प्रतिभागियों की प्रविष्टियों का मूल्यांकन होगा।',
        'निर्णायक का निर्णय अंतिम होगा।',
      ],
    },
    rewards: [550, 300, 240, 200, 130, 80].map((amount, i) => ({ position: i + 1, amount: rupees(amount) })),
    previousWinners: [
      { name: 'Riya Shah', position: 1, photoUrl: '/static/images/winner-riya-shah.jpg', videoUrl: SAMPLE_VIDEO },
      { name: 'Aarav Mehta', position: 1, photoUrl: '/static/images/winner-aarav-mehta.jpg', videoUrl: SAMPLE_VIDEO },
      { name: 'Neha Verma', position: 2, photoUrl: '/static/images/winner-neha-verma.jpg', videoUrl: SAMPLE_VIDEO },
      { name: 'Ishita Chopra', position: 3, photoUrl: '/static/images/winner-ishita-chopra.jpg', videoUrl: SAMPLE_VIDEO },
    ],
    prizeInfoVideoUrl: SAMPLE_VIDEO,
    disclaimer: {
      en: 'Only contributions from paid participants will be considered for judging.',
      hi: 'केवल भुगतान करने वाले प्रतिभागियों की प्रविष्टियों पर ही निर्णय के लिए विचार किया जाएगा।',
    },
    status: 'published' as const,
  };
}

function otherCompetitions(now: number) {
  const base = classicalDance(now);
  return [
    {
      ...base,
      slug: 'feedants-sketch-challenge',
      title: { en: 'Feedants Sketch Challenge', hi: 'फीडैंट्स स्केच चैलेंज' },
      category: { en: 'Art', hi: 'कला' },
      isMultiWin: false,
      prizePool: rupees(2000),
      entryFee: rupees(49),
      capacity: 50,
      judge: { ...base.judge, name: 'Rohan Iyer', title: { en: 'Illustrator', hi: 'चित्रकार' }, experienceYears: 8, photoUrl: undefined },
      schedule: {
        registrationOpensAt: new Date(now + 3 * DAY),
        registrationClosesAt: new Date(now + 10 * DAY),
        submissionStartsAt: new Date(now + 4 * DAY),
        submissionEndsAt: new Date(now + 15 * DAY),
        resultAt: new Date(now + 18 * DAY),
      },
      rewards: [1000, 600, 400].map((amount, i) => ({ position: i + 1, amount: rupees(amount) })),
      previousWinners: [],
    },
    {
      ...base,
      slug: 'feedants-open-mic-poetry',
      title: { en: 'Feedants Open Mic Poetry', hi: 'फीडैंट्स ओपन माइक कविता' },
      category: { en: 'Poetry', hi: 'कविता' },
      prizePool: rupees(1000),
      entryFee: 0,
      capacity: 100,
      judge: { ...base.judge, name: 'Kavya Nair', title: { en: 'Poet and Author', hi: 'कवयित्री और लेखिका' }, experienceYears: 15, photoUrl: undefined },
      schedule: {
        registrationOpensAt: new Date(now - 30 * DAY),
        registrationClosesAt: new Date(now - 20 * DAY),
        submissionStartsAt: new Date(now - 20 * DAY),
        submissionEndsAt: new Date(now - 10 * DAY),
        resultAt: new Date(now - 5 * DAY),
      },
      rewards: [500, 300, 200].map((amount, i) => ({ position: i + 1, amount: rupees(amount) })),
      previousWinners: [],
    },
  ];
}

const testimonials = [
  {
    name: 'Ananya Rao',
    role: { en: 'Bharatanatyam dancer, Chennai', hi: 'भरतनाट्यम नृत्यांगना, चेन्नई' },
    text: {
      en: 'The judge feedback was detailed and genuinely helped me improve my abhinaya.',
      hi: 'निर्णायक की प्रतिक्रिया विस्तृत थी और इससे मेरे अभिनय में सच में सुधार हुआ।',
    },
    rating: 5,
  },
  {
    name: 'Karan Malhotra',
    role: { en: 'Singer, Delhi', hi: 'गायक, दिल्ली' },
    text: {
      en: 'Prize money reached my account within two days of the results. Smooth experience.',
      hi: 'परिणाम के दो दिन के भीतर इनाम की राशि मेरे खाते में आ गई। बढ़िया अनुभव रहा।',
    },
    rating: 5,
  },
  {
    name: 'Sneha Kulkarni',
    role: { en: 'Kathak student, Pune', hi: 'कथक छात्रा, पुणे' },
    text: {
      en: 'Loved that I could take part from home. The rules were clear from the start.',
      hi: 'अच्छा लगा कि मैं घर से ही भाग ले सकी। नियम शुरुआत से ही स्पष्ट थे।',
    },
    rating: 4,
  },
];

// Showcase entrants for the classical dance competition, and who votes for whom.
// The votes give 4, 3, 3, 1 and 0, so the leaderboard shows a tie for second place.
const SHOWCASE_ENTRANTS = ['Ananya Iyer', 'Vikram Joshi', 'Meera Pillai', 'Dev Kapoor', 'Tara Singh'];
const SHOWCASE_VOTES: [voter: number, entrant: number][] = [
  [1, 0], [2, 0], [3, 0], [4, 0],
  [0, 1], [2, 1], [4, 1],
  [0, 2], [1, 2], [3, 2],
  [0, 3],
];

async function uploadVideo(video: Buffer, fileName: string) {
  const upload = submissionsBucket().openUploadStream(fileName, { metadata: { contentType: 'video/mp4', seeded: true } });
  await new Promise<void>((resolve, reject) => upload.on('finish', () => resolve()).on('error', reject).end(video));
  return upload.id;
}

async function seedShowcase(slug: string) {
  const competition = await CompetitionModel.findOne({ slug });
  if (!competition) return;

  let video: Buffer;
  try {
    const res = await fetch(SAMPLE_VIDEO);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    video = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`Skipped showcase entries: could not download the sample video (${(err as Error).message})`);
    return;
  }

  const entryIds: string[] = [];
  const userIds: string[] = [];
  for (const [i, name] of SHOWCASE_ENTRANTS.entries()) {
    const email = `showcase${i + 1}@feedants.com`;
    const user =
      (await UserModel.findOne({ email })) ??
      (await UserModel.create({
        name,
        email,
        // Nobody logs in as these accounts.
        passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
        referralCode: `SHOW${i + 1}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      }));

    let registration = await RegistrationModel.findOne({ competition: competition._id, user: user._id, status: 'confirmed' });
    if (!registration) {
      const fileId = await uploadVideo(video, `${name.split(' ')[0].toLowerCase()}-kathak.mp4`);
      registration = await RegistrationModel.create({
        competition: competition._id,
        user: user._id,
        status: 'confirmed',
        amount: 0,
        confirmedAt: new Date(),
        submission: {
          fileId,
          fileName: `${name.split(' ')[0].toLowerCase()}-kathak.mp4`,
          mimeType: 'video/mp4',
          size: video.length,
          submittedAt: new Date(Date.now() - (SHOWCASE_ENTRANTS.length - i) * HOUR),
        },
      });
    }
    entryIds.push(registration._id.toString());
    userIds.push(user._id.toString());
  }

  for (const [voter, entrant] of SHOWCASE_VOTES) {
    await VoteModel.updateOne(
      { registration: entryIds[entrant], user: userIds[voter] },
      { $setOnInsert: { competition: competition._id } },
      { upsert: true },
    );
  }
  // Recount rather than increment, so re-running the seed never inflates the totals.
  for (const id of entryIds) {
    await RegistrationModel.updateOne({ _id: id }, { $set: { voteCount: await VoteModel.countDocuments({ registration: id }) } });
  }
  console.log(`Seeded ${entryIds.length} showcase entries and ${SHOWCASE_VOTES.length} votes`);
}

async function seed() {
  await connectDb(env.MONGODB_URI);
  await Promise.all([
    CompetitionModel.syncIndexes(),
    RegistrationModel.syncIndexes(),
    UserModel.syncIndexes(),
    VoteModel.syncIndexes(),
  ]);

  const now = Date.now();
  const reset = process.argv.includes('--reset');

  if (reset) {
    await RegistrationModel.deleteMany({});
    await VoteModel.deleteMany({});
    await submissionsBucket()
      .drop()
      .catch(() => {});
    console.log('Cleared registrations, votes and uploaded videos');
  }

  const classical = classicalDance(now);
  await CompetitionModel.updateOne({ slug: classical.slug }, { $set: classical }, { upsert: true, runValidators: true });
  if (!process.argv.includes('--no-showcase')) {
    await seedShowcase(classical.slug);
  }

  for (const competition of [classicalDance(now), ...otherCompetitions(now)]) {
    const saved = await CompetitionModel.findOneAndUpdate(
      { slug: competition.slug },
      { $set: competition },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
    // Keep the counter consistent with whatever registrations already exist.
    const booked = await RegistrationModel.countDocuments({ competition: saved._id, status: { $in: ACTIVE_STATUSES } });
    await CompetitionModel.updateOne({ _id: saved._id }, { $set: { bookedCount: booked } });
    console.log(`Seeded competition ${competition.slug} (${booked}/${competition.capacity} booked)`);
  }

  await TestimonialModel.deleteMany({});
  await TestimonialModel.insertMany(testimonials);
  console.log(`Seeded ${testimonials.length} testimonials`);

  const demoEmail = 'demo@feedants.com';
  if (!(await UserModel.exists({ email: demoEmail }))) {
    await UserModel.create({
      name: 'Demo User',
      email: demoEmail,
      passwordHash: await bcrypt.hash('demo1234', 10),
      referralCode: 'DEMO2026',
      avatarUrl: '/static/images/avatar-default.jpg',
    });
    console.log(`Created demo user ${demoEmail} / demo1234`);
  }

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
