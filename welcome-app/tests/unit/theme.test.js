import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const SCRIPT = readFileSync(path.resolve(publicDir, 'theme.js'), 'utf8');
const PAGE = readFileSync(path.resolve(publicDir, 'index.html'), 'utf8');

function createPage({ stored, osDark = false, hasMatchMedia = true, readThrows = false, writeThrows = false, removeToggle = false } = {}) {
  const dom = new JSDOM(PAGE, { url: 'http://localhost/', runScripts: 'outside-only' });
  const { window } = dom;
  const messages = [];
  for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    window.console[method] = (...args) => messages.push([method, ...args]);
  }
  if (stored !== undefined) window.localStorage.setItem('theme', stored);
  if (hasMatchMedia) window.matchMedia = (query) => ({ matches: osDark && query.includes('dark') });
  if (readThrows) {
    window.Storage.prototype.getItem = () => {
      throw new window.Error('blocked');
    };
  }
  if (writeThrows) {
    window.Storage.prototype.setItem = () => {
      throw new window.Error('full');
    };
  }
  if (removeToggle) window.document.getElementById('theme-toggle').remove();
  return { window, messages, run: () => window.eval(SCRIPT) };
}

const themeOf = (window) => window.document.documentElement.getAttribute('data-theme');
const toggleOf = (window) => window.document.getElementById('theme-toggle');
const loaded = (window) => vi.waitFor(() => expect(window.document.readyState).toBe('complete'));

describe('theme resolution', () => {
  it.each([
    ['dark', false],
    ['light', true],
  ])('QA-019, QA-022: a stored "%s" wins over the OS preference', (stored, osDark) => {
    const { window, run } = createPage({ stored, osDark });
    run();
    expect(themeOf(window)).toBe(stored);
  });

  it.each([
    [true, 'dark'],
    [false, 'light'],
  ])('QA-019, QA-020: with nothing stored and OS dark=%s the theme is %s', (osDark, expected) => {
    const { window, run } = createPage({ osDark });
    run();
    expect(themeOf(window)).toBe(expected);
  });

  it.each([
    ['blue', true, 'dark'],
    ['', false, 'light'],
    ['DARK', false, 'light'],
    ['dark ', false, 'light'],
    ['light ', true, 'dark'],
  ])('QA-022, QA-023: stored value %j is ignored and the OS preference is used', (stored, osDark, expected) => {
    const { window, run } = createPage({ stored, osDark });
    run();
    expect(themeOf(window)).toBe(expected);
  });

  it('QA-017: a storage read failure falls back to the OS preference without errors', () => {
    const { window, messages, run } = createPage({ readThrows: true, osDark: true });
    expect(run).not.toThrow();
    expect(themeOf(window)).toBe('dark');
    expect(messages).toEqual([]);
  });

  it('falls back to light when matchMedia is missing', () => {
    const { window, run } = createPage({ hasMatchMedia: false });
    run();
    expect(themeOf(window)).toBe('light');
  });

  it('QA-020: loading a page never writes to storage', async () => {
    const { window, run } = createPage({ osDark: true });
    run();
    await loaded(window);
    expect(window.localStorage.length).toBe(0);
  });
});

describe('theme toggle', () => {
  it.each([
    ['light', 'false'],
    ['dark', 'true'],
  ])('QA-001: reveals the toggle with aria-pressed matching the %s theme', async (stored, pressed) => {
    const { window, run } = createPage({ stored });
    expect(toggleOf(window).hasAttribute('hidden')).toBe(true);
    run();
    await loaded(window);
    expect(toggleOf(window).hasAttribute('hidden')).toBe(false);
    expect(toggleOf(window).getAttribute('aria-pressed')).toBe(pressed);
  });

  it('QA-001, QA-003: each click flips the theme, aria-pressed and the saved value', async () => {
    const { window, run } = createPage({ osDark: false });
    run();
    await loaded(window);
    const button = toggleOf(window);

    button.click();
    expect(themeOf(window)).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    button.click();
    expect(themeOf(window)).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(window.localStorage.getItem('theme')).toBe('light');

    for (let i = 0; i < 9; i += 1) button.click();
    expect(themeOf(window)).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('QA-016: a storage write failure still flips the theme with no errors or console output', async () => {
    const { window, messages, run } = createPage({ writeThrows: true });
    run();
    await loaded(window);
    expect(() => toggleOf(window).click()).not.toThrow();
    expect(themeOf(window)).toBe('dark');
    expect(toggleOf(window).getAttribute('aria-pressed')).toBe('true');
    expect(messages).toEqual([]);
  });

  it('QA-024: toggling after an invalid stored value overwrites it with a valid one', async () => {
    const { window, run } = createPage({ stored: 'blue', osDark: false });
    run();
    await loaded(window);
    toggleOf(window).click();
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('QA-021: a change of OS preference after load does not change the theme', async () => {
    const { window, run } = createPage({ osDark: false });
    run();
    await loaded(window);
    window.matchMedia = () => ({ matches: true });
    expect(themeOf(window)).toBe('light');
  });

  it('wires the toggle immediately when the document has already loaded', async () => {
    const { window, run } = createPage({ stored: 'dark' });
    await loaded(window);
    run();
    expect(toggleOf(window).hasAttribute('hidden')).toBe(false);
    expect(toggleOf(window).getAttribute('aria-pressed')).toBe('true');
  });

  it('does nothing and does not throw when the page has no toggle', async () => {
    const { window, messages, run } = createPage({ removeToggle: true, osDark: true });
    expect(run).not.toThrow();
    await loaded(window);
    expect(themeOf(window)).toBe('dark');
    expect(messages).toEqual([]);
  });

  it('QA-041: normal use produces no console output', async () => {
    const { window, messages, run } = createPage({ stored: 'dark' });
    run();
    await loaded(window);
    toggleOf(window).click();
    toggleOf(window).click();
    expect(messages).toEqual([]);
  });
});
