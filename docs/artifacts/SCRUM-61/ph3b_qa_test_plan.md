## Meta
- Ticket: SCRUM-61
- Classification: Small Feature
- Phase: 3b (QA Test Generation)
- Generated at: 2026-10-27T20:48:09.000+0530
- Test IDs: `QA-###` (prefixed to avoid clashing with the existing `TC-###` IDs in the repo)

## Inputs Summary
- Acceptance criteria covered: AC-001 to AC-016 (REQ-001 to REQ-009), with 3 or more tests each.
- Components touched (from ph2): COMP-001 `public/theme.js` (new), COMP-002/003 both HTML pages, COMP-004 `public/styles.css`, COMP-005 `server/server.js`.
- Existing tests affected (from FLAG-001): TC-029 and TC-026 break; TC-009 and TC-023/024 change for tab order; TC-028 unchanged.
- Test tooling in repo: Vitest + jsdom (unit), Playwright + axe (e2e, JavaScript). The client intake lists Python for automation; this repo's tests are JavaScript, so any automation follows the repo.

## Existing Zephyr Matches (JQL filter 28319)
Not searched. Zephyr Scale has no tool profile in this workspace (only `zephyr-squad.md` exists), so dedup could not run. All cases are marked `decision: new`.

| AC | Matched test key | Match score | Decision |
|----|------------------|-------------|----------|
| AC-001 to AC-016 | none (search not run) | n/a | new |

## AC → Test Matrix

| AC | Test ids | Regression tests | Decision |
|----|----------|------------------|----------|
| AC-001 | QA-001, QA-002, QA-003 | QA-001, QA-002, QA-003 | new |
| AC-002 | QA-004, QA-005, QA-006 | QA-004, QA-005 | new |
| AC-003 | QA-007, QA-008, QA-009 | QA-007, QA-008 | new |
| AC-004 | QA-010, QA-011, QA-012 | none | new |
| AC-005 | QA-013, QA-014, QA-015 | none | new |
| AC-006 | QA-016, QA-017, QA-018 | QA-016, QA-017 | new |
| AC-007 | QA-019, QA-020, QA-021 | QA-019, QA-020, QA-021 | new |
| AC-008 | QA-022, QA-023, QA-024 | QA-022, QA-023, QA-024 | new |
| AC-009 | QA-025, QA-026, QA-027 | QA-025, QA-026, QA-027 | new |
| AC-010 | QA-028, QA-029, QA-030 | QA-028, QA-029 | new |
| AC-011 | QA-031, QA-032, QA-033 | QA-031, QA-032 | new |
| AC-012 | QA-034, QA-035, QA-036 | QA-034, QA-035, QA-036 | new |
| AC-013 | QA-037, QA-038, QA-039 | QA-037, QA-038, QA-039 | new |
| AC-014 | QA-040, QA-041, QA-042 | QA-041 | new |
| AC-015 | QA-043, QA-044, QA-045 | QA-043, QA-044, QA-045 | new |
| AC-016 | QA-046, QA-047, QA-048 | QA-046, QA-047, QA-048 | new |

## Test Cases

Common field: `decision: new` for every case.

| id | title | type | preconditions | steps | expected | related_acs | priority | regression |
|----|-------|------|---------------|-------|----------|-------------|----------|------------|
| QA-001 | Click toggle switches light to dark | functional | App served at 127.0.0.1:4173, Chromium, no saved theme, OS light | 1 Open /  2 Click Dark mode button | html data-theme=dark; button aria-pressed=true; colours change | AC-001 | critical | true |
| QA-002 | Toggle does not navigate or change content | functional | App served at 127.0.0.1:4173, Chromium | 1 Open /  2 Click toggle  3 Compare URL, h1 text, description, Get Started link | URL unchanged, no reload, content text identical | AC-001 | high | true |
| QA-003 | Ten rapid clicks end in the parity state | functional | App served at 127.0.0.1:4173, Chromium | 1 Open /  2 Click toggle 10 times quickly | Ends light; aria-pressed=false matches data-theme; no console message | AC-001 | medium | true |
| QA-004 | Keyboard Enter flips theme | functional | App served at 127.0.0.1:4173, Chromium | 1 Open /  2 Tab to toggle  3 Press Enter | Theme flips; aria-pressed updates; focus stays on toggle | AC-002 | critical | true |
| QA-005 | Space flips theme, other keys do nothing | functional | App served at 127.0.0.1:4173, Chromium | 1 Focus toggle  2 Press Space  3 Press Escape and letter keys | Space flips theme; other keys change nothing | AC-002 | high | true |
| QA-006 | Toggle focus indicator is visible in both themes | accessibility | App served at 127.0.0.1:4173, Chromium | 1 Tab to toggle in light  2 Measure outline  3 Repeat in dark | Outline solid, >=3px, contrast >=3:1 against background; toggle is first Tab stop, Get Started second | AC-002 | high | false |
| QA-007 | Dark theme changes background, text, link and button colours | functional | App served at 127.0.0.1:4173, Chromium, dark selected | 1 Read computed colours of body, h1, p, .button, .back-link in light then dark | Every value differs and equals the dark palette in the design spec | AC-003 | critical | true |
| QA-008 | Light theme values unchanged from baseline | functional | App served at 127.0.0.1:4173, Chromium | 1 Load with theme light  2 Read computed colours | Equal to pre-change light values (#ffffff, #1a1a1a, #404040, #0b57d0) | AC-003 | high | true |
| QA-009 | Get Started hover state keeps contrast in dark | accessibility | App served at 127.0.0.1:4173, Chromium, dark | 1 Hover Get Started  2 Compute text vs background contrast | Contrast >=4.5:1 in hover and rest states | AC-003 | medium | false |
| QA-010 | axe has no violations on welcome page in dark | accessibility | App served at 127.0.0.1:4173, Chromium, dark saved | 1 Open /  2 Run axe WCAG 2.1 A/AA | 0 violations; color-contrast rule in passes | AC-004 | critical | false |
| QA-011 | axe has no violations on Getting Started in dark | accessibility | App served at 127.0.0.1:4173, Chromium, dark saved | 1 Open /getting-started.html  2 Run axe | 0 violations; color-contrast in passes | AC-004 | critical | false |
| QA-012 | axe clean in light mode and with toggle focused | accessibility | App served at 127.0.0.1:4173, Chromium | 1 Run axe in light  2 Focus toggle  3 Run axe again | 0 violations in both states | AC-004 | high | false |
| QA-013 | Dark persists across reload before first paint | e2e | App served at 127.0.0.1:4173, Chromium | 1 Open /  2 Toggle to dark  3 Reload with init script recording data-theme at DOMContentLoaded | localStorage.theme=dark; data-theme=dark already set at DOMContentLoaded | AC-005 | critical | false |
| QA-014 | Theme persists across pages | e2e | App served at 127.0.0.1:4173, Chromium | 1 Toggle to dark on /  2 Click Get Started  3 Click Back to welcome | Dark on both pages; toggle shows aria-pressed=true on each | AC-005 | critical | false |
| QA-015 | Saved light overrides OS dark | e2e | App served at 127.0.0.1:4173, Chromium, OS dark | 1 Toggle to light (from dark)  2 Reload | Stays light; localStorage.theme=light | AC-005 | high | false |
| QA-016 | Storage write failure does not break toggle | functional | App served at 127.0.0.1:4173, Chromium | 1 Init script makes setItem throw  2 Click toggle  3 Collect console and pageerror | Theme flips for this view; zero console messages or page errors | AC-006 | critical | true |
| QA-017 | Storage read failure falls back to OS default | functional | App served at 127.0.0.1:4173, Chromium | 1 Init script makes getItem throw  2 Open / | Page loads with OS-derived theme; no console message or page error | AC-006 | high | true |
| QA-018 | After failed persistence reload uses OS default | e2e | App served at 127.0.0.1:4173, Chromium, setItem throws | 1 Toggle to dark  2 Reload | Returns to OS default; nothing saved | AC-006 | medium | false |
| QA-019 | No saved theme and OS dark gives dark | functional | App served at 127.0.0.1:4173, Chromium, colorScheme dark | 1 Clear storage  2 Open / | data-theme=dark; aria-pressed=true | AC-007 | critical | true |
| QA-020 | No saved theme and OS light gives light; nothing written | functional | App served at 127.0.0.1:4173, Chromium, colorScheme light | 1 Clear storage  2 Open /  3 Read localStorage length | data-theme=light; localStorage length 0 | AC-007 | high | true |
| QA-021 | OS preference change while open does not live-update | functional | App served at 127.0.0.1:4173, Chromium | 1 Open with OS light  2 Switch emulated scheme to dark | Page stays light until next load (NG-001 behaviour) | AC-007 | low | true |
| QA-022 | Invalid stored value is ignored | functional | App served at 127.0.0.1:4173, Chromium | 1 Init script sets theme=blue  2 Open / with OS dark | Dark applied from OS; no error | AC-008 | critical | true |
| QA-023 | Empty, wrong-case and padded values are ignored | functional | App served at 127.0.0.1:4173, Chromium | 1 For each of empty, DARK, 'dark ' set theme  2 Open / | All treated as absent; OS default applies | AC-008 | medium | true |
| QA-024 | Toggling after invalid value overwrites it | functional | App served at 127.0.0.1:4173, Chromium, theme=blue stored | 1 Open /  2 Click toggle | localStorage.theme is light or dark, never blue | AC-008 | medium | true |
| QA-025 | /theme.js served with JavaScript type | integration | Server running | 1 GET /theme.js | 200; Content-Type text/javascript; charset=utf-8; X-Content-Type-Options nosniff | AC-009 | critical | true |
| QA-026 | CSP allows only same-origin scripts | integration | Both pages | 1 Read CSP meta of both pages | Contains script-src 'self'; no 'unsafe-inline', no 'none' for script | AC-009 | critical | true |
| QA-027 | Server behaviour unchanged for other files | integration | Server running | 1 GET unknown extension  2 HEAD /theme.js  3 Traversal attempts | octet-stream fallback kept; HEAD has no body; traversal gives 403 or 404 | AC-009 | high | true |
| QA-028 | Exactly one external script and no inline script | integration | Both pages | 1 Query script elements | One script with src theme.js, empty text content | AC-010 | critical | true |
| QA-029 | No inline styles or external URLs | integration | Both pages | 1 Query [style], [src], [href] | No style attributes; no http, https or protocol-relative values | AC-010 | high | true |
| QA-030 | All requests same origin, no CSP violations | e2e | App served at 127.0.0.1:4173, Chromium | 1 Load both pages  2 Record requests and console | Origin matches; types are document, script, stylesheet; no CSP violation messages | AC-010 | high | false |
| QA-031 | Unchanged existing tests still pass | functional | Baseline recorded before changes | 1 Run existing unit and e2e suites after change | Only the tests named in FLAG-001 and AC-016 are modified; all others pass | AC-011 | critical | true |
| QA-032 | Updated tests assert the new tab order | functional | App served at 127.0.0.1:4173, Chromium | 1 Run updated TC-009, TC-023, TC-024 | Pass with toggle first and Get Started second; fail if toggle missing | AC-011 | high | true |
| QA-033 | Navigation works in both themes | e2e | App served at 127.0.0.1:4173, Chromium | 1 In light then dark: Get Started then Back to welcome | URLs and headings correct in both themes | AC-011 | high | false |
| QA-034 | JS disabled: toggle hidden, page works | functional | App served at 127.0.0.1:4173, Chromium, JavaScript off | 1 Open /  2 Look for toggle  3 Click Get Started | Toggle not visible and absent from accessibility tree; navigation works | AC-012 | critical | true |
| QA-035 | JS disabled and OS dark follows OS via CSS | functional | App served at 127.0.0.1:4173, Chromium, JS off, colorScheme dark | 1 Open /  2 Read background colour | Dark palette applied; no data-theme attribute | AC-012 | high | true |
| QA-036 | JS disabled and OS light stays light | functional | App served at 127.0.0.1:4173, Chromium, JS off, colorScheme light | 1 Open /  2 Read background colour | Light palette; no data-theme attribute | AC-012 | medium | true |
| QA-037 | No horizontal scroll in light at all widths | functional | App served at 127.0.0.1:4173, Chromium | 1 For widths 280, 320, 768, 1280, 2560 open both pages  2 Measure scrollWidth and toggle box | No overflow; toggle box inside viewport | AC-013 | high | true |
| QA-038 | No horizontal scroll in dark at all widths | functional | App served at 127.0.0.1:4173, Chromium, dark | 1 Repeat QA-037 with dark saved | No overflow; toggle box inside viewport | AC-013 | high | true |
| QA-039 | Toggle does not overlap content at 280 px and is touch-sized | functional | App served at 127.0.0.1:4173, Chromium | 1 Viewport 280 px  2 Compare toggle box with h1 box  3 Measure toggle height | Boxes do not intersect; height >=44px | AC-013 | high | true |
| QA-040 | Page weight and LCP within budget | e2e | App served at 127.0.0.1:4173, Chromium | 1 Throttle network and CPU  2 Load /  3 Sum body bytes and read LCP | Under 100 KB; LCP under 2.5 s | AC-014 | high | false |
| QA-041 | Zero console messages in both themes | functional | App served at 127.0.0.1:4173, Chromium | 1 For each page and theme load and wait for network idle | No console error or warning, no pageerror, no failed request, no http>=400 | AC-014 | critical | true |
| QA-042 | LCP and no flash with saved dark | e2e | App served at 127.0.0.1:4173, Chromium, dark saved | 1 Throttle  2 Load  3 Record first-paint background colour | LCP under 2.5 s; first painted background is dark | AC-014 | medium | false |
| QA-043 | npm test runs and passes | integration | Dependencies installed | 1 Run npm test in welcome-app | Unit and e2e suites include theme tests; exit code 0 | AC-015 | critical | true |
| QA-044 | Theme tests detect a regression | integration | Theme tests written | 1 Temporarily remove the allowlist check in theme.js  2 Run unit tests | At least one theme unit test fails (then revert) | AC-015 | medium | true |
| QA-045 | Every theme.js branch has a test | integration | Theme tests written | 1 Walk the branch checklist in the design spec Testing Strategy | Each listed branch maps to at least one unit case | AC-015 | medium | true |
| QA-046 | Updated TC-029 enforces the new CSP rule | functional | Updated pages.test.js | 1 Run TC-029 for both pages | Exactly one script with src; script-src 'self'; no inline style or script | AC-016 | critical | true |
| QA-047 | TC-028 still passes unchanged | functional | App served at 127.0.0.1:4173, Chromium | 1 Load both pages without toggling  2 Read cookies and storage | No cookies; localStorage and sessionStorage length 0 | AC-016 | critical | true |
| QA-048 | Updated TC-026 expects document, script, stylesheet | functional | App served at 127.0.0.1:4173, Chromium | 1 Load /  2 Collect resource types | Equals document, script, stylesheet; an extra image or second script fails | AC-016 | high | true |

Totals: 48 test cases; functional 27, integration 8, e2e 8, accessibility 5.

## Regression Subset

Rules: R1 = AC modifies an existing component (pages, stylesheet or server confirmed by Codebase Scan); R2 = AC belongs to a P0 critical-path requirement; R3 = Test asserts a backward-compatibility invariant. Only functional and integration tests qualify.

| test id | jira key | rule fired | repo location |
|---------|----------|------------|---------------|
| QA-001 | not created | R2 | welcome-app/tests/e2e |
| QA-002 | not created | R3 | welcome-app/tests/e2e |
| QA-003 | not created | R1 | welcome-app/tests/e2e |
| QA-004 | not created | R2 | welcome-app/tests/e2e |
| QA-005 | not created | R1 | welcome-app/tests/e2e |
| QA-007 | not created | R2 | welcome-app/tests/e2e |
| QA-008 | not created | R3 | welcome-app/tests/e2e |
| QA-016 | not created | R2 | welcome-app/tests/e2e |
| QA-017 | not created | R3 | welcome-app/tests/e2e |
| QA-019 | not created | R2 | welcome-app/tests/e2e |
| QA-020 | not created | R3 | welcome-app/tests/e2e |
| QA-021 | not created | R1 | welcome-app/tests/e2e |
| QA-022 | not created | R2 | welcome-app/tests/e2e |
| QA-023 | not created | R1 | welcome-app/tests/e2e |
| QA-024 | not created | R1 | welcome-app/tests/e2e |
| QA-025 | not created | R2 | welcome-app/tests/unit |
| QA-026 | not created | R3 | welcome-app/tests/unit |
| QA-027 | not created | R3 | welcome-app/tests/unit |
| QA-028 | not created | R2 | welcome-app/tests/unit |
| QA-029 | not created | R3 | welcome-app/tests/unit |
| QA-031 | not created | R3 | welcome-app/tests/e2e |
| QA-032 | not created | R1 | welcome-app/tests/e2e |
| QA-034 | not created | R3 | welcome-app/tests/e2e |
| QA-035 | not created | R1 | welcome-app/tests/e2e |
| QA-036 | not created | R3 | welcome-app/tests/e2e |
| QA-037 | not created | R3 | welcome-app/tests/e2e |
| QA-038 | not created | R1 | welcome-app/tests/e2e |
| QA-039 | not created | R1 | welcome-app/tests/e2e |
| QA-041 | not created | R3 | welcome-app/tests/e2e |
| QA-043 | not created | R2 | welcome-app/tests/e2e |
| QA-044 | not created | R2 | welcome-app/tests/e2e |
| QA-045 | not created | R2 | welcome-app/tests/e2e |
| QA-046 | not created | R3 | welcome-app/tests/e2e |
| QA-047 | not created | R3 | welcome-app/tests/e2e |
| QA-048 | not created | R3 | welcome-app/tests/e2e |

Regression subset size: 35 of 48.

## Jira Issues Created / Linked

| jira key | action | parent link |
|----------|--------|-------------|
| none | Not created. Zephyr Scale has no tool profile, so this phase is plan-only | n/a (parent: SCRUM-61) |

Dedup keys for a later run are recorded in `.state/qa_jira_issues.json` as `<parent>::<AC-ID>::<sha256(title)[:12]>`.

## Automation PR
- Branch: not created
- PR URL: skipped - no QA automation repo configured (no `client-notes/qa-test-generation.md`)
- Lint status: skipped
- Note: the regression subset is implemented as part of SCRUM-61 itself, as the unit and e2e tests listed in the design spec, in `welcome-app/tests`. Repo location column above is indicative; the implementer decides exact files.

## Sign-Off
- Status: partial-(jira-only) and partial-(no-pr)
- Notes:
  - No Test issues were created in Jira/Zephyr (no tool profile). A human can create them from the table above.
  - The summary comment on SCRUM-61 was not posted: an earlier Jira comment attempt in this session was blocked by the permission classifier, so it was not retried.
  - Phase 4 should reuse the AC to Test matrix when planning test files; FLAG-001 test updates are listed under AC-011 and AC-016.
