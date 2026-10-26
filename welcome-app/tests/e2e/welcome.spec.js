import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/getting-started.html'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const WIDTHS = [280, 320, 768, 1280, 2560];

function watchProblems(page) {
  const problems = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      problems.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
  });
  return problems;
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

test.describe('content', () => {
  test('TC-001, TC-004: shows the welcome heading and description', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Hari SDLC Agent' })).toBeVisible();
    await expect(page.getByText('automates your software delivery lifecycle')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('TC-007: Get Started opens the Getting Started page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/getting-started\.html$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Getting Started' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to welcome' }).click();
    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Hari SDLC Agent' })).toBeVisible();
  });

  test('TC-009: Get Started works from the keyboard', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/getting-started\.html$/);
  });

  test('TC-009: works with JavaScript disabled', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/getting-started\.html$/);
    await context.close();
  });
});

test.describe('responsive layout', () => {
  for (const url of PAGES) {
    for (const width of WIDTHS) {
      test(`TC-003, TC-006, TC-010 to TC-012: ${url} has no horizontal scroll at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(url);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        for (const locator of [page.getByRole('heading', { level: 1 }), page.locator('main p'), page.locator('main a')]) {
          const box = await locator.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
      });
    }
  }
});

test.describe('console and network cleanliness', () => {
  for (const url of PAGES) {
    test(`TC-013 to TC-015: ${url} loads with no console messages, failed requests or errors`, async ({ page }) => {
      const problems = watchProblems(page);
      const requested = [];
      page.on('request', (request) => requested.push(request.url()));
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
      expect(requested.some((requestUrl) => requestUrl.endsWith('/favicon.ico'))).toBe(false);
    });
  }

  test('TC-028: every request stays on the app origin and no cookies or storage are used', async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL).origin;
    const requested = [];
    page.on('request', (request) => requested.push(request.url()));
    for (const url of PAGES) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }
    for (const requestUrl of requested.filter((value) => !value.startsWith('data:'))) {
      expect(new URL(requestUrl).origin).toBe(origin);
    }
    expect(await context.cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
    expect(storage).toEqual({ local: 0, session: 0 });
  });
});

test.describe('accessibility', () => {
  for (const url of PAGES) {
    test(`TC-022: ${url} has no WCAG 2.1 A or AA violations`, async ({ page }) => {
      await page.goto(url);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
      expect(results.passes.map((rule) => rule.id)).toContain('color-contrast');
    });
  }

  test('TC-023, TC-024: Get Started shows a visible focus indicator with enough contrast', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name: 'Get Started' });
    await expect(link).toBeFocused();
    const style = await link.evaluate((element) => {
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
});

test.describe('size and speed', () => {
  test('TC-025, TC-026: the welcome page is under 100 KB and only loads HTML and CSS', async ({ page }) => {
    const bodies = [];
    const resourceTypes = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('data:')) resourceTypes.push(request.resourceType());
    });
    page.on('response', (response) => bodies.push(response.body().then((body) => body.length)));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const total = (await Promise.all(bodies)).reduce((sum, size) => sum + size, 0);
    expect(total).toBeLessThan(100 * 1024);
    expect([...new Set(resourceTypes)].sort()).toEqual(['document', 'stylesheet']);
  });

  test('TC-027: largest contentful paint is under 2.5 s with network and CPU throttling', async ({ page, context }) => {
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
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(2500);
  });
});

test.describe('server safety', () => {
  test('TC-008, TC-030: unknown paths give 404 and traversal never exposes files', async ({ request }) => {
    expect((await request.get('/does-not-exist')).status()).toBe(404);
    const traversal = await request.get('/..%2fpackage.json');
    expect([403, 404]).toContain(traversal.status());
    expect(await traversal.text()).not.toContain('devDependencies');
  });
});
