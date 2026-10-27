# Implementation Plan: SCRUM-61

## Pipeline Context

- **Ticket:** SCRUM-61
- **Mode:** gates
- **Classification:** Small Feature (phase set: requirements, architecture, qa-test-generation, impl-planning, implementation, simplify, review, verification, pr)
- **Pipeline state:** docs/artifacts/SCRUM-61/.state/pipeline_state_SCRUM-61.json
- **Artifacts:** docs/artifacts/SCRUM-61/ (ph1_problem_spec.md, ph2_design_spec.md, ph3b_qa_test_plan.md)
- **Repo working directory for all commands:** `welcome-app/` (workspace path `C:\Users\Hariprasanth_Baskara\SdlcTemplate\welcome\welcome-app`)

## Problem Summary

The Welcome Page and Getting Started page only have a light appearance. Add a light/dark theme toggle to both pages, follow the OS preference by default, and remember an explicit choice in `localStorage` so it survives reloads and applies on both pages before first paint.

## Key Requirements & Constraints

| ID | Priority | Description |
|----|----------|-------------|
| REQ-001 | P0 | Visible theme toggle button on each page, operable by mouse, touch and keyboard |
| REQ-002 | P0 | Theme change updates background, text, link and button colours; dark meets WCAG 2.1 AA |
| REQ-003 | P0 | Persist `theme` (`light`/`dark`) in `localStorage`; apply on reload and across both pages before first paint |
| REQ-004 | P0 | No saved theme: follow `prefers-color-scheme`; invalid stored value is ignored |
| REQ-005 | P0 | One same-origin external script; CSP `script-src 'self'`; no inline scripts; server serves `.js` with a JavaScript type |
| REQ-006 | P0 | No regression; JS disabled: toggle hidden, content works, theme follows OS via CSS |
| REQ-007 | P1 | No horizontal scroll at 280-2560 px; touch target at least 44 px |
| REQ-008 | P1 | Welcome page under 100 KB, LCP under 2.5 s, zero console messages |
| REQ-009 | P0 | Automated tests for switching, persistence, invalid/unavailable storage, dark axe; update conflicting existing tests |

**Constraints:**
- No new dependencies; no build step; ESM project (`"type": "module"`), Node >= 20.
- No inline `<script>` or `style` attributes. No `console.*` calls in `theme.js`.
- Write to `localStorage` only on an explicit toggle, never on load (ADR-004).
- Client guardrails: test after every file, do not reformat unrelated code, no unsolicited changes, never delete files without confirmation, no personal data logged.
- Light palette values stay exactly as they are today.

**Non-Goals:** cross-tab live sync (NG-001), consent banner (NG-002), more than two themes (NG-003), server-side or cookie-based theme (NG-004).

## Architecture Summary

Progressive enhancement. The theme is the `data-theme` attribute (`light` or `dark`) on `<html>`. `styles.css` overrides the existing `--color-*` custom properties under `:root[data-theme="dark"]`, with a `prefers-color-scheme: dark` fallback on `:root:not([data-theme])` for the JavaScript-disabled case. A single classic script, `public/theme.js`, loaded in `<head>` without `defer`, resolves the theme (valid stored value, else OS, else light), sets the attribute before first paint, then reveals and wires a `<button id="theme-toggle">` once the DOM is ready. The button sits in a `<header class="site-header">` before `<main>` and is hidden in the source HTML. The CSP changes only to `script-src 'self'`. `server.js` gains a `.js` MIME type. ADR-001 to ADR-006 in `ph2_design_spec.md` hold the reasoning.

## Design Review Conditions

None. Design review (Phase 3) is not part of the Small Feature phase set, so there is no `ph3_design_review.md`. FLAG-001 from `ph2_design_spec.md` is carried into the steps below: TC-009 and TC-023/TC-024 must be updated because the toggle becomes the first Tab stop.

## Affected Repos

Single-repo change - `welcome-app` only.

## Pre-Implementation Baseline

- Run from `welcome-app/`: `npm run test:unit`, then `npm run test:e2e`, and record pass and fail counts for each BEFORE any change.
- The e2e suite needs the Chromium browser (`npx playwright install chromium` if missing) and starts its own server on port 4173 (`reuseExistingServer: false`), so port 4173 must be free.
- If any test already fails at baseline, record it and do not treat it as a regression.

## Implementation Steps

### Execution Mode: waves

The design lists 10 files (above the 8-file threshold), so wave mode is selected. Files in one wave are independent and may be written in parallel. Run the wave's test command after each wave, and after each file where the file is self-testing.

All Verify commands run from `welcome-app/`.

### Step 1: welcome-app/public/theme.js (new) [COMP-001]

- **Wave:** 0
- **Purpose:** Resolve, apply and persist the page theme and wire the toggle.
- **Dependencies:** none
- **Key notes:**
  - Classic script (not a module), one self-invoking scope, no globals, no exports, no `console.*`.
  - On load, synchronously: read `localStorage.theme` inside error handling; accept only exactly `light` or `dark`; otherwise use `matchMedia('(prefers-color-scheme: dark)')` if `matchMedia` exists; otherwise `light`. Set `document.documentElement` attribute `data-theme` to the result. Never write storage here.
  - When the DOM is ready (handle both "still loading" and "already loaded" states): find `#theme-toggle`; if absent do nothing; remove its `hidden` attribute; set `aria-pressed` to match the current theme; add a click handler.
  - Click handler: compute the opposite theme, set `data-theme`, update `aria-pressed`, then write `localStorage.theme` inside error handling that swallows every failure silently.
  - Keyboard (Enter and Space) works automatically because the control is a real `<button>`; do not add key handlers.
  - Add a short one-line comment explaining why the script must not be deferred (flash prevention).
- **Acceptance criteria:** REQ-001/AC-001, AC-002; REQ-003/AC-005, AC-006; REQ-004/AC-007, AC-008; REQ-005/AC-010; REQ-008/AC-014
- **Verify:** `npm run test:unit` (after Step 6 exists); until then confirm the file parses with `node --check public/theme.js`

### Step 2: welcome-app/public/styles.css (modify) [COMP-004]

- **Wave:** 0
- **Purpose:** Dark palette, no-JS fallback, header and toggle styling.
- **Dependencies:** none
- **Key notes:**
  - Do not change any existing light value or existing rule. Add new rules only.
  - Add dark values for the seven existing `--color-*` variables as given in the design spec Data Models table, under `:root[data-theme="dark"]`, plus `color-scheme: dark` so native UI matches.
  - Add the same dark values under `@media (prefers-color-scheme: dark)` with selector `:root:not([data-theme])`, placed right next to the explicit block. Leave the existing light `:root` block untouched.
  - New classes: `.site-header` (in normal flow, content aligned to the right, padding that matches the page's horizontal padding of 1.25rem) and `.theme-toggle` (min-height 2.75rem, min-width 2.75rem, padding, border using the text colour, transparent background, text colour from `--color-text`, `font` inherited, cursor pointer).
  - The existing focus rule covers `.button` and `.back-link`; extend it to `.theme-toggle` so the 3px outline with 3px offset applies.
  - `.theme-toggle` sets `display`, which would override the HTML `hidden` attribute; add a rule so `.theme-toggle[hidden]` stays `display: none`.
  - Verify contrast: if axe reports a violation for a dark value, adjust that hex within the same role and note it in the manifest.
- **Acceptance criteria:** REQ-002/AC-003, AC-004; REQ-006/AC-012; REQ-007/AC-013
- **Verify:** `npm run test:unit` (existing tests must still pass); visual and axe checks happen in Step 9

### Step 3: welcome-app/server/server.js (modify) [COMP-005]

- **Wave:** 0
- **Purpose:** Serve `.js` with a JavaScript content type.
- **Dependencies:** none
- **Key notes:** Add one entry to `MIME_TYPES`: `.js` mapped to `text/javascript; charset=utf-8`. Nothing else changes; `nosniff`, traversal protection and the octet-stream fallback must stay as they are.
- **Acceptance criteria:** REQ-005/AC-009
- **Verify:** `npm run test:unit`

### Step 4: welcome-app/public/index.html (modify) [COMP-002]

- **Wave:** 1
- **Purpose:** Toggle markup, theme script and CSP update on the welcome page.
- **Dependencies:** COMP-001, COMP-004
- **Key notes:**
  - CSP meta: change only `script-src 'none'` to `script-src 'self'`; keep `default-src 'self'` and `img-src 'self' data:`.
  - In `<head>`, after the stylesheet link, add one `<script src="theme.js"></script>` with no `defer`, `async` or `type="module"`.
  - As the first child of `<body>`, before `<main>`, add `<header class="site-header">` containing `<button type="button" class="theme-toggle" id="theme-toggle" aria-pressed="false" hidden>Dark mode</button>`.
  - `<main>` content, headings, description and the Get Started link stay exactly as they are (TC-001 to TC-007 rely on them).
- **Acceptance criteria:** REQ-001/AC-001; REQ-005/AC-009, AC-010; REQ-006/AC-012
- **Verify:** `npm run test:unit` (TC-029 will fail until Step 8 updates it; expected)

### Step 5: welcome-app/public/getting-started.html (modify) [COMP-003]

- **Wave:** 1
- **Purpose:** Same toggle markup, script and CSP on the Getting Started page.
- **Dependencies:** COMP-001, COMP-004
- **Key notes:** Same three changes as Step 4, byte-for-byte identical header, script tag and CSP. Leave title, h1, paragraph and Back to welcome link untouched.
- **Acceptance criteria:** REQ-001/AC-001; REQ-003/AC-005 (cross-page); REQ-005/AC-009, AC-010
- **Verify:** `npm run test:unit`

### Step 6: welcome-app/tests/unit/theme.test.js (new) [COMP-001 test]

- **Wave:** 1
- **Purpose:** Branch-level unit tests for the theme script.
- **Dependencies:** COMP-001
- **Key notes:**
  - Load `public/theme.js` text and run it inside a JSDOM window created with a real URL (so `localStorage` exists) and scripts enabled for the test only; stub `matchMedia` per test and use a throwing `localStorage` getter or throwing `setItem` for failure cases. Do not add exports to the script.
  - Cases: stored dark, stored light, none with OS dark, none with OS light, invalid values (`blue`, empty, `DARK`, `dark `), read throws, write throws, `matchMedia` missing, toggle revealed and `aria-pressed` correct, click flips, write only on click and never on load, a second click returns to the first theme, missing `#theme-toggle` does not throw.
  - Assert no console output (spy on `console`).
  - Tag cases with the QA ids they cover (QA-001, 003, 016, 017, 019, 020, 021, 022, 023, 024, 044, 045).
  - Unit test files in this repo set the environment via the Vitest config (jsdom); the file needs no special header.
- **Acceptance criteria:** REQ-009/AC-015; REQ-003/AC-006; REQ-004/AC-007, AC-008
- **Verify:** `npm run test:unit`

### Step 7: welcome-app/tests/unit/server.test.js (modify) [COMP-005 test]

- **Wave:** 1
- **Purpose:** Cover the new `.js` MIME type.
- **Dependencies:** COMP-005
- **Key notes:** Add cases only; do not edit existing ones. Assert `MIME_TYPES['.js']`; `GET /theme.js` returns 200 with that type and `x-content-type-options: nosniff`; `HEAD /theme.js` has no body; the octet-stream fallback for an unknown extension still holds. Covers QA-025, QA-027.
- **Acceptance criteria:** REQ-005/AC-009
- **Verify:** `npm run test:unit`

### Step 8: welcome-app/tests/unit/pages.test.js (modify) [COMP-002/003 test]

- **Wave:** 2
- **Purpose:** Update TC-029 and add toggle markup checks.
- **Dependencies:** COMP-002, COMP-003
- **Key notes:**
  - TC-029 (per page): CSP must contain `default-src 'self'` and `img-src 'self' data:` as today, and `script-src 'self'` instead of `script-src 'none'`; assert exactly one `script` element with `src="theme.js"` and empty text content; keep the no-inline-`style` and no-external-URL checks; keep the stylesheet-link check.
  - New per-page checks: exactly one `#theme-toggle` that is a `button`, has the `hidden` attribute and `aria-pressed="false"`, text "Dark mode", and sits inside a header that precedes `<main>`. When querying by role with Testing Library, pass the option that includes hidden elements.
  - Leave every other existing test untouched. Covers QA-028, QA-029, QA-026, QA-046.
- **Acceptance criteria:** REQ-005/AC-009, AC-010; REQ-009/AC-016
- **Verify:** `npm run test:unit` (all unit tests should now pass)

### Step 9: welcome-app/tests/e2e/theme.spec.js (new) [all components, e2e]

- **Wave:** 2
- **Purpose:** Browser tests for the feature.
- **Dependencies:** COMP-001 to COMP-005
- **Key notes:**
  - Reuse the helper style from `welcome.spec.js` (console and network watcher, axe tags `wcag2a wcag2aa wcag21a wcag21aa`, widths 280/320/768/1280/2560). Copy small helpers rather than refactoring `welcome.spec.js`.
  - Scenarios: click and keyboard (Enter, Space) toggle; persistence across reload and across pages; OS dark and OS light defaults using Playwright's colour-scheme emulation; saved light overrides OS dark; invalid stored value; storage read failure and write failure with zero console messages; JavaScript disabled (toggle hidden, navigation works, OS dark follows via CSS); axe in dark on both pages with `color-contrast` in passes; axe in light with toggle focused; no horizontal scroll at all widths in both themes with toggle inside the viewport; no overlap with the h1 and height at least 44 px at 280 px; first-paint check that `data-theme` is already set at DOMContentLoaded; LCP and size budget with saved dark; zero console messages in both themes; all requests same origin.
  - IMPORTANT: Playwright init scripts re-run on every navigation. When seeding storage (for example an invalid value), guard the seed with a once-only flag stored in `sessionStorage`, otherwise reload and cross-page tests are meaningless.
  - Cover QA ids 001-023, 030, 033-039, 041, 042 where they are browser-level.
- **Acceptance criteria:** REQ-001 to REQ-004, REQ-006 to REQ-008, REQ-009 / AC-001 to AC-008, AC-012 to AC-015
- **Verify:** `npm run test:e2e`

### Step 10: welcome-app/tests/e2e/welcome.spec.js (modify) [existing e2e tests]

- **Wave:** 2
- **Purpose:** Update the existing tests the toggle affects.
- **Dependencies:** COMP-001 to COMP-005
- **Key notes:**
  - TC-026: expected resource types become `document`, `script`, `stylesheet` (sorted); keep the 100 KB assertion.
  - TC-009 (keyboard, first test with that id): the first Tab now focuses the toggle; press Tab a second time before asserting Get Started is focused (FLAG-001).
  - TC-023/TC-024: focus Get Started with two Tab presses (or by role) before measuring its outline; keep the 3px and 3:1 assertions.
  - TC-028: leave unchanged; it must still pass because nothing is stored without a toggle (QA-047).
  - Make no other edits; do not reformat unchanged lines.
- **Acceptance criteria:** REQ-006/AC-011; REQ-009/AC-016
- **Verify:** `npm run test:e2e`

## Wave Plan

| Wave | Files | Dependencies Satisfied | Test Command |
|------|-------|----------------------|--------------|
| 0 | `public/theme.js`, `public/styles.css`, `server/server.js` | none | `npm run test:unit` (existing tests must still pass) |
| 1 | `public/index.html`, `public/getting-started.html`, `tests/unit/theme.test.js`, `tests/unit/server.test.js` | Wave 0 | `npm run test:unit` (TC-029 may fail until Wave 2) |
| 2 | `tests/unit/pages.test.js`, `tests/e2e/theme.spec.js`, `tests/e2e/welcome.spec.js` | Waves 0-1 | `npm run test:unit` then `npm run test:e2e` |

After Wave 2, run the full `npm test` and compare with the baseline.

## QA Test Plan Coverage (from ph3b_qa_test_plan.md)

- 48 planned cases (`QA-001` to `QA-048`); 35 are the regression subset (functional and integration types). No QA automation repo exists, so these are implemented as part of this ticket in `welcome-app/tests` (Steps 6 to 10).
- Mapping: unit (`theme.test.js`, `server.test.js`, `pages.test.js`) covers the integration and jsdom-level cases; e2e (`theme.spec.js`, `welcome.spec.js`) covers browser-level cases, accessibility, responsive and performance cases.
- Manual or non-automatable: QA-043 to QA-045 are verified by running `npm test` and the branch checklist, not by a dedicated test file. Jira/Zephyr Test issues were not created (plan-only).

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| CSP loosened from `script-src 'none'` | Weaker script policy | Only `'self'`; updated TC-029 enforces exactly one external script and no inline script |
| `.theme-toggle` display rule overrides the `hidden` attribute | Toggle visible without JavaScript, does nothing | Explicit `.theme-toggle[hidden]` rule; tested by QA-034 |
| Toggle becomes first Tab stop | TC-009, TC-023/024 fail | Updated in Step 10 (FLAG-001) |
| Dark hex values fail axe contrast | Accessibility regression | Verify in Step 9 with axe; adjust within the same role |
| Blocking head script delays render | LCP regression | Script is tiny; TC-027 (LCP < 2.5 s) must still pass |
| Playwright init scripts re-run per navigation | Persistence tests give false results | Seed with a once-only guard flag |
| jsdom lacks `matchMedia` and needs a URL for storage | Unit tests error or skip branches | Stub per test; create JSDOM with a URL |
| Port 4173 already in use | e2e fails to start | Stop other servers first |
| GDPR interpretation of storing a preference | Possible consent requirement | ASM-004 flagged for legal validation; storage written only on a user action |
| Changes to unrelated lines | Noisy diff, guardrail breach | Use targeted edits only |

## Edge Cases (from problem_spec)

| ID | Scenario | Expected Behavior |
|----|----------|------------------|
| EC-001 | `localStorage.setItem` throws (private mode) | Toggle still works for the current view; no console error |
| EC-002 | Stored value is `blue` or empty | Ignored; OS default used |
| EC-003 | Dark mode at 280 px | No horizontal scroll; focus outline keeps at least 3:1 contrast |
| EC-004 | JavaScript disabled | Toggle hidden; theme follows OS via CSS |
| EC-005 | Toggle on the welcome page, then open Getting Started | Saved theme applied there before first paint |

## Post-Implementation Checklist

- [ ] All tests pass (no regressions from baseline); only TC-029, TC-026, TC-009, TC-023/024 changed
- [ ] `ph5_6_impl_manifest.md` written with accurate file lists
- [ ] No `console.*` in `theme.js`; no inline script or `style` attributes in the HTML
- [ ] `localStorage` written only on toggle (TC-028 unchanged and passing)
- [ ] Light palette values unchanged
- [ ] No personal data in any log statement
- [ ] Manifest includes a `## Known Conflicts` section (write "None"; this ticket has no Figma input)

## Pipeline Continuation

**CRITICAL: This implementation is part of the SDLC pipeline for SCRUM-61.**
After implementation completes, the pipeline MUST continue through:

- Phase 6: Simplify
- Phase 7: Review
- Phase 8: Verification
- Phase 10: PR Creation

(Risk Assessment is not part of the Small Feature phase set.)

**DO NOT skip these phases. DO NOT jump directly to PR creation.**

Resume command: `/sdlc-pipeline --ticket=SCRUM-61 --resume`
