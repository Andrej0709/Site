#!/usr/bin/env node
// Git-based review links (the admin page at /admin does the same through Vercel Blob).
// Private client review links served from the portfolio site itself.
//
//   node tools/review.js new "D:\path\video.mp4" --title "Spotify promo" [--client "Marko"] [--lang sr|en] [--no-encode] [--push]
//   node tools/review.js list
//   node tools/review.js remove <id> [--push]
//
// Each link lives in files/r/<random id>/ (index.html, the video, a poster, meta.json).
// The page is noindex and is linked from nowhere, so only people with the link find it.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { renderReviewPage, fmtSize, fmtDuration } from '../api/_review-page.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE = 'https://www.creativesbyandrej.design';
const ROOT = path.resolve(__dirname, '..');
const R_DIR = path.join(ROOT, 'files', 'r');
const MAX_BYTES = 95 * 1024 * 1024; // GitHub refuses files over 100 MB
const MAX_SIDE = 1920;

function die(msg) { console.error('\n  ' + msg + '\n'); process.exit(1); }

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

function findTool(name) {
  const envKey = name === 'ffmpeg' ? 'FFMPEG' : 'FFPROBE';
  if (process.env[envKey] && fs.existsSync(process.env[envKey])) return process.env[envKey];
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  if (which.status === 0) return which.stdout.split(/\r?\n/)[0].trim();
  // Fallback: the ffmpeg build bundled with Medal (folder name changes with each Medal update)
  const medal = path.join(process.env.LOCALAPPDATA || '', 'Medal');
  if (fs.existsSync(medal)) {
    const dirs = fs.readdirSync(medal).filter((d) => d.startsWith('recorder-')).sort().reverse();
    for (const d of dirs) {
      for (const f of name === 'ffmpeg' ? ['ffmpeg7.exe', 'ffmpeg.exe'] : ['ffprobe.exe']) {
        const p = path.join(medal, d, f);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  die(`Can't find ${name}. Install it or set the ${envKey} environment variable to its path.`);
}

function probe(file) {
  const json = execFileSync(findTool('ffprobe'), [
    '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file,
  ], { encoding: 'utf8' });
  const info = JSON.parse(json);
  const v = info.streams.find((s) => s.codec_type === 'video');
  if (!v) die('No video stream in ' + file);
  let w = v.width, h = v.height;
  const rot = Math.abs(Number((v.side_data_list || []).find((s) => s.rotation !== undefined)?.rotation || v.tags?.rotate || 0));
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  return {
    w, h,
    duration: Number(info.format.duration || v.duration || 0),
    vcodec: v.codec_name,
    hasAudio: info.streams.some((s) => s.codec_type === 'audio'),
  };
}

function even(n) { return Math.max(2, Math.round(n / 2) * 2); }

function targetSize(w, h) {
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  return { w: even(w * scale), h: even(h * scale) };
}

function encode(src, dst, size, info, bitrateK) {
  const args = ['-y', '-v', 'error', '-stats', '-i', src,
    '-map', '0:v:0', '-map', '0:a:0?',
    '-vf', `scale=${size.w}:${size.h}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'high'];
  if (bitrateK) args.push('-b:v', bitrateK + 'k', '-maxrate', Math.round(bitrateK * 1.5) + 'k', '-bufsize', bitrateK * 2 + 'k');
  else args.push('-crf', '20', '-maxrate', '16M', '-bufsize', '24M');
  if (info.hasAudio) args.push('-c:a', 'aac', '-b:a', '192k');
  args.push('-movflags', '+faststart', dst);
  const r = spawnSync(findTool('ffmpeg'), args, { stdio: 'inherit' });
  if (r.status !== 0) die('ffmpeg failed while encoding the video.');
}

function poster(src, dst, info, size) {
  const at = Math.min(1, info.duration / 2).toFixed(2);
  const w = Math.min(1280, size.w);
  const r = spawnSync(findTool('ffmpeg'), ['-y', '-v', 'error', '-ss', at, '-i', src, '-frames:v', '1',
    '-vf', `scale=${w}:-2`, '-q:v', '3', dst], { stdio: 'inherit' });
  if (r.status !== 0) die('ffmpeg failed while making the poster.');
}

function slugify(s) {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'dj')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'video';
}

function newId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'; // no look-alikes (l, 1, o, 0)
  let id;
  do {
    id = Array.from(crypto.randomBytes(10), (b) => alphabet[b % alphabet.length]).join('');
  } while (fs.existsSync(path.join(R_DIR, id)));
  return id;
}


function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) die('git ' + args.join(' ') + ' failed.');
}

function cmdNew(opts) {
  const src = opts._[1];
  if (!src) die('Usage: node tools/review.js new "<video file>" --title "Title" [--client "Name"] [--lang sr|en] [--no-encode] [--push]');
  if (!fs.existsSync(src)) die('File not found: ' + src);
  const lang = opts.lang === 'sr' ? 'sr' : 'en';
  const title = typeof opts.title === 'string' ? opts.title : path.basename(src, path.extname(src));
  const client = typeof opts.client === 'string' ? opts.client : '';

  const info = probe(src);
  const srcBytes = fs.statSync(src).size;
  if (opts['no-encode']) {
    if (path.extname(src).toLowerCase() !== '.mp4' || info.vcodec !== 'h264') die('--no-encode only works with an H.264 .mp4 file.');
    if (srcBytes > MAX_BYTES) die(`The file is ${fmtSize(srcBytes)}; GitHub's limit is 100 MB. Drop --no-encode so it gets compressed.`);
  }
  const id = newId();
  const dir = path.join(R_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = slugify(title) + '.mp4';
  const videoPath = path.join(dir, fileName);

  let size = targetSize(info.w, info.h);
  try {
    if (opts['no-encode']) {
      fs.copyFileSync(src, videoPath);
      size = { w: info.w, h: info.h };
    } else {
      console.log(`\n  Encoding ${info.w}×${info.h} → ${size.w}×${size.h} (H.264, CRF 20)…`);
      encode(src, videoPath, size, info);
      if (fs.statSync(videoPath).size > MAX_BYTES) {
        const kbps = Math.floor(((MAX_BYTES * 0.92 * 8) / 1000) / info.duration - (info.hasAudio ? 192 : 0));
        if (kbps < 800) die('This video is too long to fit under 100 MB at decent quality. Trim it or send it in parts.');
        console.log(`  Too big for GitHub, re-encoding at ${kbps} kb/s…`);
        encode(src, videoPath, size, info, kbps);
      }
    }
    poster(videoPath, path.join(dir, 'poster.jpg'), info, size);
  } catch (e) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw e;
  }

  const now = new Date();
  const bytes = fs.statSync(videoPath).size;
  const html = renderReviewPage({
    title, client, lang, created: now.toISOString(), w: size.w, h: size.h, duration: info.duration, bytes,
    video: fileName, poster: 'poster.jpg', download: fileName, fileName,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ id, title, client, lang, created: now.toISOString(), file: fileName, bytes }, null, 2) + '\n');

  const url = `${SITE}/r/${id}/`;
  console.log(`\n  Ready: files/r/${id}/  (${fmtSize(bytes)}, ${fmtDuration(info.duration)})`);
  if (opts.push) {
    git(['add', path.join('files', 'r', id)]);
    git(['commit', '-m', `Add review link: ${title}`]);
    git(['push']);
    console.log(`\n  Pushed. The link works once Vercel finishes deploying (about a minute):\n\n    ${url}\n`);
  } else {
    console.log(`\n  Link (works after you commit and push):\n\n    ${url}\n\n  To publish: node tools/review.js new ... --push, or commit files/r/${id} yourself.\n`);
  }
}

function readMetas() {
  if (!fs.existsSync(R_DIR)) return [];
  return fs.readdirSync(R_DIR)
    .filter((d) => fs.existsSync(path.join(R_DIR, d, 'meta.json')))
    .map((d) => JSON.parse(fs.readFileSync(path.join(R_DIR, d, 'meta.json'), 'utf8')))
    .sort((a, b) => b.created.localeCompare(a.created));
}

function cmdList() {
  const metas = readMetas();
  if (!metas.length) return console.log('\n  No review links yet.\n');
  console.log('');
  for (const m of metas) {
    console.log(`  ${m.created.slice(0, 10)}  ${m.id}  ${m.title}${m.client ? '  (' + m.client + ')' : ''}  ${fmtSize(m.bytes)}`);
    console.log(`              ${SITE}/r/${m.id}/`);
  }
  console.log('');
}

function cmdRemove(opts) {
  const id = opts._[1];
  if (!id || !/^[a-z0-9]+$/.test(id)) die('Usage: node tools/review.js remove <id> [--push]');
  const dir = path.join(R_DIR, id);
  if (!fs.existsSync(dir)) die('No review link with id ' + id);
  const meta = fs.existsSync(path.join(dir, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')) : { title: id };
  const tracked = spawnSync('git', ['ls-files', '--error-unmatch', path.join('files', 'r', id)], { cwd: ROOT, stdio: 'ignore' }).status === 0;
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\n  Removed files/r/${id}/ (${meta.title}).`);
  if (opts.push && tracked) {
    git(['add', '-A', path.join('files', 'r', id)]);
    git(['commit', '-m', `Remove review link: ${meta.title}`]);
    git(['push']);
    console.log('  Pushed. The link stops working after the next Vercel deploy.\n');
  } else if (tracked) {
    console.log('  Commit and push to take the link offline.\n');
  }
}

const opts = parseArgs(process.argv.slice(2));
const cmd = opts._[0];
if (cmd === 'new') cmdNew(opts);
else if (cmd === 'list') cmdList();
else if (cmd === 'remove') cmdRemove(opts);
else {
  console.log(`
  Client review links

    node tools/review.js new "<video file>" --title "Title" [--client "Name"] [--lang sr|en] [--no-encode] [--push]
    node tools/review.js list
    node tools/review.js remove <id> [--push]
`);
}
