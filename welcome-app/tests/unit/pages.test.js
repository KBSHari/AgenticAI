import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { within } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

const DESCRIPTION =
  'Hari SDLC Agent automates your software delivery lifecycle, from Jira ticket to pull request, with human approval at every step.';

function loadPage(fileName) {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(path.resolve(testDir, '..', '..', 'public', fileName), 'utf8');
  return new JSDOM(html).window.document;
}

function sentenceCount(text) {
  return text.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0).length;
}

describe('welcome page (index.html)', () => {
  const doc = loadPage('index.html');
  const page = within(doc.body);

  it('TC-001: has exactly one h1 with the welcome text', () => {
    const headings = page.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent.trim()).toBe('Welcome to Hari SDLC Agent');
  });

  it('TC-002: has no duplicate or empty level-1 headings', () => {
    const h1s = [...doc.querySelectorAll('h1')];
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent.trim().length).toBeGreaterThan(0);
  });

  it('TC-004: has the description paragraph directly after the h1', () => {
    const next = doc.querySelector('h1').nextElementSibling;
    expect(next.tagName).toBe('P');
    expect(next.textContent.trim()).toBe(DESCRIPTION);
  });

  it('TC-005: description is one or two sentences', () => {
    const count = sentenceCount(doc.querySelector('h1').nextElementSibling.textContent);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(2);
  });

  it('TC-007 (structure): has a Get Started link to the placeholder page', () => {
    const link = page.getByRole('link', { name: 'Get Started' });
    expect(link.getAttribute('href')).toBe('getting-started.html');
  });

  it('AC-008 (structure): has a language, a title and exactly one main landmark', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.title).toBe('Welcome to Hari SDLC Agent');
    expect(page.getAllByRole('main')).toHaveLength(1);
  });
});

describe('getting started page (getting-started.html)', () => {
  const doc = loadPage('getting-started.html');
  const page = within(doc.body);

  it('has exactly one h1 reading Getting Started', () => {
    const headings = page.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent.trim()).toBe('Getting Started');
  });

  it('has a Back to welcome link to the welcome page', () => {
    expect(page.getByRole('link', { name: 'Back to welcome' }).getAttribute('href')).toBe('index.html');
  });

  it('has a language, a title and exactly one main landmark', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.title.length).toBeGreaterThan(0);
    expect(page.getAllByRole('main')).toHaveLength(1);
  });
});

describe.each(['index.html', 'getting-started.html'])('TC-029 privacy and CSP structure: %s', (fileName) => {
  const doc = loadPage(fileName);

  it('declares a Content Security Policy that allows only same-origin resources and no scripts', () => {
    const meta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(meta).not.toBeNull();
    const policy = meta.getAttribute('content');
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'none'");
    expect(policy).toContain("img-src 'self' data:");
  });

  it('has no external or protocol-relative src/href values', () => {
    const values = [...doc.querySelectorAll('[src],[href]')].map((el) => el.getAttribute('src') ?? el.getAttribute('href'));
    for (const value of values) {
      expect(value).not.toMatch(/^(https?:)?\/\//i);
    }
  });

  it('has no script elements and no inline style attributes', () => {
    expect(doc.querySelectorAll('script')).toHaveLength(0);
    expect(doc.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('links the shared stylesheet', () => {
    expect(doc.querySelector('link[rel="stylesheet"]').getAttribute('href')).toBe('styles.css');
  });
});
