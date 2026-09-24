import mongoose, { Types } from 'mongoose';
import { env } from '../config/env';
import { conflict, forbidden, notFound } from '../lib/errors';
import { absoluteUrl } from '../lib/urls';
import { CompetitionModel } from '../models/Competition';
import { RegistrationModel } from '../models/Registration';
import { VoteModel } from '../models/Vote';
import { isVotingWindowOpen } from './lifecycle';

export const ENTRY_SORTS = ['top', 'new'] as const;
export type EntrySort = (typeof ENTRY_SORTS)[number];

const MAX_ENTRIES = 100;

// Registrations that count as a showcase entry: paid, with a video uploaded.
const entryFilter = { status: 'confirmed' as const, 'submission.fileId': { $exists: true } };

function isDuplicateKeyError(err: unknown) {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

// "Riya Shah" -> "Riya S." so the public gallery doesn't publish full names.
export function publicName(fullName: string) {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

/**
 * Standard competition ranking over vote counts (1, 2, 2, 4). Entries without votes stay unranked,
 * so a fresh competition doesn't show everyone tied for first.
 */
export function rankByVotes(voteCounts: number[]) {
  const sorted = [...voteCounts].sort((a, b) => b - a);
  return voteCounts.map((votes) => (votes > 0 ? sorted.indexOf(votes) + 1 : null));
}

export async function listEntries(slug: string, viewerId: string | undefined, sort: EntrySort) {
  const competition = await CompetitionModel.findOne(
    { slug, status: { $in: ['published', 'cancelled'] } },
    { schedule: 1, status: 1 },
  ).lean();
  if (!competition) throw notFound('Competition not found');

  const visibility: Record<string, unknown>[] = [{ 'submission.hidden': { $ne: true } }];
  // Entrants still see their own hidden entry so they can switch it back on.
  if (viewerId) visibility.push({ user: new Types.ObjectId(viewerId) });

  const [registrations, total] = await Promise.all([
    RegistrationModel.find({ competition: competition._id, ...entryFilter, $or: visibility })
      .sort(sort === 'top' ? { voteCount: -1, 'submission.submittedAt': 1 } : { 'submission.submittedAt': -1 })
      .limit(MAX_ENTRIES)
      .populate<{ user: { _id: Types.ObjectId; name: string; avatarUrl?: string } }>('user', 'name avatarUrl')
      .lean(),
    RegistrationModel.countDocuments({ competition: competition._id, ...entryFilter, 'submission.hidden': { $ne: true } }),
  ]);

  const votedIds = viewerId
    ? new Set(
        (
          await VoteModel.find(
            { user: viewerId, registration: { $in: registrations.map((r) => r._id) } },
            { registration: 1 },
          ).lean()
        ).map((v) => v.registration.toString()),
      )
    : new Set<string>();

  const isPublic = (r: (typeof registrations)[number]) => !r.submission!.hidden;
  const publicEntries = registrations.filter(isPublic);
  const ranks = new Map(
    rankByVotes(publicEntries.map((r) => r.voteCount)).map((rank, i) => [publicEntries[i]._id.toString(), rank]),
  );

  const now = new Date();
  return {
    total,
    votingOpen: competition.status === 'published' && isVotingWindowOpen(competition.schedule, now),
    votingClosesAt: competition.schedule.resultAt,
    entries: registrations.map((r) => {
      const id = r._id.toString();
      const submission = r.submission!;
      return {
        id,
        entrant: { name: publicName(r.user.name), avatarUrl: absoluteUrl(r.user.avatarUrl) },
        submittedAt: submission.submittedAt,
        voteCount: r.voteCount,
        rank: ranks.get(id) ?? null,
        viewerHasVoted: votedIds.has(id),
        isMine: viewerId === r.user._id.toString(),
        hidden: submission.hidden ?? false,
        // The file id busts caches when an entrant replaces their video.
        videoUrl: `${env.PUBLIC_BASE_URL}/api/v1/entries/${id}/video?v=${submission.fileId.toString()}`,
      };
    }),
  };
}

// Loads an entry for voting and applies the rules every vote change has to pass.
async function loadVotableEntry(entryId: string, userId: string) {
  const entry = await RegistrationModel.findOne(
    { _id: entryId, ...entryFilter, 'submission.hidden': { $ne: true } },
    { competition: 1, user: 1 },
  ).lean();
  if (!entry) throw notFound('Entry not found');
  if (entry.user.toString() === userId) throw forbidden('OWN_ENTRY', "You can't vote for your own entry");

  const competition = await CompetitionModel.findById(entry.competition, { schedule: 1, status: 1 }).lean();
  if (!competition || competition.status !== 'published' || !isVotingWindowOpen(competition.schedule, new Date())) {
    throw conflict('VOTING_CLOSED', 'Voting is closed for this competition');
  }
  return entry;
}

async function voteState(entryId: Types.ObjectId, viewerHasVoted: boolean) {
  const fresh = await RegistrationModel.findById(entryId, { voteCount: 1 }).lean();
  return { voteCount: fresh?.voteCount ?? 0, viewerHasVoted };
}

/** Idempotent: voting twice leaves a single vote. */
export async function castVote(entryId: string, userId: string) {
  const entry = await loadVotableEntry(entryId, userId);
  try {
    await mongoose.connection.transaction(async (session) => {
      await VoteModel.create([{ registration: entry._id, competition: entry.competition, user: userId }], { session });
      await RegistrationModel.updateOne({ _id: entry._id }, { $inc: { voteCount: 1 } }, { session });
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
  return voteState(entry._id, true);
}

/** Idempotent: removing a vote that isn't there does nothing. */
export async function removeVote(entryId: string, userId: string) {
  const entry = await loadVotableEntry(entryId, userId);
  await mongoose.connection.transaction(async (session) => {
    const removed = await VoteModel.findOneAndDelete({ registration: entry._id, user: userId }, { session });
    if (removed) {
      await RegistrationModel.updateOne({ _id: entry._id, voteCount: { $gt: 0 } }, { $inc: { voteCount: -1 } }, { session });
    }
  });
  return voteState(entry._id, false);
}

export async function loadPublicVideo(entryId: string) {
  const entry = await RegistrationModel.findOne(
    { _id: entryId, ...entryFilter, 'submission.hidden': { $ne: true } },
    { competition: 1, submission: 1 },
  ).lean();
  if (!entry) throw notFound('Entry not found');
  const visible = await CompetitionModel.exists({ _id: entry.competition, status: 'published' });
  if (!visible) throw notFound('Entry not found');
  return entry.submission!;
}
