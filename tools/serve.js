// Local static server for previewing the site (serves folder/index.html and video byte ranges).
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'files'));
const port = Number(process.argv[3] || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
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
