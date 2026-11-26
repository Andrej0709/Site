// Admin session: a signed, HttpOnly cookie. The only secret is ADMIN_PASSWORD
// (set in Vercel → Settings → Environment Variables). Changing it logs out every session.
import crypto from 'node:crypto';

const COOKIE = 'cba_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) throw new Error('ADMIN_PASSWORD is not set (or shorter than 8 characters).');
  return crypto.createHash('sha256').update('cba-admin:' + pw).digest();
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(input) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) throw new Error('ADMIN_PASSWORD is not set (or shorter than 8 characters).');
  return safeEqual(input || '', pw);
}

export function sessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdmin(request) {
  const header = request.headers.get('cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) * 1000 < Date.now()) return false;
  try { return safeEqual(sig, sign(exp)); } catch { return false; }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export const unauthorized = () => json({ error: 'Not signed in.' }, 401);
