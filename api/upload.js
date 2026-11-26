// Hands the browser a presigned URL so it can upload straight to Vercel Blob
// (videos are far bigger than the 4.5 MB a function can receive). Admin only.
// Uses the presigned flow because the Blob store is connected to the project
// through OIDC (BLOB_STORE_ID), which the older client-token flow can't use.
import { handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { isAdmin, json, unauthorized } from './_auth.js';
import { SLUG } from './_slug.js';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB per file
const TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg'];

// GET: which Blob credentials this deployment sees (no values, just yes/no). Admin only.
export function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  return json({
    readWriteToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    storeId: !!process.env.BLOB_STORE_ID,
  });
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      // Only needed to verify upload-completed webhooks, which this app doesn't use.
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || 'unused',
      getSignedToken: async (pathname) => {
        const [top, slug, file, extra] = pathname.split('/');
        if (top !== 'reviews' || !SLUG.test(slug || '') || !file || extra !== undefined) throw new Error('Invalid upload path.');
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 2 * 60 * 60 * 1000,
        });
        return {
          token,
          urlOptions: { allowedContentTypes: TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true },
        };
      },
    });
    return json(result);
  } catch (e) {
    console.error('upload token error:', e);
    return json({ error: e.message }, 400);
  }
}
