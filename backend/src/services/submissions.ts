import type { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import multer, { type StorageEngine } from 'multer';
import { badRequest } from '../lib/errors';

export const MAX_SUBMISSION_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = /^video\//;

export function submissionsBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database is not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'submissions' });
}

// Streams the upload straight into GridFS so large videos never sit in memory or on local disk,
// which matters on Render where the filesystem is ephemeral.
const gridFsStorage: StorageEngine = {
  _handleFile(req: Request, file, cb) {
    const upload = submissionsBucket().openUploadStream(file.originalname, {
      metadata: { registrationId: req.params.id, userId: req.userId, contentType: file.mimetype },
    });
    let size = 0;
    file.stream.on('data', (chunk: Buffer) => (size += chunk.length));
    file.stream
      .pipe(upload)
      .on('error', (err) => cb(err))
      .on('finish', () => cb(null, { id: upload.id, size } as Partial<Express.Multer.File>));
  },
  _removeFile(_req, file, cb) {
    const id = (file as unknown as { id?: Types.ObjectId }).id;
    if (!id) return cb(null);
    submissionsBucket()
      .delete(id)
      .then(() => cb(null), cb);
  },
};

export const submissionUpload = multer({
  storage: gridFsStorage,
  limits: { fileSize: MAX_SUBMISSION_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_TYPES.test(file.mimetype)) {
      return cb(badRequest('UNSUPPORTED_FILE', 'Please upload a video file'));
    }
    cb(null, true);
  },
});

export async function deleteSubmissionFile(fileId: Types.ObjectId) {
  try {
    await submissionsBucket().delete(fileId);
  } catch {
    // Already gone; nothing to clean up.
  }
}

/**
 * Parses a single-range `Range` header against a file of `size` bytes. Returns null to serve the
 * whole file (no header, or a multi-range request we don't support), or 'unsatisfiable'.
 */
export function parseRange(header: string | undefined, size: number): { start: number; end: number } | 'unsatisfiable' | null {
  const match = header && /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  let start: number;
  let end: number;
  if (!rawStart) {
    // Suffix range: the last N bytes.
    const length = Number(rawEnd);
    if (length === 0) return 'unsatisfiable';
    start = Math.max(size - length, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}

interface StoredVideo {
  fileId: Types.ObjectId;
  mimeType: string;
  size: number;
  fileName: string;
}

// Streams a GridFS video with byte-range support; iOS players refuse to play MP4s without it.
export function streamSubmission(req: Request, res: Response, video: StoredVideo, cacheControl: string) {
  const range = parseRange(req.headers.range, video.size);
  res.set({
    'Content-Type': video.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl,
    'Content-Disposition': `inline; filename="${encodeURIComponent(video.fileName)}"`,
  });

  if (range === 'unsatisfiable') {
    res.status(416).set('Content-Range', `bytes */${video.size}`).end();
    return;
  }

  const { start, end } = range ?? { start: 0, end: video.size - 1 };
  if (range) {
    res.status(206).set('Content-Range', `bytes ${start}-${end}/${video.size}`);
  }
  res.set('Content-Length', String(end - start + 1));

  submissionsBucket()
    // GridFS treats `end` as exclusive.
    .openDownloadStream(video.fileId, { start, end: end + 1 })
    .on('error', () => res.destroy())
    .pipe(res);
}
