// Hands the browser a short-lived token so it can upload straight to Vercel Blob
// (videos are far bigger than the 4.5 MB a function can receive). Admin only.
import { handleUpload } from '@vercel/blob/client';
import { isAdmin, json, unauthorized } from './_auth.js';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB per file

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^reviews\/[a-z0-9]{10}\/[^/]+$/.test(pathname)) throw new Error('Invalid upload path.');
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg'],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return json(result);
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}
