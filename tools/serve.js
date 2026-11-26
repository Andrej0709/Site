// Local dev server: serves files/ like Vercel does, runs api/*.js functions,
// and applies the /r/:id rewrite from vercel.json. Env vars come from .env.local.
//   node tools/serve.js [root] [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const root = path.resolve(process.argv[2] || path.join(projectRoot, 'files'));
const port = Number(process.argv[3] || 5173);

const envFile = path.join(projectRoot, '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const types = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };

async function runFunction(name, req, res, url) {
  const file = path.join(projectRoot, 'api', name + '.js');
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) { res.writeHead(404); return res.end('no such function'); }
  const mod = await import(pathToFileURL(file).href + '?t=' + fs.statSync(file).mtimeMs);
  const handler = mod[req.method];
  if (!handler) { res.writeHead(405); return res.end(); }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
  try {
    const response = await handler(request);
    const headers = {};
    response.headers.forEach((v, k) => { headers[k] = v; });
    const setCookie = response.headers.getSetCookie?.();
    if (setCookie?.length) headers['set-cookie'] = setCookie;
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(e.stack || e));
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let p = decodeURIComponent(url.pathname);
  if (p.startsWith('/api/')) return runFunction(p.slice(5).replace(/\/$/, ''), req, res, url);

  let f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) {
    const r = p.match(/^\/r\/([^/]+)\/?$/); // vercel.json rewrite
    if (r) return runFunction('review', req, res, new URL(`/api/review?id=${r[1]}`, url));
    res.writeHead(404); return res.end('not found');
  }
  const size = fs.statSync(f).size;
  const type = types[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = parseInt(s, 10); const end = e ? parseInt(e, 10) : size - 1;
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': type });
    return fs.createReadStream(f, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Length': size, 'Content-Type': type, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('serving ' + root + ' on ' + port));
