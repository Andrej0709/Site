// Public review page: /r/<id>/ is rewritten here (see vercel.json).
// Links made with the old CLI live as static files in files/r/<id>/ and are served before this.
import { head } from '@vercel/blob';
import { renderReviewPage } from './_review-page.js';
import { SLUG } from './_slug.js';

const HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
};

const notFound = () => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Link not available</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0c0c0c;color:#f5f5f5;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:28px;letter-spacing:-.03em;margin:0 0 8px">This link is no longer available.</h1>
<p style="color:rgba(245,245,245,.64);margin:0">Ovaj link više nije aktivan. <a href="mailto:creativesbyandrej@gmail.com" style="color:#7cc7ff">creativesbyandrej@gmail.com</a></p></div>`,
  { status: 404, headers: HEADERS }
);

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!SLUG.test(id)) return notFound();
  let meta;
  try {
    const blob = await head(`reviews/${id}/meta.json`);
    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return notFound();
    meta = await res.json();
  } catch {
    return notFound();
  }
  return new Response(renderReviewPage(meta), { status: 200, headers: HEADERS });
}
