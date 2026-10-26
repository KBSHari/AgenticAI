# Implementation Plan: SCRUM-1

## Pipeline Context

- **Ticket:** SCRUM-1 (Create a Welcome Page Hari SDLC Agent), classification Small Feature
- **Mode:** gates
- **Pipeline state:** docs/artifacts/SCRUM-1/.state/pipeline_state_SCRUM-1.json
- **Artifacts:** docs/artifacts/SCRUM-1/ (ph1_problem_spec.md, ph2_design_spec.md, ph3b_qa_test_plan.md). There is no ph3_design_review.md: a Small Feature has no design-review phase.
- **Working directory for all commands:** `welcome-app/` (relative to the workspace root `SdlcTemplate/welcome/`) unless stated otherwise.

## Problem Summary

A new user opening the Hari SDLC Agent app has no landing page explaining what it is or how to begin. We are building a clean, responsive, accessible, static two-page site (welcome page plus a placeholder Getting Started page) with automated tests and local run instructions. Greenfield: everything is new, nothing existing is modified.

## Key Requirements & Constraints

| ID | Priority | Description |
|----|----------|-------------|
| REQ-001 | P0 | Single h1 "Welcome to Hari SDLC Agent" |
| REQ-002 | P0 | Short 1-2 sentence description |
| REQ-003 | P0 | Visible "Get Started" button navigating to a placeholder destination |
| REQ-004 | P0 | Responsive from 320px to desktop, no horizontal scrolling |
| REQ-005 | P0 | Zero browser console errors or warnings |
| REQ-006 | P0 | Automated tests for key elements, one command |
| REQ-007 | P0 | Instructions to install, run and test locally |
| REQ-008 | P1 | WCAG 2.1 AA |
| REQ-009 | P1 | Under 100 KB, LCP under 2.5 s |
| REQ-010 | P0 | No personal data, cookies, analytics, third-party scripts or network calls |

**Constraints:**
- Plain static HTML and CSS, no client-side JavaScript, no framework (ADR-001, ADR-004).
- English only; no feature flags (client has no flag system).
- Only `welcome-app/public/` is served (ADR-006).
- Five dev dependencies only, no runtime dependencies (ADR-002): `vitest`, `jsdom`, `@testing-library/dom`, `@playwright/test`, `@axe-core/playwright`.
- Client guardrails: test every change immediately, change only what is requested, never commit credentials, never delete a file without developer confirmation, no PII in logs.

**Non-Goals:** real onboarding flow (NG-001), authentication or personalisation (NG-002), i18n and analytics (NG-003), backend, database or API work (NG-004).

## Architecture Summary

Pattern `static_site`. Two HTML pages and one shared stylesheet in `welcome-app/public/`, served by a small zero-dependency Node server (`welcome-app/server/server.js`) that binds to loopback, serves only `public/`, rejects path traversal and sets `X-Content-Type-Options: nosniff`. Each HTML file carries a Content Security Policy meta element. "Get Started" is an anchor styled as a button (ADR-003). Tests: Vitest with jsdom and Testing Library for HTML structure and the server; Playwright with axe for browser behaviour (ADR-002). `"type": "module"` is set in package.json so all `.js` files use ES modules.

### Content contract (use verbatim)

| Item | Value |
|------|-------|
| Welcome page title and h1 | Welcome to Hari SDLC Agent |
| Description | Hari SDLC Agent automates your software delivery lifecycle, from Jira ticket to pull request, with human approval at every step. |
| Call to action | Anchor labelled "Get Started", href `getting-started.html` |
| Getting Started title and h1 | Getting Started |
| Placeholder text | One short sentence saying setup guidance is coming soon |
| Back link | Anchor labelled "Back to welcome", href `index.html` |
| Landmarks | Exactly one `main` per page; root element has a `lang` attribute (en) |
| CSP meta (both pages) | `default-src 'self'; script-src 'none'; img-src 'self' data:` |
| Favicon | Inline data-URI icon link so no favicon request is made |
| Forbidden | Inline `style` attributes, inline scripts, any `http:`, `https:` or `//` URL, web fonts, images other than the inline favicon |

### HTTP contract for the server

| Request | Response |
|---------|----------|
| GET `/` | 200 serving `index.html`, `text/html; charset=utf-8` |
| GET `/getting-started.html` | 200, `text/html; charset=utf-8` |
| GET `/styles.css` | 200, `text/css; charset=utf-8` |
| Unknown path | 404, short generic plain-text body |
| Path escaping `public/` (parent segments, encoded variants, absolute paths) | 403 or 404, never file contents |
| Method other than GET or HEAD | 405 with `Allow: GET, HEAD` |
| Read error | 500, generic body, no stack trace or filesystem path |

All responses carry `X-Content-Type-Options: nosniff`. Bind to `127.0.0.1` only. Port from the `PORT` environment variable, default 3000. Log only the start-up line and `method path status` per request; never client address, headers or query strings. The module must export a factory so the unit tests can start an in-process instance, and start listening only when run directly.

### Styling guidance

System font stack only. A centred content column with a maximum width and fluid padding; fluid type sizing; long words must wrap (no horizontal overflow at 320px). Body text and the button text must reach 4.5:1 contrast, the focus indicator 3:1 against its surroundings. Suggested starting values (verify with axe and the contrast test): body text dark grey on white, button blue background with white text, a 3px solid dark focus ring with offset. A visible focus style is mandatory and must never be removed without replacement. No inline styles (CSP).

## Design Review Conditions

None. A Small Feature has no design review. Flags raised in Phase 2 were presented at the Phase 2 gate and approved without changes, so they are treated as accepted:

- F-1: Get Started is a link styled as a button (role link). Tests query the link role.
- F-2: LCP is measured on localhost (lower bound only).
- F-3: Only Chromium is automated; other browsers are a manual smoke check.
- F-4 and F-5: see Risks.

## Affected Repos

Single-repo change: new directory `welcome-app/` in this workspace (`SdlcTemplate/welcome/`). The git root is the user's home directory and has no remote configured; this does not affect implementation but must be resolved before Phase 10 (PR creation). `affected_repos` in pipeline state remains empty and unresolved.

## Pre-Implementation Baseline

- No application and no tests exist. Baseline test counts: 0 passed, 0 failed, 0 tests.
- Record this in `ph5_6_impl_manifest.md` under Baseline Test Counts.
- Toolchain check before starting: Node.js v24.15.0 and npm 11.12.1 were observed available.

## Implementation Steps

### Execution Mode: waves

12 files exceed the 8-file threshold, so wave-based execution applies (see Wave Plan). Within a wave, files are independent and may be written in parallel; run the stated checks after each wave. Per-file diff review (Accept or Reject) still applies to every file; present all files of a wave together at the end of the wave.

### Setup actions (require user confirmation before running; they download from the public npm registry)

| When | Action | Purpose |
|------|--------|---------|
| After Step 3 (package.json) and before the first test runs | `npm install` in `welcome-app/` | Installs the five dev dependencies and generates `package-lock.json` (commit the lockfile) |
| Before the first end-to-end run | `npx playwright install chromium` | Downloads the Chromium browser used by Playwright |

If a download is blocked, stop and report; do not work around it.

### Step 1: welcome-app/public/styles.css (new) [COMP-003]

- **Purpose:** Shared responsive stylesheet for both pages.
- **Dependencies:** none (Wave 0).
- **Key notes:** Follow Styling guidance. Class names in lowercase kebab-case. No ID selectors, no `@import`, no `url()` to external resources, no web fonts. Must stay small (the whole welcome page must be under 100 KB).
- **Acceptance criteria:** AC-004 (REQ-004), AC-008 (REQ-008), AC-009 (REQ-009).
- **Verify:** file non-empty and contains no `http`, `@import` or `@font-face` (`grep` check); full verification at Step 11 (e2e).

### Step 2: welcome-app/server/server.js (new) [COMP-004]

- **Purpose:** Zero-dependency local static server.
- **Dependencies:** none (Wave 0). Uses only Node built-in modules.
- **Key notes:** Implement the HTTP contract. Resolve each request path against the absolute path of `welcome-app/public/` and reject anything whose resolved path does not stay inside it; decode the URL once and reject null bytes. No directory listings. Export a factory (and the content-type map) for COMP-006; start listening only when executed directly. Print the listening URL on start-up.
- **Acceptance criteria:** AC-010 (REQ-010), AC-007 (REQ-007), AC-003 (REQ-003, target availability).
- **Verify:** `node --check server/server.js`; full verification at Step 10 (`npm run test:unit`).

### Step 3: welcome-app/package.json (new) [COMP-008]

- **Purpose:** npm manifest.
- **Dependencies:** none (Wave 0).
- **Key notes:** `"type": "module"`, `"private": true`, engines Node 20 or newer. Scripts: `start` (runs the server), `test` (runs unit tests then end-to-end tests), `test:unit` (Vitest run), `test:e2e` (Playwright test). Dev dependencies exactly: vitest, jsdom, @testing-library/dom, @playwright/test, @axe-core/playwright. No runtime dependencies. Do not hand-write version numbers from memory; let `npm install --save-dev` resolve them, then keep the resolved ranges.
- **Acceptance criteria:** AC-006 (REQ-006), AC-007 (REQ-007).
- **Verify:** `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` parses; then run the install setup action.

### Step 4: welcome-app/.gitignore (new) [COMP-012]

- **Purpose:** Ignore generated files.
- **Dependencies:** none (Wave 0).
- **Key notes:** Ignore `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`. Do not ignore `package-lock.json`.
- **Acceptance criteria:** supports AC-007.
- **Verify:** `git check-ignore welcome-app/node_modules` reports ignored after install.

### Step 5: welcome-app/public/index.html (new) [COMP-001]

- **Purpose:** Welcome page.
- **Dependencies:** COMP-003 (stylesheet), Wave 1.
- **Key notes:** Follow the Content contract verbatim: language attribute, charset, viewport meta, CSP meta, inline-data favicon, stylesheet link, one `main` containing the single h1, the description paragraph and the Get Started anchor styled via a class. No scripts, no inline styles, no external URLs.
- **Acceptance criteria:** AC-001 (REQ-001), AC-002 (REQ-002), AC-003 (REQ-003), AC-005, AC-008, AC-010.
- **Verify:** `npm run test:unit` once Step 9 exists; until then, check the file with a manual read against the content contract.

### Step 6: welcome-app/public/getting-started.html (new) [COMP-002]

- **Purpose:** Placeholder destination.
- **Dependencies:** COMP-003, Wave 1.
- **Key notes:** Same head contract as index.html. One `main` with one h1 "Getting Started", one placeholder sentence, and the Back to welcome anchor.
- **Acceptance criteria:** AC-003 (destination), AC-005, AC-008, AC-010.
- **Verify:** as Step 5.

### Step 7: welcome-app/vitest.config.js (new) [COMP-009]

- **Purpose:** Unit test configuration.
- **Dependencies:** COMP-008, Wave 1.
- **Key notes:** jsdom environment; include `tests/unit/**/*.test.js`; exclude `tests/e2e/**` so Vitest never loads Playwright specs.
- **Acceptance criteria:** AC-006.
- **Verify:** `npm run test:unit` runs (reports no tests until Wave 2 files exist; use the `--passWithNoTests` flag for this one check).

### Step 8: welcome-app/playwright.config.js (new) [COMP-010]

- **Purpose:** End-to-end test configuration.
- **Dependencies:** COMP-004, COMP-008, Wave 1.
- **Key notes:** Test directory `tests/e2e`; one Chromium project; base URL `http://127.0.0.1:4173`; web server entry runs `node server/server.js` with the port supplied through the web server `env` option (not shell syntax, for Windows compatibility), waiting on the base URL, never reusing an existing server; fail the run on `test.only` in CI.
- **Acceptance criteria:** AC-006.
- **Verify:** `npx playwright test --list` lists tests (after Step 11); until then `node --check playwright.config.js`.

### Step 9: welcome-app/README.md (new) [COMP-011]

- **Purpose:** Local run and test instructions.
- **Dependencies:** COMP-008, Wave 1.
- **Key notes:** Prerequisites (Node 20+), install (`npm install`), one-time browser install (`npx playwright install chromium`), run (`npm start`, then open http://localhost:3000), change port (`PORT`), run all tests (`npm test`), unit only, e2e only, project layout table, note that the app makes no network calls and collects no data, manual smoke-check note for Firefox, Safari and Edge (F-3). Commands in the README must be exactly those that work.
- **Acceptance criteria:** AC-007 (REQ-007).
- **Verify:** walk the README steps from a clean state (TC-019).

### Step 10: welcome-app/tests/unit/pages.test.js and welcome-app/tests/unit/server.test.js (new) [COMP-005, COMP-006]

Two files in Wave 2; treat as Steps 10a and 10b.

**10a: welcome-app/tests/unit/pages.test.js [COMP-005]**
- **Dependencies:** COMP-001, COMP-002, COMP-009.
- **Key notes:** Read each HTML file from disk, parse as an HTML document in jsdom, query through Testing Library by role and accessible name. Cases: TC-001, TC-002 (exactly one h1 with the exact text), TC-004, TC-005 (paragraph after h1, 1 or 2 sentences), TC-007 structure (link named "Get Started" with href `getting-started.html`), `lang`, `title`, one `main`, back link on the Getting Started page, TC-029 (CSP meta with `default-src 'self'`, `script-src 'none'`, `img-src 'self' data:`; no `src` or `href` starting with `http:`, `https:` or `//`; no inline `style` attribute; no `script` element).
- **Acceptance criteria:** AC-001, AC-002, AC-003, AC-008 (structure), AC-010.
- **Verify:** `npm run test:unit`.

**10b: welcome-app/tests/unit/server.test.js [COMP-006]**
- **Dependencies:** COMP-004, COMP-009.
- **Key notes:** Start the exported server factory on an ephemeral port bound to loopback, close it after the tests. Cases: TC-008 (known pages 200, unknown path 404), TC-030 (traversal attempts including encoded variants never return file contents; POST gives 405 with Allow header; `nosniff` header present; content types for html and css), 500 handling not leaking paths where feasible. Target at least 80 percent line coverage of server.js (check once with Vitest's coverage option; do not add a coverage dependency without an ADR).
- **Acceptance criteria:** AC-003, AC-010.
- **Verify:** `npm run test:unit`.

### Step 11: welcome-app/tests/e2e/welcome.spec.js (new) [COMP-007]

- **Purpose:** Browser tests.
- **Dependencies:** COMP-001, COMP-002, COMP-003, COMP-004, COMP-010, Wave 2.
- **Key notes:** Cases and viewport sizes per the Test Mapping table. Collect console messages, page errors and failed requests on every page load and assert none. Use axe tags wcag2a, wcag2aa, wcag21a, wcag21aa. JavaScript-disabled case uses a browser context with JavaScript off. Measure transfer size by summing response body lengths; measure LCP with a performance observer (with CPU and network throttling via the browser protocol); record that the LCP result is a localhost lower bound. Assert all request origins equal the base origin and that cookies are empty. Do not navigate to a missing page inside a console-cleanliness test (a 404 legitimately logs a resource error); test the 404 separately by status code.
- **Acceptance criteria:** AC-003, AC-004, AC-005, AC-008, AC-009, AC-010.
- **Verify:** `npm run test:e2e`, then the final `npm test`.

## Wave Plan

| Wave | Files | Dependencies Satisfied | Test Command |
|------|-------|----------------------|--------------|
| 0 | styles.css (COMP-003), server.js (COMP-004), package.json (COMP-008), .gitignore (COMP-012) | none | `node --check server/server.js`; then run the `npm install` setup action |
| 1 | index.html (COMP-001), getting-started.html (COMP-002), vitest.config.js (COMP-009), playwright.config.js (COMP-010), README.md (COMP-011) | Wave 0 | `npm run test:unit -- --passWithNoTests` |
| 2 | pages.test.js (COMP-005), server.test.js (COMP-006), welcome.spec.js (COMP-007) | Waves 0 and 1 | `npm run test:unit`, then `npx playwright install chromium` (once), then `npm run test:e2e`, then `npm test` |

Rationale: files in a wave have no dependency on each other. The links between the two HTML pages are by URL only, not build-time dependencies. Steps are numbered in the order above; step numbers do not equal wave numbers.

## Test Mapping (from ph3b_qa_test_plan.md)

| Planned location | Test cases |
|------------------|-----------|
| tests/unit/pages.test.js | TC-001, TC-002, TC-004, TC-005, TC-029 (structure part) |
| tests/unit/server.test.js | TC-008, TC-030 |
| tests/e2e/welcome.spec.js | TC-003, TC-006, TC-007, TC-009, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015, TC-022, TC-023, TC-024, TC-025, TC-026, TC-027, TC-028 |
| package.json scripts | TC-016 (npm test) |
| README.md | TC-018 (clear message when Chromium is missing) |
| Manual checks | TC-017 (mutation check), TC-019, TC-020, TC-021 (README walkthrough) |

Viewports for TC-003, 006, 010, 011, 012: 280, 320, 768, 1280 and 2560 pixels wide. All 10 acceptance criteria must map to at least one automated test; the six regression-qualified manual or README items are recorded as manual in the manifest.

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Playwright browser download blocked or slow (ADR-002) | End-to-end tests cannot run, so AC-004, 005, 008, 009, 010 unverified | Ask the user before downloading; if blocked, stop and report, do not claim those ACs verified |
| Custom server has path-traversal or MIME mistakes (ADR-005) | File exposure or broken pages | Unit tests TC-030 including encoded variants; serve only `public/` |
| CSP violations or missing assets log console errors (ADR-004) | AC-005 fails | Forbid inline styles and scripts; inline favicon; e2e console test on both pages |
| Contrast or focus styling fails axe (AC-008) | AC-008 fails | Use the suggested colours, run axe and the contrast test after the stylesheet and pages exist |
| Localhost LCP is not a real "standard connection" (F-2) | AC-009 only partially demonstrated | State the limit in the manifest and README |
| Only Chromium automated (F-3) | Cross-browser defects undetected | Manual smoke-check note in README |
| Git root is the home directory with no remote (F-4) | PR phase cannot push or open a PR | Resolve target repository and branch before Phase 10 |
| Windows environment variable and path differences | Scripts fail on Windows | Use Playwright `env` option, Node path APIs, no shell-specific syntax in npm scripts |
| Dependency vulnerabilities | Supply-chain exposure | Committed lockfile; run `npm audit` before PR and report results |

## Edge Cases (from problem_spec)

| ID | Scenario | Expected Behavior | Covered by |
|----|----------|------------------|-----------|
| EC-001 | Viewport below 320px or above 2560px | Content readable and centred, no overflow | TC-012 |
| EC-002 | A static asset such as the stylesheet or favicon is missing | No console error for favicon (inline); content stays readable | TC-014 |
| EC-003 | JavaScript disabled | Heading, description and link still work | TC-009 |
| EC-004 | Keyboard-only or screen-reader user | Logical focus order; link announced as "Get Started" | TC-024 |

## Post-Implementation Checklist

- [ ] Baseline recorded (0 tests), then all unit and e2e tests pass
- [ ] `npm test` passes from a clean state (TC-016)
- [ ] ph5_6_impl_manifest.md written with accurate lists of created files, test counts and any known conflicts
- [ ] Page weight under 100 KB, zero console messages, axe clean (AC-005, AC-008, AC-009)
- [ ] No PII in log statements; no external URLs; no cookies
- [ ] `package-lock.json` committed, `node_modules` ignored
- [ ] `npm audit` result recorded
- [ ] README walkthrough completed (TC-019)

## Pipeline Continuation

**CRITICAL: This implementation is part of the SDLC pipeline for SCRUM-1.**
After implementation completes, the pipeline MUST continue through (Small Feature phase set):

- Phase 6: Simplify
- Phase 7: Review
- Phase 8: Verification
- Phase 10: PR Creation

(There is no Risk Assessment phase for a Small Feature.) **DO NOT skip these phases. DO NOT jump directly to PR creation.**

Resume command: `/sdlc-pipeline --ticket=SCRUM-1 --resume`
