# Design Specification: SCRUM-1

## Meta

| Field | Value |
|-------|-------|
| Ticket | SCRUM-1 |
| Feature ID | FEAT-0001 |
| Title | Create a Welcome Page Hari SDLC Agent |
| Classification | Small Feature (user override from Story) |
| Date | 2026-10-26 |
| Author | KBSHari (via SDLC pipeline, Phase 2) |
| Version | 1 |
| Iteration | 1 |
| Approval status | pending_review |
| ready_for_implementation | false |
| codebase_location | `welcome-app/` (new directory, workspace root `SdlcTemplate/welcome/`) |
| codebase_analyzed | true (greenfield; workspace scanned, no application code exists) |

## Problem Spec Reference

Source: `docs/artifacts/SCRUM-1/ph1_problem_spec.md`.

Requirements addressed: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010.

| REQ | Addressed by |
|-----|--------------|
| REQ-001 | COMP-001 |
| REQ-002 | COMP-001 |
| REQ-003 | COMP-001, COMP-002 |
| REQ-004 | COMP-003 |
| REQ-005 | COMP-001, COMP-002, COMP-003, COMP-004, COMP-007 |
| REQ-006 | COMP-005, COMP-006, COMP-007, COMP-008, COMP-009, COMP-010 |
| REQ-007 | COMP-011, COMP-004, COMP-008 |
| REQ-008 | COMP-001, COMP-002, COMP-003, COMP-007 |
| REQ-009 | COMP-001, COMP-003, COMP-007 |
| REQ-010 | COMP-001, COMP-002, COMP-004, COMP-005, COMP-007 |

## Current Architecture

**Description.** Greenfield. The workspace (`SdlcTemplate/welcome`) is a pipeline template containing only `client/`, `config/`, `docs/`, `hooks/`, `scripts/` and `skills/`. There is no application source, no `package.json`, no HTML, no test setup, and the codebase index is empty. The git root is the user's home directory and has no configured remote (see Flags).

**Existing components.** None relevant. No blast-radius callers.

**Existing patterns.** None in the codebase. Client guardrails from `client/client-kb.md` apply: test every change immediately, no unsolicited changes, no credentials, no PII logging, no PR without a ticket reference. The client has no feature flag system and mandates no architecture pattern (`client-notes/architecture.md` does not exist).

**Integration points.** None. The app is self-contained and makes no network calls.

**Toolchain observed.** Node.js v24.15.0 and npm 11.12.1 are available locally.

## Architecture

**Pattern: `static_site`** (multi-page static HTML with a shared stylesheet, no client-side JavaScript, no framework). None of the listed catalogue patterns apply to a content-only page; see ADR-001.

**Served root.** Only `welcome-app/public/` is served. Server, tests and configuration live outside the served root.

### Components

| ID | Name | Type | Responsibility | Repo | File path | New/Modified |
|----|------|------|----------------|------|-----------|--------------|
| COMP-001 | WelcomePage | template | Static HTML page with the single h1, the description paragraph and the Get Started link. | single | `welcome-app/public/index.html` | New |
| COMP-002 | GettingStartedPage | template | Static placeholder destination page that the Get Started link navigates to, with a link back. | single | `welcome-app/public/getting-started.html` | New |
| COMP-003 | SiteStyles | utility | Shared responsive stylesheet providing layout, typography, colour and focus styling for both pages. | single | `welcome-app/public/styles.css` | New |
| COMP-004 | StaticServer | service | Zero-dependency local HTTP server that serves only `welcome-app/public/` with safe path handling and security headers. | single | `welcome-app/server/server.js` | New |
| COMP-005 | PageStructureTests | utility | Unit tests that parse both HTML files and assert structure, copy, links, landmarks and the absence of external references. | single | `welcome-app/tests/unit/pages.test.js` | New |
| COMP-006 | ServerTests | utility | Unit tests for the server's path resolution, status codes, content types and headers. | single | `welcome-app/tests/unit/server.test.js` | New |
| COMP-007 | BrowserTests | utility | Playwright end-to-end tests covering console cleanliness, responsive layout, navigation, accessibility, no-JavaScript, network, cookies and weight. | single | `welcome-app/tests/e2e/welcome.spec.js` | New |
| COMP-008 | PackageManifest | utility | npm manifest defining scripts (`start`, `test`, `test:unit`, `test:e2e`), dev dependencies and the Node engine range. | single | `welcome-app/package.json` | New |
| COMP-009 | UnitTestConfig | utility | Vitest configuration selecting the jsdom environment and the unit test directory. | single | `welcome-app/vitest.config.js` | New |
| COMP-010 | E2ETestConfig | utility | Playwright configuration defining the Chromium project, the web server launch and the base URL. | single | `welcome-app/playwright.config.js` | New |
| COMP-011 | ReadmeDocs | utility | Instructions to install, run and test the app locally, plus the project layout. | single | `welcome-app/README.md` | New |
| COMP-012 | IgnoreRules | utility | Git ignore rules for `node_modules`, Playwright output and reports. | single | `welcome-app/.gitignore` | New |

`package-lock.json` is generated by `npm install` and committed alongside COMP-008.

### Component dependency graph

| Component | Depends on |
|-----------|------------|
| COMP-001 | COMP-003, COMP-002 (link target) |
| COMP-002 | COMP-003, COMP-001 (back link) |
| COMP-003 | none |
| COMP-004 | none (serves COMP-001, COMP-002, COMP-003 at runtime) |
| COMP-005 | COMP-001, COMP-002, COMP-009 |
| COMP-006 | COMP-004, COMP-009 |
| COMP-007 | COMP-001, COMP-002, COMP-003, COMP-004, COMP-010 |
| COMP-008 | none |
| COMP-009 | COMP-008 |
| COMP-010 | COMP-004, COMP-008 |
| COMP-011 | COMP-008 |
| COMP-012 | none |

No cycles. COMP-001 and COMP-002 link to each other by URL only, which is not a build-time dependency.

### Data flows

| # | From | To | Data | Trigger |
|---|------|----|------|---------|
| DF-01 | Browser | COMP-004 | HTTP GET for `/` | Page open |
| DF-02 | COMP-004 | Browser | COMP-001 HTML with security headers | Response to DF-01 |
| DF-03 | Browser | COMP-004 | HTTP GET for `/styles.css` | Stylesheet link in COMP-001 |
| DF-04 | COMP-004 | Browser | COMP-003 stylesheet | Response to DF-03 |
| DF-05 | COMP-001 | COMP-002 | Navigation to `/getting-started.html` | User clicks or keyboard-activates Get Started |
| DF-06 | COMP-002 | COMP-001 | Navigation to `/` | User activates the back link |
| DF-07 | COMP-005 | COMP-001, COMP-002 | Parsed HTML structure | Test run |
| DF-08 | COMP-006 | COMP-004 | Requests to an in-process server instance | Test run |
| DF-09 | COMP-007 | COMP-004 | Browser sessions against the launched server | Test run |
| DF-10 | COMP-010 | COMP-004 | Launch command and readiness URL | Test run |

Every component appears in at least one flow (COMP-003 via DF-03/04, COMP-008, COMP-009, COMP-011 and COMP-012 are configuration and documentation consumed by tooling and developers rather than runtime data flows).

### Page content contract (copy from ASM-001)

| Item | Value |
|------|-------|
| Document language | English (`lang` attribute set on the root element) |
| Page title (COMP-001) | "Welcome to Hari SDLC Agent" |
| h1 (COMP-001) | "Welcome to Hari SDLC Agent" (exactly one) |
| Description (COMP-001) | "Hari SDLC Agent automates your software delivery lifecycle, from Jira ticket to pull request, with human approval at every step." |
| Call to action (COMP-001) | Link labelled "Get Started" pointing to `getting-started.html` |
| h1 (COMP-002) | "Getting Started" (exactly one) |
| Placeholder text (COMP-002) | One short sentence stating that setup guidance is coming soon |
| Back link (COMP-002) | Link labelled "Back to welcome" pointing to `index.html` |
| Landmarks | `main` containing the content on both pages; `header` optional; one `main` per page |

## API Contracts

The app exposes no application API and makes no outbound calls. The contracts below are the HTTP behaviour of COMP-004 and the DOM contract that tests rely on.

### Queries / mutations

None. There are no mutations, so no mutation error handling is required beyond the server error table below.

### Custom hooks / context APIs

None.

### HTTP contract (COMP-004)

| Request | Response |
|---------|----------|
| GET `/` | 200, serves `index.html`, content type `text/html; charset=utf-8` |
| GET `/getting-started.html` | 200, content type `text/html; charset=utf-8` |
| GET `/styles.css` | 200, content type `text/css; charset=utf-8` |
| GET any path that does not exist | 404 with a short plain-text body |
| Any path resolving outside `welcome-app/public/` (for example parent-directory traversal or encoded variants) | 403 or 404, never file contents |
| Any method other than GET and HEAD | 405 with an `Allow` header |
| Server read error | 500 with a generic body, no stack trace or file path in the response |

All responses carry `X-Content-Type-Options: nosniff`. HTML responses additionally rely on the page's Content Security Policy meta element. The server binds to the loopback address only. The port is taken from the `PORT` environment variable, defaulting to 3000 for local use; the Playwright configuration supplies a distinct port for tests.

### DOM contract (relied on by COMP-005 and COMP-007)

| Contract | Detail |
|----------|--------|
| Heading | Exactly one element with the heading role at level 1 on each page |
| Description | A paragraph directly following the h1 in COMP-001, one or two sentences |
| Call to action | An anchor with the accessible name "Get Started" whose href is `getting-started.html` |
| Landmarks | Exactly one `main` landmark per page |
| Language | Root element has a language attribute |
| Content Security Policy | A meta element declaring `default-src 'self'`, `script-src 'none'` and `img-src 'self' data:` |
| External references | No `src` or `href` that begins with `http:`, `https:` or `//` |

## Data Models

There is no persisted data, no client state and no stored user input. The only structured shapes are:

| Shape | Fields |
|-------|--------|
| `PageCopy` (documentation of the content contract above) | `title`, `heading`, `description`, `ctaLabel`, `ctaHref` |
| `ServerConfig` (environment) | `PORT` (optional integer, default 3000), bind address fixed to loopback |
| `MimeMap` (internal to COMP-004) | Mapping from file extension to content type for `.html`, `.css`, `.svg`, `.ico`, `.txt` |

No new enums. No types are shared across components at build time.

## Decisions (ADRs)

### ADR-001: Static multi-page site with no framework

- **Context.** The ticket asks for one welcome page with a heading, description and button. The user accepted a plain HTML/CSS/JS app in a new `welcome-app/` directory (DL-001). The pattern catalogue assumes component-based or layered applications.
- **Decision.** Use a static multi-page site served from `welcome-app/public/`: two HTML files and one stylesheet. Treat this as the `static_site` pattern.
- **Alternatives.**
  - Keep existing pattern / do nothing: not possible, no existing app.
  - React + Vite with `container_presenter`: pros are a familiar component model and hot reload; cons are a build step, many transitive dependencies, a larger payload (threatens the 100 KB budget), and more console and accessibility surface for one page.
  - Place the page inside `KBSHari/AgenticAI`: pros are a single repository; cons are that the repository's structure is unknown and cannot be inspected from this workspace.
- **Consequences.** Positive: tiny payload, no build, trivial local run, easiest path to zero console errors. Negative: no component reuse if the app later grows; migration to a framework would rewrite the markup. Risks: future onboarding flow may outgrow static pages, mitigated by NG-001 keeping that work in a separate ticket.

### ADR-002: Test stack of Vitest with jsdom and Testing Library, plus Playwright with axe

- **Context.** REQ-006 requires automated tests runnable with one command; ASM-002 (user-accepted default) names Vitest or Jest with Testing Library plus Playwright. CSS, console output, navigation and accessibility cannot be verified in jsdom.
- **Decision.** Add dev dependencies: `vitest`, `jsdom`, `@testing-library/dom` for structure tests (COMP-005, COMP-006) and `@playwright/test` with `@axe-core/playwright` for browser tests (COMP-007). Versions are resolved at install time and pinned by `package-lock.json`. No runtime dependencies are added.
- **Alternatives.**
  - Jest instead of Vitest: pros are wide familiarity; cons are heavier configuration for ES modules and a second runtime alongside Playwright with no benefit here.
  - Playwright only: pros are one tool and fewer dependencies; cons are slower feedback for pure structure checks and no user-requested Testing Library layer.
  - Cypress: pros are an integrated runner; cons are a heavier install and a different tool from what the user accepted.
- **Consequences.** Positive: fast structural tests plus real-browser verification of REQ-004, REQ-005, REQ-008, REQ-009. Negative: Playwright needs a one-time browser download (`npx playwright install chromium`), roughly a few hundred MB. Risks: browser download blocked on restricted networks, mitigated by documenting it in COMP-011 and allowing the e2e script to be run separately from unit tests.

### ADR-003: Get Started is an anchor styled as a button

- **Context.** REQ-003 calls for a visible "Get Started" button that navigates to a placeholder. EC-003 requires it to work with JavaScript disabled.
- **Decision.** Implement the call to action as an anchor element styled to look like a button.
- **Alternatives.**
  - A native button element with a script click handler: pros are the exact "button" accessibility role; cons are it fails with JavaScript disabled and requires client-side script, contradicting ADR-004.
  - A native button inside a form with a GET action: pros are a true button role without script; cons are an unusual pattern for navigation and awkward semantics for assistive technology.
- **Consequences.** Positive: works without JavaScript, correct navigation semantics. Negative: assistive technology announces it as a link, not a button. Tests therefore query the link role named "Get Started". Risks: a stakeholder reading AC-003 literally may expect the button role; flagged in Flags.

### ADR-004: No client-side JavaScript, enforced by Content Security Policy

- **Context.** REQ-005 (zero console errors), REQ-010 (no third-party scripts, no network calls) and REQ-009 (under 100 KB).
- **Decision.** Ship no JavaScript to the browser. Declare a Content Security Policy in each HTML file permitting only same-origin resources, no scripts, and data URIs for images (used for an inline favicon so no favicon request fails).
- **Alternatives.**
  - Small vanilla script for the button: pros are programmatic navigation; cons are more console failure surface and unnecessary given a plain link.
  - No CSP: pros are simpler markup; cons are no guard against accidentally introduced third-party resources, weakening REQ-010.
- **Consequences.** Positive: smallest attack and error surface; REQ-010 becomes testable by assertion. Negative: any future interactive feature must revise the policy. Risks: a CSP violation would itself be logged as a console error, which the e2e console test would catch.

### ADR-005: Zero-dependency Node static server

- **Context.** REQ-007 requires a way to run the app locally, and Playwright needs a server to start.
- **Decision.** Provide a small server using only Node's built-in HTTP, file system and path modules, serving `welcome-app/public/` only, bound to loopback, with path-traversal protection and `nosniff`.
- **Alternatives.**
  - Add the `http-server` or `serve` package: pros are mature and no custom code; cons are a new dependency tree for a trivial need and less control over headers.
  - Python's built-in static server: pros are no install; cons are an extra runtime requirement, unreliable on Windows setups, and no header control.
  - Vite preview: pros are polished; cons are the framework dependency rejected in ADR-001.
- **Consequences.** Positive: no runtime dependencies, full control over headers, directly unit-testable (COMP-006). Negative: custom code carries its own correctness and security responsibility. Risks: path traversal or MIME mistakes, mitigated by COMP-006 tests for traversal, 404, 405 and content types.

### ADR-006: Serve a dedicated `public/` directory, not the project root

- **Context.** The project root will contain `node_modules`, configuration, tests and the server.
- **Decision.** Serve only `welcome-app/public/`.
- **Alternatives.**
  - Serve the project root: pros are fewer directories; cons are exposure of `package.json`, tests and `node_modules` over HTTP, and bloated network surface for REQ-010.
  - Copy built output into a separate folder: pros are a clear artefact; cons are an unnecessary build step with no transformation to perform.
- **Consequences.** Positive: a minimal and auditable public surface. Negative: one extra directory level in paths. Risks: none significant.

## Implementation Guidelines

### File structure

| Path | Purpose | Component |
|------|---------|-----------|
| `welcome-app/public/index.html` | Welcome page | COMP-001 |
| `welcome-app/public/getting-started.html` | Placeholder destination | COMP-002 |
| `welcome-app/public/styles.css` | Shared styles | COMP-003 |
| `welcome-app/server/server.js` | Local static server | COMP-004 |
| `welcome-app/tests/unit/pages.test.js` | HTML structure tests | COMP-005 |
| `welcome-app/tests/unit/server.test.js` | Server behaviour tests | COMP-006 |
| `welcome-app/tests/e2e/welcome.spec.js` | Browser tests | COMP-007 |
| `welcome-app/package.json` | Scripts and dev dependencies | COMP-008 |
| `welcome-app/vitest.config.js` | Unit test configuration | COMP-009 |
| `welcome-app/playwright.config.js` | E2E test configuration | COMP-010 |
| `welcome-app/README.md` | Local run and test instructions | COMP-011 |
| `welcome-app/.gitignore` | Ignore rules | COMP-012 |

### Naming conventions

| Item | Rule |
|------|------|
| Directories and files | lowercase kebab-case (for example `getting-started.html`) |
| CSS classes | lowercase kebab-case, no ID selectors for styling |
| Test files | `*.test.js` for unit tests, `*.spec.js` for Playwright |
| npm scripts | `start`, `test`, `test:unit`, `test:e2e` |

### Patterns to use

- Semantic HTML5: `main`, one h1, a paragraph, an anchor for navigation.
- Responsive layout by fluid widths, a centred content column with a maximum width, fluid type sizing and a single breakpoint-free flow; verify at 320, 768 and 1280 pixels. Long words must wrap rather than overflow.
- System font stack only, no web fonts and no images other than the inline favicon.
- A visible focus indicator on the call to action, never removed without replacement.
- Colour pairs with at least 4.5:1 contrast for body text and 3:1 for large text and focus indicator against its background; choose and record the exact values during implementation.
- Inline favicon declared with a data URI so no favicon request occurs.
- Content Security Policy meta element in both HTML files (contract above).
- `npm test` runs unit tests, then end-to-end tests, as the single test command (AC-006).

### Patterns to avoid

- Inline `style` attributes and inline scripts, because the CSP forbids them and they would log violations.
- Third-party fonts, icon libraries, analytics, CDNs or any absolute URL.
- Cookies, local storage or any form of tracking.
- Serving the project root or any file outside `public/`.
- Logging request details beyond method, path and status, and never logging client addresses, headers or query strings (client PII guardrail).
- Rewriting or reformatting files outside this feature (client guardrail).

### Libraries

| Name | Version | Purpose | Type |
|------|---------|---------|------|
| vitest | resolved at install, locked | Unit test runner | devDependency (ADR-002) |
| jsdom | resolved at install, locked | DOM environment for unit tests | devDependency (ADR-002) |
| @testing-library/dom | resolved at install, locked | Accessible queries in unit tests | devDependency (ADR-002) |
| @playwright/test | resolved at install, locked | Browser test runner | devDependency (ADR-002) |
| @axe-core/playwright | resolved at install, locked | WCAG 2.1 AA checks | devDependency (ADR-002) |

No runtime dependencies. Node.js engine range to be declared in COMP-008 (Node 20 or newer, matching the locally observed v24).

### Code standards

- Error handling in COMP-004 follows the HTTP contract table: generic bodies, no stack traces or filesystem paths in responses.
- Logging: server logs only start-up message and method, path and status per request. No personal data.
- Run the test baseline before any change. There are no existing tests, so the baseline is zero tests; record that in the implementation manifest and then run tests after each file is created.
- The CSS may start empty and be filled incrementally, but each page must render with no console output at every step.
- Local run flow documented in COMP-011: install dependencies, install the Chromium browser once, start the server, open the printed address, run all tests.

## Testing Strategy

### Unit test targets (COMP-005, COMP-006)

| Target | Verifies |
|--------|----------|
| Welcome page h1 | AC-001: exactly one level-1 heading with the expected text |
| Welcome page description | AC-002: paragraph present, one or two sentences |
| Get Started link | AC-003 (structure): link role named "Get Started" with the expected href |
| Landmarks and language | AC-008 (structure): one `main`, `lang` set, document title set |
| Content Security Policy | AC-010 (structure): policy present with required directives |
| External references | AC-010: no absolute or protocol-relative URLs in either page |
| Getting Started page | h1 present, back link present |
| Server path handling | Root maps to `index.html`; unknown path 404; traversal attempts never return file contents; non-GET gives 405 |
| Server headers and types | Correct content types, `nosniff` header on responses |

### Integration test targets

Not separately defined. Server-to-browser integration is covered by the end-to-end tests below.

### E2E scenarios (COMP-007, Chromium)

| # | Scenario (user-story form) | AC |
|---|----------------------------|----|
| E-01 | As a new user, when I open the app, I see the welcome heading and description | AC-001, AC-002 |
| E-02 | As a new user, when I activate Get Started with mouse or keyboard, I land on the Getting Started page | AC-003 |
| E-03 | As a user on a 320, 768 or 1280 pixel wide screen, the page has no horizontal scrolling and all content is visible | AC-004 |
| E-04 | As a user, loading both pages produces zero console errors or warnings, page errors or failed requests | AC-005 |
| E-05 | As a keyboard user, I can Tab to Get Started and see a visible focus indicator | AC-008 |
| E-06 | As an assistive technology user, the pages have zero WCAG 2.1 A and AA violations per axe | AC-008 |
| E-07 | As a privacy-conscious user, all requests are same-origin and no cookies are set | AC-010 |
| E-08 | As a user on a slow device, total transferred weight of the welcome page is under 100 KB and LCP is under 2.5 seconds | AC-009 |
| E-09 | As a user with JavaScript disabled, I can still read the content and navigate via Get Started | EC-003 |
| E-10 | As a user, a missing page gives a clean 404 response and requests outside `public/` are refused | server safety |

### Coverage target

The client knowledge base states no org standard. Targets: 100 percent of acceptance criteria AC-001 to AC-010 mapped to at least one automated test; line coverage of 80 percent or more for `welcome-app/server/server.js` (the only code with logic) as measured by the unit tests. HTML and CSS have no line coverage target.

### Known verification limits

- AC-009 is measured on localhost, which is a lower bound; it does not model a real "standard connection". Treat as a budget check on weight (the meaningful part) and a sanity check on LCP.
- Cross-browser coverage of Firefox, Safari and Edge is declared by REQ scope but only Chromium is automated. Other browsers are a manual smoke check (flagged).

## Security Considerations

| Concern | Mitigation | OWASP category |
|---------|-----------|----------------|
| Path traversal in the static server exposing files outside `public/` | Resolve every request path against the public root and reject anything that escapes; serve only `public/`; unit and e2e tests (ADR-005, ADR-006) | A01 Broken Access Control |
| Misconfigured headers or unintended resource loading | CSP meta element with same-origin only and scripts disabled, `X-Content-Type-Options: nosniff`, loopback bind (ADR-004) | A05 Security Misconfiguration |
| Information disclosure through errors | Generic error bodies, no stack traces or paths; no directory listings | A05 Security Misconfiguration |
| Vulnerable or malicious dev dependencies | Five dev-only dependencies, no runtime dependencies, versions pinned by committed lockfile, run an audit before PR | A06 Vulnerable and Outdated Components |
| Supply chain integrity | Install from the public npm registry with the lockfile; no install scripts beyond Playwright browser download documented in README | A08 Software and Data Integrity Failures |
| Injection | No user input, forms, query handling or templating exist | A03 Injection (not applicable) |
| PII, consent and compliance (PCI-DSS, HIPAA, GDPR) | No personal data collected, stored, logged or transmitted; no cookies or analytics; no third-party requests; server logs exclude client addresses and query strings (REQ-010) | GDPR data minimisation |
| Credentials | None used; none committed | A07 Identification and Authentication Failures (not applicable) |

## Design Changes Log

| Version | Date | Changes | Rationale |
|---------|------|---------|-----------|
| 1 | 2026-10-26 | Initial design | First iteration from `ph1_problem_spec.md` |

## Flags

| # | Type | Finding | Recommended action |
|---|------|---------|--------------------|
| F-1 | ambiguity | REQ-003 and AC-003 say "button". ADR-003 implements an anchor styled as a button, whose accessible role is link. | Accept, or request a native button (which needs client-side JavaScript or a form and contradicts ADR-004). Decide at the architecture gate. |
| F-2 | infeasible (partial) | AC-009 asks for LCP under 2.5 s on a "standard connection". Local testing cannot represent that. | Treat the automated check as a localhost budget; confirm if a throttled audit is required. |
| F-3 | missing_requirement | REQ scope lists Chrome, Edge, Firefox and Safari, but only Chromium is automated. | Accept manual smoke checks for the other browsers, or add Firefox and WebKit Playwright projects. |
| F-4 | ambiguity | ASM-004: the git root is the home directory and has no remote configured. Where `welcome-app/` is committed, and whether the PR targets `KBSHari/AgenticAI`, is unresolved. | Decide before the PR phase; may need a separate clone or repository setup. |
| F-5 | process | The design lists 12 files plus a generated lockfile. Implementation planning auto-triggers wave-based execution when a design has more than 8 files. | Expect wave execution in Phase 4/5, or reduce scope. |
