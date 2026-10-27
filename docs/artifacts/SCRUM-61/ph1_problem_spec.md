# Problem Specification: Add Dark Mode Toggle to the Welcome Page

## Meta
- Ticket ID: SCRUM-61
- Feature ID: FEAT-0002
- Title: Add Dark Mode Toggle to the Welcome Page
- Date: 2026-10-27
- Author: SDLC Pipeline (Phase 1 - Requirements), approved by the requester
- Status: Approved
- Classification: Small Feature (user override from Story, to include qa-test-generation)
- Jira: https://epam-team-v1cb1mzz.atlassian.net/browse/SCRUM-61

## Problem Statement
The Welcome Page and Getting Started page only support a light appearance. Users want to switch between light and dark themes, with their choice remembered across page loads.

## Requirements

| ID | Type | Priority | Description |
|----|------|----------|-------------|
| REQ-001 | functional | P0 | Each page shall show a visible theme toggle button, operable by mouse, touch and keyboard, that switches between light and dark themes. |
| REQ-002 | functional | P0 | Switching theme shall change page background, text, link and button colours, and the dark theme shall meet WCAG 2.1 AA contrast. |
| REQ-003 | functional | P0 | The selected theme shall persist in `localStorage` (key `theme`, values `light` or `dark`) and be applied on reload and on both pages before first paint. |
| REQ-004 | functional | P0 | With no saved theme, the page shall follow the OS `prefers-color-scheme`. A stored value other than `light` or `dark` shall be ignored. |
| REQ-005 | non-functional | P0 | The theme logic shall load from one same-origin external script. The CSP shall allow `script-src 'self'`, with no inline scripts. The server shall serve `.js` with a JavaScript MIME type. |
| REQ-006 | non-functional | P0 | Existing behaviour shall not regress. With JavaScript disabled, the toggle is hidden, content and navigation work, and the theme follows the OS via CSS. |
| REQ-007 | non-functional | P1 | The toggle and themes shall work without horizontal scroll at 280-2560 px, with a touch target of at least 44 px. |
| REQ-008 | non-functional | P1 | The welcome page shall stay under 100 KB with LCP under 2.5 s, and shall produce zero console messages, failed requests or errors. |
| REQ-009 | functional | P0 | Automated tests shall cover theme switching, persistence, invalid and unavailable storage, and axe in dark mode. Existing tests that conflict with the approved design shall be updated. |

## Acceptance Criteria
- **AC-001 (REQ-001):** Given the page is loaded with JS, when the user activates the toggle, then the theme flips and `aria-pressed` matches the active theme.
- **AC-002 (REQ-001):** Given keyboard focus is on the toggle with a visible focus indicator (at least 3:1 contrast), when the user presses Enter or Space, then the theme flips.
- **AC-003 (REQ-002):** Given the dark theme is active, when the page renders, then background, text, link and button colours differ from the light theme and meet at least 4.5:1 text contrast.
- **AC-004 (REQ-002):** Given the dark theme is active, when axe runs with WCAG 2.1 A/AA tags on both pages, then there are no violations.
- **AC-005 (REQ-003):** Given the user selected dark, when the page is reloaded or the other page is opened, then dark is applied before first paint and `localStorage.theme === "dark"`.
- **AC-006 (REQ-003):** Given `localStorage` throws or is unavailable, when the user toggles, then the theme changes for the current view with no console error and no persistence.
- **AC-007 (REQ-004):** Given no saved theme and OS dark preference, when the page loads, then dark is applied. With OS light, light is applied.
- **AC-008 (REQ-004):** Given `localStorage.theme` holds an invalid value (for example `"blue"`), when the page loads, then it is ignored and the OS-derived default is used.
- **AC-009 (REQ-005):** Given the server is running, when `/theme.js` is requested, then it returns 200 with a JavaScript content type, and both pages' CSP contains `script-src 'self'`.
- **AC-010 (REQ-005):** Given either page, when the HTML is inspected, then it has no inline `<script>` content, no inline `style` attributes and no external origins.
- **AC-011 (REQ-006):** Given the existing test suites, when they run after the change, then all unchanged tests pass.
- **AC-012 (REQ-006):** Given JS is disabled, when the page loads, then the toggle is not shown, content and the Get Started navigation work, and the theme follows the OS.
- **AC-013 (REQ-007):** Given viewport widths of 280, 320, 768, 1280 and 2560 px, when either page loads in either theme, then there is no horizontal scroll and the toggle is fully inside the viewport.
- **AC-014 (REQ-008):** Given the welcome page loads on throttled network and CPU, then total weight is under 100 KB, LCP is under 2.5 s and there are zero console messages.
- **AC-015 (REQ-009):** Given the test suites, when `npm test` runs, then Playwright tests for toggle, persistence and dark axe, and Vitest tests for the theme logic, all pass.
- **AC-016 (REQ-009):** Given TC-029, TC-028 and TC-025/026, when updated, then they allow one same-origin script and `localStorage` containing only the `theme` key, and expect resource types document, stylesheet and script.

## Constraints
- Technical: static site served by `node:http` (`welcome-app/server/server.js`); no framework or build step; ESM (`"type": "module"`); Node >= 20.
- Technical: the strict CSP is retained apart from `script-src 'self'`; no inline scripts and no inline `style` attributes.
- Technical: test tooling is Vitest + jsdom (unit) and Playwright + axe (e2e, server on port 4173).
- Business/compliance: client is GDPR, PCI-DSS and HIPAA scoped. The theme value is treated as a non-personal, strictly-necessary functional preference (DL-006). No personal data is stored or logged.
- Rollout: no feature-flag system in use (per client-kb.md); the change ships as a normal release with no kill switch.
- Process: every change traceable to SCRUM-61; test each change immediately; do not reformat unrelated code.

## Non-Goals
- NG-001: Cross-tab live sync of theme changes. Other tabs pick up the change on next load, which keeps the script minimal.
- NG-002: A consent banner or cookie mechanism. The theme value is a functional preference and not personal data.
- NG-003: More than two themes, or per-component theming.
- NG-004: Server-side theme detection or cookies.

## Assumptions
- ASM-001: Playwright's Chromium honours `emulateMedia` for `prefers-color-scheme` in tests. `risk_if_wrong: low`
- ASM-002: A blocking script in `<head>` avoids the flash without hurting LCP. `risk_if_wrong: medium`, `validation_needed: true`
- ASM-003: Toggle design in DL-007 (single button, text "Dark mode", `aria-pressed`, top-right) is acceptable; the requester did not specify it. `risk_if_wrong: medium`, `validation_needed: true`
- ASM-004: The GDPR position in DL-006 holds, so no consent is needed for the `theme` key. `risk_if_wrong: high`, `validation_needed: true`

## Edge Cases
- EC-001 (REQ-003): Private-mode browsing where `localStorage.setItem` throws. The toggle still works for the current view with no console error.
- EC-002 (REQ-004): Stored value is `"blue"` or empty. It is ignored and the OS default is used.
- EC-003 (REQ-002): Dark mode at a 280 px viewport. There is no horizontal scroll and focus outlines keep at least 3:1 contrast against the dark background.
- EC-004 (REQ-006): JavaScript disabled. The toggle is hidden and the theme follows the OS via CSS.
- EC-005 (REQ-003): The user toggles on the welcome page, then navigates to Getting Started. The saved theme applies there before first paint.

## Backward Compatibility
Breaking changes identified; accepted by the requester through "use defaults" (DL-005):

| # | What Breaks | Who Is Affected | Migration Path |
|---|-------------|-----------------|----------------|
| 1 | CSP changes from `script-src 'none'` to `script-src 'self'` on both pages | Anyone relying on the no-script guarantee | Documented in this spec. TC-029 is updated to allow exactly one same-origin script |
| 2 | TC-028 (storage empty) and TC-025/026 (document/stylesheet only) assertions | CI and test suites | Updated per AC-016 |
| 3 | Default appearance changes for users whose OS is set to dark | End users | Intentional (DL-002). They can toggle back to light |

No API, data-schema, shared-library or event-contract changes.

## Decision Log

| # | Decision | Alternatives Considered | Why Chosen | Q&A Round |
|---|----------|------------------------|------------|-----------|
| DL-001 | Toggle on both pages with shared persistence | Welcome page only | Requester default (1b): a user who toggles and clicks Get Started should not see the theme revert | Round 1 |
| DL-002 | Default theme follows OS, saved choice overrides | Always light | Requester default (2b) | Round 1 |
| DL-003 | One external same-origin script, CSP `script-src 'self'`, no inline scripts | Hash or nonce for an inline script | Requester default (4a): keeps the CSP strict | Round 1 |
| DL-004 | No-JS: toggle hidden, theme follows OS via CSS | Make the toggle work without JS | Requester default (3a): `localStorage` needs JS | Round 1 |
| DL-005 | Update TC-029, TC-028 and TC-025/026 to match the approved design | Leave them and add exceptions | Requester default (6a) | Round 1 |
| DL-006 | Treat the theme as a strictly-necessary functional preference with no consent prompt | Require consent first | Requester default (7a): `"light"` or `"dark"` is not personal data | Round 1 |
| DL-007 | Toggle is a single button, text "Dark mode", `aria-pressed` for state, top-right | Two-state switch | Requester said "use defaults"; Q8 had no default, so this is the pipeline's pick | Round 1 |
| DL-008 | Single-repo change in `welcome-app` | Multi-repo | Codebase scan found no upstream or downstream dependencies | Scan |

## Glossary
- **Theme:** the light or dark colour scheme applied to the pages.
- **Toggle:** the button that switches the theme.
- **CSP:** Content Security Policy, the meta-tag policy restricting which resources a page may load.
- **FOUC / flash:** a brief display of the wrong theme before the saved theme is applied.
- **`prefers-color-scheme`:** a CSS media feature reflecting the user's OS light or dark setting.
- **LCP:** Largest Contentful Paint, a page-load performance metric.
- **WCAG 2.1 AA:** Web Content Accessibility Guidelines 2.1, level AA (text contrast at least 4.5:1).
- **axe:** the accessibility testing engine used via `@axe-core/playwright`.
- **TC-###:** test-case identifiers used in the existing Vitest and Playwright suites.
- **GDPR / PCI-DSS / HIPAA:** the compliance regimes the client operates under.

## Affected Repos
- Single-repo change. Repo: `welcome-app`.
  - `public/index.html`, `public/getting-started.html`: toggle markup, CSP, script reference.
  - `public/styles.css`: dark palette via custom properties, toggle styling, no-JS fallback.
  - `public/theme.js` (new): theme read/apply/persist logic.
  - `server/server.js`: `.js` MIME type.
  - `tests/unit`, `tests/e2e`: new theme tests and updates to TC-029, TC-028 and TC-025/026.
- No upstream or downstream repos affected (cross-repo analysis: self-contained).
