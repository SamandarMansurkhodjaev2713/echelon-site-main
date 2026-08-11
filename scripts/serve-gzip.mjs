/*
 * Static server that gzips text responses and sets far-future cache headers on
 * hashed assets — i.e. what GitHub Pages actually does. `astro preview` serves
 * everything uncompressed, which makes a 180 KB inlined-CSS document look far
 * worse than it is in production and turns every Lighthouse number pessimistic.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.join(process.cwd(), 'dist');
const BASE = '/echelon-site-main';
const PORT = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (!url.startsWith(BASE)) {
      res.writeHead(404).end('not found');
      return;
    }
    let rel = url.slice(BASE.length) || '/';
    let file = path.join(ROOT, rel);
    if (rel.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const alt = path.join(file, 'index.html');
      file = fs.existsSync(alt) ? alt : file;
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/html' }).end('<title>404: Not Found</title>');
      return;
    }

    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'cache-control': file.includes('_astro') ? 'public, max-age=31536000, immutable' : 'public, max-age=600',
    };

    const accepts = String(req.headers['accept-encoding'] || '');
    if (COMPRESSIBLE.has(ext) && accepts.includes('gzip')) {
      const gz = zlib.gzipSync(body, { level: 9 });
      res.writeHead(200, { ...headers, 'content-encoding': 'gzip', 'content-length': gz.length });
      res.end(gz);
      return;
    }
    res.writeHead(200, { ...headers, 'content-length': body.length });
    res.end(body);
  })
  .listen(PORT, () => console.log(`gzip static server on http://localhost:${PORT}${BASE}/`));
