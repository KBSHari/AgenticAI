import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const PUBLIC_DIR = path.resolve(here, '..', 'public');

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS = { 'X-Content-Type-Options': 'nosniff' };

function sendText(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  res.end(body);
}

function parsePathname(rawUrl) {
  try {
    const { pathname } = new URL(rawUrl, 'http://localhost');
    const decoded = decodeURIComponent(pathname);
    if (decoded.includes('\0')) return null;
    return { encoded: pathname, decoded };
  } catch {
    return null;
  }
}

function isInside(root, target) {
  return target === root || target.startsWith(root + path.sep);
}

export function createAppServer({ publicDir = PUBLIC_DIR, log = () => {} } = {}) {
  const root = path.resolve(publicDir);

  return http.createServer(async (req, res) => {
    const parsed = parsePathname(req.url ?? '/');
    const logPath = parsed ? parsed.encoded : '-';
    const respond = (status, sender) => {
      sender();
      log(`${req.method} ${logPath} ${status}`);
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return respond(405, () => sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' }));
    }
    if (!parsed) {
      return respond(404, () => sendText(res, 404, 'Not Found'));
    }

    const relative = parsed.decoded === '/' ? '/index.html' : parsed.decoded;
    const target = path.resolve(root, '.' + relative);

    if (!isInside(root, target)) {
      return respond(403, () => sendText(res, 403, 'Forbidden'));
    }

    try {
      const info = await stat(target);
      if (!info.isFile()) {
        return respond(404, () => sendText(res, 404, 'Not Found'));
      }
      const body = await readFile(target);
      const type = MIME_TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream';
      return respond(200, () => {
        res.writeHead(200, {
          'Content-Type': type,
          'Content-Length': body.length,
          'Cache-Control': 'no-cache',
          ...SECURITY_HEADERS,
        });
        res.end(req.method === 'HEAD' ? undefined : body);
      });
    } catch (error) {
      if (error && ['ENOENT', 'ENOTDIR', 'EINVAL'].includes(error.code)) {
        return respond(404, () => sendText(res, 404, 'Not Found'));
      }
      return respond(500, () => sendText(res, 500, 'Internal Server Error'));
    }
  });
}

function resolvePort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 3000;
}

export function start({ port = resolvePort(process.env.PORT), host = '127.0.0.1' } = {}) {
  const server = createAppServer({ log: (line) => console.log(line) });
  server.on('error', (error) => {
    console.error(`Could not start the server: ${error.code ?? error.message}. Set PORT to use a different port.`);
    process.exit(1);
  });
  server.listen(port, host, () => {
    console.log(`Serving on http://${host}:${port}`);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start();
}
