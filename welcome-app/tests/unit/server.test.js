// @vitest-environment node
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createAppServer, start, MIME_TYPES } from '../../server/server.js';

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function request(port, urlPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

describe('static server serving the real public directory', () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createAppServer();
    port = await listen(server);
  });

  afterAll(() => close(server));

  it('TC-008: serves the root and both pages with HTML content type', async () => {
    for (const urlPath of ['/', '/index.html', '/getting-started.html']) {
      const res = await request(port, urlPath);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe(MIME_TYPES['.html']);
    }
    const root = await request(port, '/');
    expect(root.body).toContain('Welcome to Hari SDLC Agent');
  });

  it('serves the stylesheet with CSS content type', async () => {
    const res = await request(port, '/styles.css');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(MIME_TYPES['.css']);
  });

  it('TC-008: returns a generic 404 for an unknown path', async () => {
    const res = await request(port, '/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toBe('Not Found');
  });

  it('returns 404 for malformed or null-byte paths', async () => {
    for (const urlPath of ['/%00', '/%E0%A4%A']) {
      const res = await request(port, urlPath);
      expect(res.status).toBe(404);
    }
  });

  it('TC-030: never returns file contents for traversal attempts', async () => {
    const attempts = [
      '/../package.json',
      '/%2e%2e/package.json',
      '/..%2fpackage.json',
      '/%2e%2e%2f%2e%2e%2fserver/server.js',
      '/..%5cpackage.json',
      '/..%2F..%2Fnode_modules',
    ];
    for (const urlPath of attempts) {
      const res = await request(port, urlPath);
      expect([403, 404]).toContain(res.status);
      expect(res.body).not.toContain('createAppServer');
      expect(res.body).not.toContain('devDependencies');
    }
  });

  it('TC-030: rejects methods other than GET and HEAD with 405 and an Allow header', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const res = await request(port, '/', method);
      expect(res.status).toBe(405);
      expect(res.headers.allow).toBe('GET, HEAD');
    }
  });

  it('answers HEAD without a body', async () => {
    const res = await request(port, '/', 'HEAD');
    expect(res.status).toBe(200);
    expect(res.body).toBe('');
  });

  it('TC-030: sets nosniff on success and error responses', async () => {
    for (const [urlPath, method] of [['/', 'GET'], ['/missing', 'GET'], ['/..%2fpackage.json', 'GET'], ['/', 'POST']]) {
      const res = await request(port, urlPath, method);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    }
  });
});

describe('static server with a temporary public directory', () => {
  let dir;
  let server;
  let port;
  const lines = [];

  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'welcome-app-'));
    await mkdir(path.join(dir, 'sub'));
    await writeFile(path.join(dir, 'note.txt'), 'hello');
    await writeFile(path.join(dir, 'data.bin'), 'bytes');
    server = createAppServer({ publicDir: dir, log: (line) => lines.push(line) });
    port = await listen(server);
  });

  afterAll(async () => {
    await close(server);
    await rm(dir, { recursive: true, force: true });
  });

  it('maps file extensions to content types and falls back to octet-stream', async () => {
    expect((await request(port, '/note.txt')).headers['content-type']).toBe(MIME_TYPES['.txt']);
    expect((await request(port, '/data.bin')).headers['content-type']).toBe('application/octet-stream');
  });

  it('does not list directories or serve a missing root index', async () => {
    expect((await request(port, '/sub')).status).toBe(404);
    expect((await request(port, '/')).status).toBe(404);
  });

  it('logs method, path and status only, never the query string', async () => {
    lines.length = 0;
    await request(port, '/note.txt?token=secret');
    expect(lines).toEqual(['GET /note.txt 200']);
  });
});

describe('start()', () => {
  it('listens on the loopback address and can be closed', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = start({ port: 0 });
    await new Promise((resolve) => server.once('listening', resolve));
    expect(server.address().address).toBe('127.0.0.1');
    await close(server);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
