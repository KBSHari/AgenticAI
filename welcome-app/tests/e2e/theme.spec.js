import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/getting-started.html'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const WIDTHS = [280, 320, 768, 1280, 2560];
const THEMES = ['light', 'dark'];
const BACKGROUND = { light: 'rgb(255, 255, 255)', dark: 'rgb(18, 18, 18)' };

test.use({ colorScheme: 'light' });

function watchProblems(page) {
  const problems = [];
  page.on('console', (message) => problems.push(`console.${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
  });
  return problems;
}

// Init scripts re-run on every navigation, so seed storage only once per tab.
function seedStorage(page, value) {
  return page.addInitScript((seed) => {
    if (!sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('__seeded', '1');
      localStorage.setItem('theme', seed);
    }
  }, value);
}

function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function parseRgb(value) {
  return value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
}

const toggleOf = (page) => page.getByRole('button', { name: 'Dark mode' });
const themeOf = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const storedOf = (page) => page.evaluate(() => localStorage.getItem('theme'));
const backgroundOf = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('toggle', () => {
  test('QA-001, QA-002: clicking switches theme, keeps the page and updates aria-pressed', async ({ page }) => {
    await page.goto('/');
    await expect(toggleOf(page)).toBeVisible();
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'false');
    expect(await themeOf(page)).toBe('light');
    const url = page.url();

    await toggleOf(page).click();
    expect(await themeOf(page)).toBe('dark');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await backgroundOf(page)).toBe(BACKGROUND.dark);
    expect(page.url()).toBe(url);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Hari SDLC Agent' })).toBeVisible();

    await toggleOf(page).click();
    expect(await themeOf(page)).toBe('light');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'false');
    expect(await backgroundOf(page)).toBe(BACKGROUND.light);
  });

  test('QA-003: ten rapid clicks end in the matching state', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 10; i += 1) await toggleOf(page).click();
    expect(await themeOf(page)).toBe('light');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('QA-004, QA-005, QA-006: keyboard operation and tab order', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(toggleOf(page)).toBeFocused();

    await page.keyboard.press('Enter');
    expect(await themeOf(page)).toBe('dark');
    await page.keyboard.press('Space');
    expect(await themeOf(page)).toBe('light');
    await page.keyboard.press('Escape');
    await page.keyboard.press('a');
    expect(await themeOf(page)).toBe('light');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeFocused();
  });

  for (const theme of THEMES) {
    test(`QA-006: the toggle shows a visible focus indicator in ${theme} mode`, async ({ page }) => {
      await seedStorage(page, theme);
      await page.goto('/');
      await page.keyboard.press('Tab');
      await expect(toggleOf(page)).toBeFocused();
      const style = await toggleOf(page).evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          outlineStyle: computed.outlineStyle,
          outlineWidth: parseFloat(computed.outlineWidth),
          outlineColor: computed.outlineColor,
          pageBackground: getComputedStyle(document.body).backgroundColor,
        };
      });
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(parseRgb(style.outlineColor), parseRgb(style.pageBackground))).toBeGreaterThanOrEqual(3);
    });
  }
});

test.describe('theme colours', () => {
  test('QA-007, QA-008: light values are unchanged and dark values replace them', async ({ page }) => {
    const read = () =>
      page.evaluate(() => {
        const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
        return {
          background: color('body', 'backgroundColor'),
          heading: color('h1', 'color'),
          text: color('main p', 'color'),
          buttonBackground: color('.button', 'backgroundColor'),
          buttonText: color('.button', 'color'),
        };
      });
    await page.goto('/');
    expect(await read()).toEqual({
      background: 'rgb(255, 255, 255)',
      heading: 'rgb(26, 26, 26)',
      text: 'rgb(64, 64, 64)',
      buttonBackground: 'rgb(11, 87, 208)',
      buttonText: 'rgb(255, 255, 255)',
    });
    await toggleOf(page).click();
    expect(await read()).toEqual({
      background: 'rgb(18, 18, 18)',
      heading: 'rgb(242, 242, 242)',
      text: 'rgb(200, 200, 200)',
      buttonBackground: 'rgb(138, 180, 248)',
      buttonText: 'rgb(11, 18, 32)',
    });
  });

  test('QA-007: the Back to welcome link changes colour on the Getting Started page', async ({ page }) => {
    await page.goto('/getting-started.html');
    const link = page.getByRole('link', { name: 'Back to welcome' });
    await expect(link).toHaveCSS('color', 'rgb(11, 87, 208)');
    await toggleOf(page).click();
    await expect(link).toHaveCSS('color', 'rgb(138, 180, 248)');
  });

  test('QA-009: the Get Started button keeps 4.5:1 contrast on hover in dark mode', async ({ page }) => {
    await seedStorage(page, 'dark');
    await page.goto('/');
    const link = page.getByRole('link', { name: 'Get Started' });
    for (const hover of [false, true]) {
      if (hover) await link.hover();
      const colors = await link.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { text: computed.color, background: computed.backgroundColor };
      });
      expect(contrastRatio(parseRgb(colors.text), parseRgb(colors.background))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe('persistence', () => {
  test('QA-013, QA-014: dark persists across reload and pages, applied before first paint', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        window.__atDomReady = {
          theme: document.documentElement.getAttribute('data-theme'),
          background: getComputedStyle(document.body).backgroundColor,
        };
      });
    });
    await page.goto('/');
    await toggleOf(page).click();
    expect(await storedOf(page)).toBe('dark');

    await page.reload();
    expect(await page.evaluate(() => window.__atDomReady)).toEqual({ theme: 'dark', background: BACKGROUND.dark });
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/getting-started\.html$/);
    expect(await themeOf(page)).toBe('dark');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Back to welcome' }).click();
    expect(await themeOf(page)).toBe('dark');
  });

  test('QA-015: a saved light choice overrides an OS dark preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect(await themeOf(page)).toBe('dark');
    await toggleOf(page).click();
    expect(await themeOf(page)).toBe('light');
    await page.reload();
    expect(await themeOf(page)).toBe('light');
    expect(await storedOf(page)).toBe('light');
  });

  test('QA-019: with nothing saved and OS dark the page is dark and nothing is written', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect(await themeOf(page)).toBe('dark');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test('QA-020: with nothing saved and OS light the page is light and nothing is written', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    expect(await themeOf(page)).toBe('light');
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test('QA-021: an OS preference change while the page is open does not change the theme', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await themeOf(page)).toBe('light');
  });
});

test.describe('invalid and unavailable storage', () => {
  const INVALID = [
    ['blue', 'dark', 'dark'],
    ['', 'light', 'light'],
    ['DARK', 'light', 'light'],
    ['dark ', 'light', 'light'],
    ['light ', 'dark', 'dark'],
  ];
  for (const [stored, os, expected] of INVALID) {
    test(`QA-022, QA-023: stored ${JSON.stringify(stored)} with OS ${os} is ignored`, async ({ page }) => {
      const problems = watchProblems(page);
      await seedStorage(page, stored);
      await page.emulateMedia({ colorScheme: os });
      await page.goto('/');
      expect(await themeOf(page)).toBe(expected);
      expect(problems).toEqual([]);
    });
  }

  test('QA-024: toggling after an invalid value saves a valid one', async ({ page }) => {
    await seedStorage(page, 'blue');
    await page.goto('/');
    await toggleOf(page).click();
    expect(await storedOf(page)).toBe('dark');
  });

  test('QA-016, QA-018: a storage write failure still flips the theme, silently, and is not remembered', async ({ page }) => {
    const problems = watchProblems(page);
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new Error('storage is full');
      };
    });
    await page.goto('/');
    await toggleOf(page).click();
    expect(await themeOf(page)).toBe('dark');
    await expect(toggleOf(page)).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    expect(await themeOf(page)).toBe('light');
    expect(problems).toEqual([]);
  });

  test('QA-017: a storage read failure falls back to the OS preference silently', async ({ page }) => {
    const problems = watchProblems(page);
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('storage is blocked');
      };
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect(await themeOf(page)).toBe('dark');
    expect(problems).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  for (const scheme of THEMES) {
    test(`QA-034, QA-035, QA-036: toggle hidden, navigation works and the OS ${scheme} preference is followed via CSS`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, baseURL, colorScheme: scheme });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('#theme-toggle')).toBeHidden();
      await expect(page.getByRole('button')).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
      await expect(page.locator('body')).toHaveCSS('background-color', BACKGROUND[scheme]);
      await page.getByRole('link', { name: 'Get Started' }).click();
      await expect(page).toHaveURL(/\/getting-started\.html$/);
      await context.close();
    });
  }
});

test.describe('accessibility in both themes', () => {
  for (const url of PAGES) {
    test(`QA-010, QA-011: ${url} has no WCAG 2.1 A or AA violations in dark mode`, async ({ page }) => {
      await seedStorage(page, 'dark');
      await page.goto(url);
      expect(await themeOf(page)).toBe('dark');
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
      expect(results.passes.map((rule) => rule.id)).toContain('color-contrast');
    });

    test(`QA-012: ${url} has no violations in light mode with the toggle focused`, async ({ page }) => {
      await page.goto(url);
      await toggleOf(page).focus();
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('responsive layout in both themes', () => {
  for (const theme of THEMES) {
    for (const url of PAGES) {
      for (const width of WIDTHS) {
        test(`QA-037 to QA-039: ${theme} ${url} at ${width}px has no horizontal scroll and a usable toggle`, async ({ page }) => {
          await seedStorage(page, theme);
          await page.setViewportSize({ width, height: 800 });
          await page.goto(url);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
          const toggle = await toggleOf(page).boundingBox();
          const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
          expect(toggle.x).toBeGreaterThanOrEqual(0);
          expect(toggle.x + toggle.width).toBeLessThanOrEqual(width);
          expect(toggle.height).toBeGreaterThanOrEqual(44);
          expect(toggle.y + toggle.height).toBeLessThanOrEqual(heading.y);
        });
      }
    }
  }
});

test.describe('console, network and performance', () => {
  for (const theme of THEMES) {
    for (const url of PAGES) {
      test(`QA-030, QA-041: ${theme} ${url} is clean and stays on the app origin`, async ({ page, baseURL }) => {
        const problems = watchProblems(page);
        const requested = [];
        const types = new Set();
        page.on('request', (request) => {
          if (request.url().startsWith('data:')) return;
          requested.push(request.url());
          types.add(request.resourceType());
        });
        await seedStorage(page, theme);
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await toggleOf(page).click();
        await toggleOf(page).click();
        expect(problems).toEqual([]);
        for (const requestUrl of requested) expect(new URL(requestUrl).origin).toBe(new URL(baseURL).origin);
        expect([...types].sort()).toEqual(['document', 'script', 'stylesheet']);
      });
    }
  }

  test('QA-040, QA-042: with a saved dark theme the page stays small and fast and never paints light', async ({ page, context }) => {
    const bodies = [];
    page.on('response', (response) => bodies.push(response.body().then((body) => body.length)));
    await seedStorage(page, 'dark');
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        window.__backgroundAtDomReady = getComputedStyle(document.body).backgroundColor;
      });
    });
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const lcp = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let latest = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) latest = entry.startTime;
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(latest);
          }, 500);
        }),
    );
    const total = (await Promise.all(bodies)).reduce((sum, size) => sum + size, 0);
    expect(total).toBeLessThan(100 * 1024);
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(2500);
    expect(await page.evaluate(() => window.__backgroundAtDomReady)).toBe(BACKGROUND.dark);
  });
});

test.describe('navigation', () => {
  for (const theme of THEMES) {
    test(`QA-033: Get Started and Back to welcome work in ${theme} mode`, async ({ page }) => {
      await seedStorage(page, theme);
      await page.goto('/');
      await page.getByRole('link', { name: 'Get Started' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Getting Started' })).toBeVisible();
      await page.getByRole('link', { name: 'Back to welcome' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Hari SDLC Agent' })).toBeVisible();
      expect(await themeOf(page)).toBe(theme);
    });
  }
});

test.describe('theme script delivery', () => {
  test('QA-025: the theme script is served as JavaScript and is not sniffable', async ({ request }) => {
    const response = await request.get('/theme.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('text/javascript; charset=utf-8');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });
});
