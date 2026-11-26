// Admin API for review links stored in Vercel Blob under reviews/<id>/.
//   GET            list all links (+ storage used)
//   POST {meta}    save the page data after the browser finished uploading
//   DELETE ?id=    remove the link and its files
import { list, put, del, head } from '@vercel/blob';
import { isAdmin, json, unauthorized } from './_auth.js';

const ID = /^[a-z0-9]{10}$/;
const clean = (s, max) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

async function listAll(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  let blobs;
  try { blobs = await listAll('reviews/'); } catch (e) {
    const missing = !process.env.BLOB_READ_WRITE_TOKEN;
    return json({ error: missing ? 'Blob storage is not connected to this project yet.' : e.message }, 500);
  }
  const used = blobs.reduce((n, b) => n + b.size, 0);
  const metas = await Promise.all(
    blobs.filter((b) => b.pathname.endsWith('/meta.json')).map(async (b) => {
      try { return await (await fetch(b.url, { cache: 'no-store' })).json(); } catch { return null; }
    })
  );
  const items = metas.filter(Boolean).sort((a, b) => String(b.created).localeCompare(String(a.created)));
  return json({ items, used });
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  let m;
  try { m = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (!ID.test(m.id || '')) return json({ error: 'Bad id.' }, 400);

  // Only accept files that were uploaded into this link's own folder.
  let video, poster = null;
  try {
    video = await head(m.video);
    if (!video.pathname.startsWith(`reviews/${m.id}/`)) throw new Error();
    if (m.poster) {
      poster = await head(m.poster);
      if (!poster.pathname.startsWith(`reviews/${m.id}/`)) throw new Error();
    }
  } catch {
    return json({ error: 'Uploaded file not found.' }, 400);
  }

  const meta = {
    id: m.id,
    title: clean(m.title, 140) || 'Video',
    client: clean(m.client, 80),
    lang: m.lang === 'sr' ? 'sr' : 'en',
    created: new Date().toISOString(),
    w: Math.round(Number(m.w)) || 1920,
    h: Math.round(Number(m.h)) || 1080,
    duration: Number(m.duration) || 0,
    bytes: video.size,
    video: video.url,
    download: video.downloadUrl,
    poster: poster ? poster.url : '',
    fileName: clean(m.fileName, 120) || 'video.mp4',
  };
  await put(`reviews/${m.id}/meta.json`, JSON.stringify(meta), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
  });
  return json(meta);
}

export async function DELETE(request) {
  if (!isAdmin(request)) return unauthorized();
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ID.test(id)) return json({ error: 'Bad id.' }, 400);
  const blobs = await listAll(`reviews/${id}/`);
  if (blobs.length) await del(blobs.map((b) => b.url));
  return json({ removed: blobs.length });
}
