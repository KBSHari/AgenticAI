# Implementation Manifest: SCRUM-61

## Summary

- Files created: 3
- Files modified: 7
- Total lines added: approximately 765 (660 in new files, about 105 net in modified files)
- Feature: light/dark theme toggle on both pages. `theme.js` sets `data-theme` on `<html>` before first paint (stored value, else OS preference, else light), reveals and wires a `Dark mode` button, and saves the choice to `localStorage` only when the user toggles. `styles.css` overrides the existing `--color-*` variables for dark, with an OS-based fallback when JavaScript is off. CSP is now `script-src 'self'` and the server serves `.js` as JavaScript.
- Execution: the plan selected wave mode (10 files). Files were implemented one at a time, in wave order, with per-file review and a test run after each, as the implementation skill requires. No plan deviations.
- Interim failures: after the HTML changes, TC-029 failed for both pages as documented in the plan; it was fixed in `pages.test.js` (Step 8).
- Mutation check (QA-044): temporarily removing the allowlist check in `theme.js` made 4 of the 21 theme unit tests fail; the file was restored byte-for-byte.

## Baseline Test Counts

| Repo | Pass | Fail |
|------|------|------|
| welcome-app (unit, Vitest) | 29 | 0 |
| welcome-app (e2e, Playwright) | 23 | 0 |

## Final Test Counts

| Repo | Pass | Fail |
|------|------|------|
| welcome-app (unit, Vitest) | 54 | 0 |
| welcome-app (e2e, Playwright) | 78 | 0 |

## Files Created

| Path | Component | Lines Added |
|------|-----------|------------|
| welcome-app/public/theme.js | COMP-001 | 48 |
| welcome-app/tests/unit/theme.test.js | COMP-001 (tests) | 174 |
| welcome-app/tests/e2e/theme.spec.js | COMP-001 to COMP-005 (e2e tests) | 438 |

## Files Modified

| Path | Component | Lines Changed |
|------|-----------|--------------|
| welcome-app/public/styles.css | COMP-004 | +53 added, 1 selector line extended |
| welcome-app/public/index.html | COMP-002 | +4 added, 1 CSP line changed |
| welcome-app/public/getting-started.html | COMP-003 | +4 added, 1 CSP line changed |
| welcome-app/server/server.js | COMP-005 | +1 added |
| welcome-app/tests/unit/server.test.js | COMP-005 (tests) | +15 added |
| welcome-app/tests/unit/pages.test.js | COMP-002/003 (tests) | +24 net (TC-029 updated, toggle markup tests added) |
| welcome-app/tests/e2e/welcome.spec.js | existing e2e tests | +3 added, 2 changed (TC-009, TC-023/024, TC-025/026) |

## Test Files

| Path | Tests Component |
|------|----------------|
| welcome-app/tests/unit/theme.test.js | COMP-001 |
| welcome-app/tests/unit/server.test.js | COMP-005 |
| welcome-app/tests/unit/pages.test.js | COMP-002, COMP-003 |
| welcome-app/tests/e2e/theme.spec.js | COMP-001 to COMP-005 |
| welcome-app/tests/e2e/welcome.spec.js | existing behaviour (regression) |

## Known Conflicts

None. This ticket has no Figma input. All dark palette values from the design spec were applied as specified, and the e2e axe `color-contrast` checks pass in dark mode on both pages without adjusting any value.

## Known Dependencies / Open Items

- ASM-004 (risk: high): the position that storing the `theme` preference needs no consent has not been confirmed by legal or privacy. The value is written only after an explicit user action.
- ASM-003 (risk: medium): the toggle design (single "Dark mode" button with `aria-pressed`, top-right) was chosen by the pipeline, not specified by the requester.
- Browsers: automated tests cover Chromium only. The project README asks for a manual smoke check in Firefox, Safari and Edge before release.
- `welcome-app/README.md` was not changed (its project layout table does not list `theme.js`); updating it was out of the requested scope. Decide whether to add a row.
- Jira/Zephyr Test issues for the 48 planned QA cases were not created (no Zephyr tool profile), and no Jira phase comments were posted (blocked by the permission classifier earlier in this session).

## Simplification

Files reviewed: 10 | Files modified: 1

| File | Changes | Skipped |
|------|---------|---------|
| welcome-app/public/theme.js | Extracted the repeated `data-theme === 'dark'` check into a named `isDark()` predicate used by the aria-pressed sync and the click handler (no behaviour change) | - |
| welcome-app/public/styles.css | - | Dark palette values appear twice (explicit `data-theme="dark"` block and the `prefers-color-scheme` no-JS fallback). A CSS media query cannot share a rule with an attribute selector, and ADR-003 accepted this duplication. Left as is |
| welcome-app/tests/e2e/theme.spec.js | - | Contrast and focus-outline helpers duplicate those in `welcome.spec.js`. The plan asked for copying small helpers rather than refactoring existing tests; extracting a shared helper would modify `welcome.spec.js`. Left as is |
| Other 7 files | - | Reviewed: no dead code, unused imports or over-nesting found |

Tests after simplification: unit 54 pass / 0 fail; e2e 78 pass / 0 fail (unchanged).
