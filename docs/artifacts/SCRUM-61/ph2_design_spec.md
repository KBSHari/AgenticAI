# Design Specification: Dark Mode Toggle for the Welcome App

## Meta
- Ticket ID: SCRUM-61
- Feature ID: FEAT-0002
- Title: Add Dark Mode Toggle to the Welcome Page
- Date: 2026-10-27
- Author: SDLC Pipeline (Phase 2 - Architecture)
- Version: 1
- Iteration: 1
- Approval status: pending_user_approval
- ready_for_implementation: true
- codebase_location: `welcome-app` (workspace path `C:\Users\Hariprasanth_Baskara\SdlcTemplate\welcome\welcome-app`)
- codebase_analyzed: true
- Repos: `welcome-app` only (single-repo design, so components carry no `repo` field)

## Problem Spec Reference
- Source: `docs/artifacts/SCRUM-61/ph1_problem_spec.md`
- Requirements addressed: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009
- Non-goals respected: NG-001 (no cross-tab sync), NG-002 (no consent banner), NG-003 (two themes only), NG-004 (no server-side or cookie theme)

## Current Architecture

### Description
`welcome-app` is a zero-JavaScript static site. `server/server.js` is a `node:http` server that serves only `public/` (GET/HEAD only, path-traversal guarded, `nosniff`, `Cache-Control: no-cache`). Two HTML pages share `public/styles.css`. Every colour already lives in `:root` custom properties (light values only). Both pages carry a strict CSP meta tag: `default-src 'self'; script-src 'none'; img-src 'self' data:`. Tests are Vitest + jsdom (unit) and Playwright + axe (e2e, own server on port 4173).

### Existing Components

| Name | file_path | current_behavior | modifications_needed |
|------|-----------|------------------|----------------------|
| WelcomePage | `welcome-app/public/index.html` | h1, description paragraph and a "Get Started" link inside one `<main>` | Add header with toggle button, script tag, CSP change |
| GettingStartedPage | `welcome-app/public/getting-started.html` | h1, paragraph and "Back to welcome" link inside one `<main>` | Same as WelcomePage |
| SharedStylesheet | `welcome-app/public/styles.css` | Light palette in `:root`, layout, `.button`, `.back-link`, focus styles | Add dark palette, toggle styles, no-JS fallback |
| StaticServer | `welcome-app/server/server.js` | `MIME_TYPES` map with html, css, svg, ico, txt; unknown extensions served as octet-stream with `nosniff` | Add `.js` entry |

### Blast-radius callers (existing tests touching these components)
- `tests/unit/pages.test.js`: TC-001, TC-002, TC-004, TC-005, TC-007, AC-008 (structure) and TC-029 (CSP and no scripts). **TC-029 breaks** (asserts zero `<script>` and `script-src 'none'`).
- `tests/unit/server.test.js`: asserts `MIME_TYPES` entries and fallback. Unaffected, but needs one new `.js` case.
- `tests/e2e/welcome.spec.js`:
  - **TC-026 breaks** (resource types must equal `document, stylesheet`).
  - **TC-009 (keyboard) and TC-023/TC-024 (focus) are affected**: they assume "Get Started" is the first Tab stop. See FLAG-001.
  - TC-028 (no storage after plain page loads) **still passes unchanged**, because storage is only written on an explicit toggle (ADR-004).
  - TC-013 to TC-015, TC-022, TC-025, TC-027, TC-003/006/010-012: must keep passing in light mode and are extended to dark mode.
- Estimated blast radius: 1 test certainly broken (TC-029), 1 broken (TC-026), 3 affected by tab order (TC-009 x2, TC-023/024).

### Existing Patterns
- Colours only via `:root` custom properties; no hard-coded colours elsewhere in rules.
- One shared stylesheet, no build step, no framework; ESM Node server.
- Accessibility built in: single `<main>`, `lang="en"`, visible 3px focus outline, 44 px minimum touch target (`min-height: 2.75rem`).
- Tests tagged with `TC-###`, Testing Library roles in unit tests, axe with WCAG 2.1 A/AA tags in e2e.
- Server logs only method, path and status.

### Integration Points
- `public/styles.css` custom property names (`--color-text`, `--color-text-muted`, `--color-background`, `--color-accent`, `--color-accent-hover`, `--color-on-accent`, `--color-focus`): the dark theme overrides exactly these.
- `server/server.js` `MIME_TYPES` (exported; also asserted by tests).
- `<meta http-equiv="Content-Security-Policy">` in both HTML files.
- `playwright.config.js` already starts the server on 4173 and needs no change.

## Architecture

### Pattern
**Progressive enhancement with a single vanilla utility script and CSS custom-property theming.** None of the catalogue patterns (container/presenter, feature-sliced, clean architecture, MVVM, MVC) apply to a framework-free static site, so this follows the pattern the codebase already uses (plain HTML + shared CSS) and adds one small script. See ADR-001.

How it works:
1. The theme is the value of a `data-theme` attribute (`light` or `dark`) on `<html>`.
2. `styles.css` defines the light palette on `:root`, the dark palette on `:root[data-theme="dark"]`, and an OS-based fallback for when JavaScript has not set the attribute.
3. `theme.js` is loaded in `<head>` as a blocking classic script, so the attribute is set before first paint.
4. Once the DOM is ready, the script reveals the toggle button and wires its click handler.

### Components

| ID | Name | Type | Responsibility | Dependencies | Status | file_path |
|----|------|------|----------------|--------------|--------|-----------|
| COMP-001 | ThemeScript | utility | Resolves, applies and persists the page colour theme. | none | New | `welcome-app/public/theme.js` |
| COMP-002 | WelcomePage | template | Hosts the toggle button and loads the theme script on the welcome page. | COMP-001, COMP-004 | Modified | `welcome-app/public/index.html` |
| COMP-003 | GettingStartedPage | template | Hosts the toggle button and loads the theme script on the Getting Started page. | COMP-001, COMP-004 | Modified | `welcome-app/public/getting-started.html` |
| COMP-004 | SharedStylesheet | utility | Defines the light and dark palettes and the toggle appearance. | none | Modified | `welcome-app/public/styles.css` |
| COMP-005 | StaticServer | service | Serves `.js` files with a JavaScript content type. | none | Modified | `welcome-app/server/server.js` |

Note on COMP-001's single responsibility: it owns "the theme" as one concern (read, apply, save, and the button wiring all serve that one concept). It is deliberately one file to satisfy REQ-005 (one external script).

### Component Dependency Graph
```
COMP-002 WelcomePage ----+--> COMP-001 ThemeScript   (script src, runtime contract: data-theme, #theme-toggle)
COMP-003 GettingStarted -+--> COMP-004 SharedStylesheet (link; data-theme selectors)
COMP-001 ThemeScript -- served by --> COMP-005 StaticServer (.js MIME)
```
No cycles.

### Data Flow

| From | To | Data | Trigger |
|------|----|------|---------|
| COMP-002/003 (HTML parse) | COMP-001 | Script executes in `<head>` | Page load |
| Browser storage | COMP-001 | Stored `theme` string (or error) | Script start |
| Browser media query | COMP-001 | `prefers-color-scheme: dark` boolean | Script start, only if no valid stored value |
| COMP-001 | `<html>` element | `data-theme` = `light` or `dark` | Script start |
| `<html data-theme>` | COMP-004 | Selector match switches the palette | Style recalculation |
| COMP-001 | `#theme-toggle` button | Un-hide and set `aria-pressed` | DOM ready |
| User (click, Enter, Space) | COMP-001 | Toggle activation | User action |
| COMP-001 | `<html>` element and button | New `data-theme` and `aria-pressed` | User action |
| COMP-001 | Browser storage | `theme` = new value (failure ignored silently) | User action |
| COMP-005 | Browser | `theme.js` with JavaScript content type | Script request |

Error propagation: storage read/write errors are caught inside COMP-001 and never surface to the console or the user (REQ-003, AC-006). A missing `matchMedia` is treated as "light".

## API Contracts
This feature has no network API, GraphQL or mutation endpoints. The contracts are the browser-side interfaces below.

### DOM contract (between COMP-001, COMP-002/003 and COMP-004)
- `<html data-theme="light|dark">`: set by COMP-001 only. Absent when JavaScript is disabled.
- Toggle element: a `<button type="button">` with id `theme-toggle`, class `theme-toggle`, the `hidden` attribute in the source HTML (shown only by COMP-001), visible text "Dark mode", and `aria-pressed="true"` when the dark theme is active, otherwise `"false"`.
- The toggle lives in a `<header class="site-header">` that precedes `<main>` on both pages.

### Storage contract
- Key: `theme`. Allowed values: `light`, `dark`. Anything else is treated as absent.
- Written only on an explicit user toggle. Never written on load.
- Read and write both wrapped in error handling (AC-006, EC-001).

### Server contract
- `GET /theme.js` returns 200 with `Content-Type: text/javascript; charset=utf-8` plus the existing `nosniff` and `no-cache` headers.

### CSS contract
- Palette is overridden through the existing custom property names only. No new colour names are introduced for the page itself; toggle styling reuses them.

### Mutations (error handling)
- The only write is `localStorage` set on toggle. Error handling: failure is swallowed silently, the in-page theme still changes, nothing is logged (guardrail: no logging of user data, and no console errors per REQ-008).

## Data Models

### Types (described, not implemented)
- `Theme`: string literal union `"light"` or `"dark"`.
- `StoredTheme`: the raw string read from storage; valid only if it is a `Theme`. Everything else is discarded.
- Theme resolution order: valid stored value, else OS preference (`dark` if `prefers-color-scheme: dark` matches), else `light`.

### State
- Single source of truth at runtime: the `data-theme` attribute on `<html>`. The button's `aria-pressed` is derived from it.
- Persisted state: one string under key `theme`.

### Dark palette (design tokens; light values unchanged)

| Property | Light (existing) | Dark (new) | Contrast note |
|----------|------------------|------------|---------------|
| `--color-background` | `#ffffff` | `#121212` | base |
| `--color-text` | `#1a1a1a` | `#f2f2f2` | about 16:1 on background |
| `--color-text-muted` | `#404040` | `#c8c8c8` | about 11:1 on background |
| `--color-accent` | `#0b57d0` | `#8ab4f8` | about 8:1 on background (link text) |
| `--color-accent-hover` | `#0842a0` | `#aecbfa` | brighter on hover |
| `--color-on-accent` | `#ffffff` | `#0b1220` | about 8:1 on dark accent |
| `--color-focus` | `#1a1a1a` | `#f2f2f2` | far above the 3:1 focus requirement |

Final values must be verified by the axe `color-contrast` rule in the dark e2e run (AC-003, AC-004). The implementer may adjust a hex value if axe reports a violation, keeping the same roles.

## Decisions (ADRs)

### ADR-001: Progressive-enhancement vanilla script with CSS custom-property theming
- **Context:** Needs a toggle, persistence and a dark palette on a framework-free static site. The standard pattern catalogue is React/service oriented and does not fit.
- **Decision:** One classic vanilla script plus palette overrides on the existing CSS variables, keyed by `data-theme` on `<html>`.
- **Alternatives:**
  - Keep existing pattern / do nothing: *Pros:* no risk. *Cons:* feature not delivered.
  - CSS-only checkbox hack: *Pros:* no JavaScript, CSP unchanged. *Cons:* cannot persist across reloads (violates REQ-003), poor accessibility.
  - Adopt a framework or build step: *Pros:* componentisation. *Cons:* large footprint, breaks the 100 KB budget and the project's no-build design.
- **Consequences:** Positive: minimal change, matches the codebase. Negative: first script in a no-script project. Risks: the CSP and tests that assumed "no JavaScript" must change (accepted, DL-003/DL-005).

### ADR-002: CSP `script-src 'self'` with one external file
- **Context:** The toggle needs JavaScript, but both pages currently forbid scripts.
- **Decision:** Change only the script directive to `script-src 'self'`, ship the logic in one external `theme.js`, no inline script.
- **Alternatives:**
  - Keep `script-src 'none'`: not possible, no JavaScript.
  - Inline script with hash or nonce: *Pros:* no extra request. *Cons:* hashes must be regenerated on every edit and nonces need server-side templating; the server is static.
  - `'unsafe-inline'`: *Pros:* simple. *Cons:* defeats the CSP and is unacceptable for a BFSI client.
- **Consequences:** Positive: strict CSP preserved. Negative: one extra same-origin request (a few hundred bytes). Risk: another script could be added later without review; mitigated by the updated TC-029 which allows exactly one script.

### ADR-003: `data-theme` attribute on `<html>` with variable overrides
- **Context:** Need a switch mechanism that works before `<body>` exists and keeps the existing variable structure.
- **Decision:** Set `data-theme` on `document.documentElement` and override variables in `:root[data-theme="dark"]`. A media-query fallback applies the dark palette only when the attribute is absent (JavaScript disabled).
- **Alternatives:**
  - Class on `<body>`: *Pros:* common. *Cons:* `<body>` does not exist when the blocking head script runs, which reintroduces the flash.
  - Swapping between two stylesheets: *Pros:* separate files. *Cons:* extra request, flash risk, duplicate rules.
  - Keep existing pattern (light only): not delivering the feature.
- **Consequences:** Positive: no flash, no JavaScript needed for the OS-based fallback (AC-012). Negative: the dark values exist in two selectors (explicit attribute and fallback media query); mitigated by keeping both blocks adjacent.

### ADR-004: Persist only on explicit toggle, in `localStorage`
- **Context:** Client is GDPR scoped and guardrails forbid processing user data before consent. The value is non-personal (DL-006, ASM-004).
- **Decision:** Never write on load; write `theme` only when the user presses the toggle. Validate on read against an allowlist.
- **Alternatives:**
  - Cookie: *Pros:* server-readable. *Cons:* sent with every request, contradicts "sets no cookies", NG-004.
  - Persist the OS-derived default on first load: *Pros:* stable if OS changes. *Cons:* writes storage without a user action and breaks TC-028.
  - Keep existing pattern (no storage): contradicts REQ-003.
- **Consequences:** Positive: storage is written only as a result of a user-requested action, which supports the functional-preference position, and TC-028 stays valid. Negative: a user who never toggles keeps following the OS (intended). Risk: legal interpretation of ePrivacy; flagged as ASM-004 for validation.

### ADR-005: Toggle placed in a header before `<main>`
- **Context:** The toggle should sit top-right, must not overlap content at 280 px, and should follow natural reading and tab order.
- **Decision:** A `<header class="site-header">` as the first child of `<body>`, right-aligned, in normal document flow.
- **Alternatives:**
  - Absolute or fixed top-right: *Pros:* no layout change. *Cons:* overlaps the h1 at narrow widths because `main` top padding can be as small as 2rem.
  - Place the toggle after `<main>` in the DOM and position visually at the top: *Pros:* existing tab-order tests unchanged. *Cons:* focus order differs from visual order (WCAG 2.4.3 risk).
  - Keep existing pattern (no header): not applicable.
- **Consequences:** Positive: no overlap, correct reading and tab order. Negative: "Get Started" is no longer the first Tab stop, so TC-009 and TC-023/024 need small updates (FLAG-001).

### ADR-006: Blocking script in `<head>` (no `defer`)
- **Context:** A saved dark theme must be applied before first paint to avoid a light flash (DL-001 area, ASM-002).
- **Decision:** A classic `<script src="theme.js">` in `<head>` without `defer` or `async`. The file is tiny, so the render-blocking cost is negligible.
- **Alternatives:**
  - `defer`: *Pros:* non-blocking. *Cons:* the page paints light first, then flips.
  - `type="module"`: *Pros:* modern. *Cons:* modules are deferred, so the same flash.
  - Keep existing pattern (no script): n/a.
- **Consequences:** Positive: no flash. Negative: one blocking request on the critical path; risk to LCP is covered by TC-027 (under 2.5 s) which must still pass.

No new libraries or dependencies are introduced.

## Implementation Guidelines

### File Structure

| path | purpose | component_id |
|------|---------|--------------|
| `welcome-app/public/theme.js` | New. Theme resolve, apply, persist and toggle wiring | COMP-001 |
| `welcome-app/public/index.html` | Modified. Header with toggle button, script tag, CSP `script-src 'self'` | COMP-002 |
| `welcome-app/public/getting-started.html` | Modified. Same changes as index.html | COMP-003 |
| `welcome-app/public/styles.css` | Modified. Dark palette, fallback, `.site-header`, `.theme-toggle` | COMP-004 |
| `welcome-app/server/server.js` | Modified. Add `.js` to `MIME_TYPES` | COMP-005 |
| `welcome-app/tests/unit/theme.test.js` | New. Unit tests of the theme script (jsdom) | n/a (test) |
| `welcome-app/tests/unit/pages.test.js` | Modified. Update TC-029, add toggle markup checks | n/a (test) |
| `welcome-app/tests/unit/server.test.js` | Modified. Add `.js` MIME and `/theme.js` serving checks | n/a (test) |
| `welcome-app/tests/e2e/theme.spec.js` | New. Toggle, persistence, OS default, resilience, dark axe, responsive, no-JS | n/a (test) |
| `welcome-app/tests/e2e/welcome.spec.js` | Modified. Update TC-026, TC-009, TC-023/024 | n/a (test) |

`playwright.config.js`, `vitest.config.js` and `package.json` need no change (the Vitest include glob already matches `tests/unit/**/*.test.js`; Playwright `testDir` is `tests/e2e`).

### Naming Conventions
- Files: kebab-case (`theme.js`, `theme.test.js`, `theme.spec.js`).
- CSS classes: kebab-case (`site-header`, `theme-toggle`), matching `back-link`.
- CSS custom properties: keep the existing `--color-*` names; add none.
- Test IDs: continue the `TC-###` scheme, numbering new cases after the highest existing ID.
- Storage key `theme`; attribute `data-theme`; element id `theme-toggle`.

### Patterns to Use
- Override existing custom properties; never hard-code colours in rules.
- Wrap every storage access in error handling; validate the stored value against `light` / `dark`.
- Guard optional browser APIs (`matchMedia`, `localStorage`) before use.
- Reuse the existing 3px focus outline style and 44 px minimum target size for the toggle.
- In unit tests, load the script into a JSDOM window with scripts allowed to run and stubbed `localStorage` / `matchMedia`; no exports are added to the script just for testing.

### Patterns to Avoid
- Inline `<script>` content or inline `style` attributes (breaks CSP and TC-029).
- Writing to storage on page load (breaks TC-028 and ADR-004).
- Hard-coded colours outside the palette blocks.
- `console.*` calls in `theme.js` (REQ-008 requires zero console messages).
- Adding a second script file or any dependency.
- Reformatting unrelated lines in touched files (client guardrail).

### Libraries
None added. Existing: Vitest, jsdom, @testing-library/dom, Playwright, @axe-core/playwright.

### Code Standards
- Run the full baseline first (`npm run test:unit`, `npm run test:e2e`) and record pass and fail counts before any edit.
- Test after each file change, not at the end.
- Keep the change additive where possible: existing light values are untouched.
- Comments only where the reason is non-obvious (for example why the script is blocking in `<head>`).

## Testing Strategy

### Unit Test Targets (Vitest + jsdom)
- `theme.test.js` (COMP-001), covering every branch of the script:
  - Stored `dark` and stored `light` are applied.
  - No stored value with OS dark gives `dark`; with OS light gives `light`.
  - Invalid stored value (`blue`, empty string) is ignored and falls back to the OS value.
  - `localStorage` getter throwing on read: falls back and does not throw.
  - `localStorage.setItem` throwing on toggle: theme still flips, no exception, no console output.
  - `matchMedia` missing: falls back to light.
  - Toggle becomes visible, `aria-pressed` is correct initially and after each click.
  - Toggle writes `theme` only on click, never on load.
- `pages.test.js`: updated TC-029 (exactly one `<script src="theme.js">`, no inline script text, CSP contains `script-src 'self'`, still no inline `style` attributes and no external URLs); new checks that both pages contain one `#theme-toggle` button with the `hidden` attribute and initial `aria-pressed="false"`.
- `server.test.js`: `MIME_TYPES['.js']` is `text/javascript; charset=utf-8`; `GET /theme.js` returns 200 with that type and `nosniff`.

### Integration Test Targets
- Script plus stylesheet plus pages working together in a real browser (covered by the e2e suite below). No API mocking is required because there is no network surface.

### E2E Scenarios (Playwright)
- As a visitor, I activate the toggle by click and by keyboard (Enter and Space) and the page switches theme and `aria-pressed` follows (AC-001, AC-002).
- As a visitor, I choose dark, reload, and the page is dark; I open the other page and it is dark (AC-005, EC-005).
- As a visitor with an OS dark preference (`colorScheme: dark`) and no saved value, the page is dark; with light it is light (AC-007).
- As a visitor whose storage holds an invalid value (set with an init script), the page falls back to the OS value (AC-008).
- As a visitor whose storage throws (init script overriding the storage methods), the toggle still flips and there are no console messages (AC-006).
- With JavaScript disabled, the toggle is not visible and content and navigation work (AC-012).
- axe WCAG 2.1 A/AA with `color-contrast` passing, on both pages in dark mode (AC-004).
- Widths 280, 320, 768, 1280 and 2560 px: no horizontal scroll, toggle fully inside the viewport, in both themes (AC-013).
- `/theme.js` is served with a JavaScript content type, the page stays under 100 KB, LCP stays under 2.5 s, zero console messages (AC-009, AC-014).
- Updated existing tests: TC-026 expects `document, script, stylesheet`; TC-009 and TC-023/024 account for the toggle being the first Tab stop (FLAG-001).

### Coverage Target
`client-kb.md` states no numeric standard. Default to at least 80% on business logic, interpreted here as every branch of `theme.js` exercised by the unit cases above. No coverage tooling is added because that would be a new dependency; the branch checklist above is the verification.

## Security Considerations

| Concern | Mitigation | OWASP category |
|---------|------------|----------------|
| Weakening the CSP to allow JavaScript | Only `script-src` changes, to `'self'`; no `'unsafe-inline'`, no hashes, no external origins; TC-029 enforces exactly one same-origin script and no inline script | A05 Security Misconfiguration |
| Tampered `localStorage` value (devtools or other script) driving behaviour | Value is checked against a two-item allowlist before use and only ever assigned to a fixed attribute; never injected as HTML | A03 Injection |
| Script served with the wrong type being sniffed | `.js` explicitly mapped to a JavaScript type and `nosniff` stays on | A05 Security Misconfiguration |
| Path traversal to reach the new file or others | Existing traversal guard unchanged and its tests kept (TC-030) | A01 Broken Access Control |
| Personal data or consent | The theme value is non-personal. It is written only after an explicit user action, never on load, never logged and never transmitted. No cookies, no network calls. Legal confirmation that this needs no consent is tracked as ASM-004 | GDPR data minimisation; not an OWASP item |
| PCI-DSS / HIPAA data | No payment or health data is touched | n/a |
| Information leak through logs | `theme.js` makes no `console` calls; server log format unchanged (method, path, status) | A09 Security Logging and Monitoring Failures |
| Third-party code | No new dependency or CDN resource | A06 Vulnerable and Outdated Components |

## Flags
- **FLAG-001 (missing_requirement):** AC-016 lists TC-029, TC-028 and TC-025/026 as the tests to update. Three more existing assertions are affected by the toggle becoming the first Tab stop: TC-009 (keyboard) and TC-023/TC-024 (focus indicator), which assume "Get Started" is focused after one Tab press. Recommended action: update those tests to tab to the toggle first (or focus the link directly). Conversely, TC-028 does not need to change, since nothing is stored without a toggle. Both are consistent with AC-011 in spirit (no behaviour is lost), but the requester should be aware the test change list is slightly different from AC-016.

## Design Changes Log

| Version | Date | Changes | Rationale |
|---------|------|---------|-----------|
| 1 | 2026-10-27 | Initial design | First iteration from the approved problem spec |
