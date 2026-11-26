import { checkPassword, sessionCookie, clearCookie, isAdmin, json } from './_auth.js';

// GET: am I signed in?  POST {password}: sign in.  DELETE: sign out.
export function GET(request) {
  return json({ admin: isAdmin(request) });
}

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch {}
  let ok;
  try { ok = checkPassword(body.password); } catch (e) { return json({ error: e.message }, 500); }
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: 'Wrong password.' }, 401);
  }
  return json({ admin: true }, 200, { 'set-cookie': sessionCookie() });
}

export function DELETE() {
  return json({ admin: false }, 200, { 'set-cookie': clearCookie() });
}
