import type { Request } from 'express';
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
