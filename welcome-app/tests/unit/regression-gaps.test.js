// @vitest-environment node
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const serverFile = path.join(appDir, 'server', 'server.js');

async function readAppFile(...parts) {
  return readFile(path.join(appDir, ...parts), 'utf8');
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function runServer(port) {
  const child = spawn(process.execPath, [serverFile], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  const exited = new Promise((resolve) => child.on('exit', (code) => resolve(code)));
  const ready = new Promise((resolve) => {
    const timer = setInterval(() => {
      if (output.includes('Serving on')) {
        clearInterval(timer);
        resolve(true);
      }
    }, 25);
    exited.then(() => {
      clearInterval(timer);
      resolve(false);
    });
  });
  return { child, exited, ready, getOutput: () => output };
}

describe('@regression SCRUM-1 AC-007 README instructions match the project', () => {
  it('TC-019: documents install, browser install, start and test commands that exist', async () => {
    const readme = await readAppFile('README.md');
    const pkg = JSON.parse(await readAppFile('package.json'));

    expect(readme).toContain('npm install');
    expect(readme).toContain('npx playwright install chromium');
    expect(readme).toContain('npm start');
    expect(readme).toContain('npm test');
    expect(readme).toContain('npm run test:unit');
    expect(readme).toContain('npm run test:e2e');

    for (const script of ['start', 'test', 'test:unit', 'test:e2e']) {
      expect(pkg.scripts, `package.json script "${script}"`).toHaveProperty(script);
    }
  });

  it('TC-019: tells the reader which address to open', async () => {
    const readme = await readAppFile('README.md');
    expect(readme).toContain('http://127.0.0.1:3000');
  });

  it('TC-018: points a missing Chromium to the documented install command', async () => {
    const readme = await readAppFile('README.md');
    const config = await readAppFile('playwright.config.js');
    expect(config).toContain("name: 'chromium'");
    expect(readme).toMatch(/browser is missing, install it with `npx playwright install chromium`/);
  });

  it('TC-020: declares a Node engine range that the README states', async () => {
    const pkg = JSON.parse(await readAppFile('package.json'));
    const readme = await readAppFile('README.md');
    expect(pkg.engines.node).toBe('>=20');
    expect(readme).toMatch(/Node\.js 20 or newer/);
  });

  it('TC-020: current Node satisfies the declared engine range', () => {
    expect(Number(process.versions.node.split('.')[0])).toBeGreaterThanOrEqual(20);
  });
});

describe('@regression SCRUM-1 AC-007 PORT override', () => {
  it('TC-021: documents the PORT override for both shells', async () => {
    const readme = await readAppFile('README.md');
    expect(readme).toContain('PORT=3100 npm start');
    expect(readme).toContain('$env:PORT=3100; npm start');
  });

  it('TC-021: fails with a clear message when the port is already in use', async () => {
    const port = await freePort();
    const blocker = net.createServer();
    await new Promise((resolve) => blocker.listen(port, '127.0.0.1', resolve));
    const run = runServer(port);
    try {
      const code = await run.exited;
      expect(code).not.toBe(0);
      expect(run.getOutput()).toContain('Set PORT to use a different port');
    } finally {
      await new Promise((resolve) => blocker.close(resolve));
    }
  }, 15000);

  it('TC-021: starts on the PORT override and serves the welcome page', async () => {
    const port = await freePort();
    const run = runServer(port);
    try {
      expect(await run.ready).toBe(true);
      const response = await fetch(`http://127.0.0.1:${port}/`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('Welcome to Hari SDLC Agent');
    } finally {
      run.child.kill();
      await run.exited;
    }
  }, 15000);
});

describe('@regression SCRUM-1 AC-006 failing assertions fail the test command', () => {
  it('TC-016: the single test command runs unit tests before end-to-end tests', async () => {
    const pkg = JSON.parse(await readAppFile('package.json'));
    expect(pkg.scripts.test).toBe('npm run test:unit && npm run test:e2e');
  });

  it('TC-017: a changed heading makes the structure tests exit non-zero and name the assertion', async () => {
    const sandbox = await mkdtemp(path.join(appDir, '.tmp-mutation-'));
    try {
      await cp(path.join(appDir, 'public'), path.join(sandbox, 'public'), { recursive: true });
      await cp(path.join(appDir, 'tests', 'unit', 'pages.test.js'), path.join(sandbox, 'tests', 'unit', 'pages.test.js'));
      await cp(path.join(appDir, 'vitest.config.js'), path.join(sandbox, 'vitest.config.js'));

      const indexPath = path.join(sandbox, 'public', 'index.html');
      const original = await readFile(indexPath, 'utf8');
      const mutated = original.replace(/(<h1[^>]*>)[^<]*(<\/h1>)/, '$1Mutated heading$2');
      expect(mutated).not.toBe(original);
      await writeFile(indexPath, mutated);

      const vitestBin = path.join(appDir, 'node_modules', 'vitest', 'vitest.mjs');
      const result = spawnSync(process.execPath, [vitestBin, 'run', '--root', sandbox], {
        cwd: sandbox,
        encoding: 'utf8',
        env: { ...process.env, CI: '1' },
      });

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toContain('TC-001');
    } finally {
      await rm(sandbox, { recursive: true, force: true });
    }
  }, 60000);
});
