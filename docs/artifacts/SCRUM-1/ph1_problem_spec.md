# Problem Specification: SCRUM-1

## Meta

| Field | Value |
|-------|-------|
| Ticket | SCRUM-1 |
| Feature ID | FEAT-0001 |
| Title | Create a Welcome Page Hari SDLC Agent |
| Classification | Story |
| Date | 2026-10-26 |
| Author | KBSHari (via SDLC pipeline, Phase 1) |
| Status | Approved |

## Problem Statement

A new user opening the Hari SDLC Agent app has no landing page explaining what it is or how to begin. We need a clean, responsive, accessible welcome page with a clear call to action.

## Requirements

| ID | Type | Priority | Description |
|----|------|----------|-------------|
| REQ-001 | functional | P0 | The page shall display a clear welcome heading ("Welcome to Hari SDLC Agent") as the single h1. |
| REQ-002 | functional | P0 | The page shall display a short 1–2 sentence description of the application's purpose. |
| REQ-003 | functional | P0 | The page shall provide a visible "Get Started" button that navigates to a placeholder Getting Started destination. |
| REQ-004 | non-functional | P0 | The layout shall be clean and responsive from 320px to desktop widths without horizontal scrolling. |
| REQ-005 | non-functional | P0 | The page shall load without any browser console errors or warnings. |
| REQ-006 | functional | P0 | Automated tests shall cover the heading, description, Get Started button, responsive layout and console-error-free load, runnable with a single command. |
| REQ-007 | functional | P0 | The repo shall include instructions to install, run and test the app locally. |
| REQ-008 | non-functional | P1 | The page shall meet WCAG 2.1 AA (semantic landmarks, keyboard-focusable button with a visible focus state, sufficient contrast). |
| REQ-009 | non-functional | P1 | The page shall weigh under 100 KB and reach largest contentful paint under 2.5 s on a standard connection. |
| REQ-010 | non-functional | P0 | The page shall collect, store, log or transmit no personal data and use no cookies, analytics or third-party scripts, fonts or network calls. |

## Acceptance Criteria

| ID | Requirement | Criterion |
|----|-------------|-----------|
| AC-001 | REQ-001 | Given the app is opened, when the page loads, then exactly one h1 reads "Welcome to Hari SDLC Agent". |
| AC-002 | REQ-002 | Given the page is loaded, when I read below the heading, then a 1–2 sentence description of the agent is visible. |
| AC-003 | REQ-003 | Given the page is loaded, when I click or keyboard-activate "Get Started", then I land on the placeholder Getting Started destination. |
| AC-004 | REQ-004 | Given viewport widths of 320px, 768px and 1280px, when the page renders, then all content is visible with no horizontal scroll and the layout adapts. |
| AC-005 | REQ-005 | Given a fresh load in Chromium, when I inspect the console, then there are zero errors and zero warnings. |
| AC-006 | REQ-006 | Given the repo, when I run the single test command, then tests assert the heading, description, button, responsive layout and zero console errors, and all pass. |
| AC-007 | REQ-007 | Given a clean checkout, when I follow the README, then I can install, start and test the app locally. |
| AC-008 | REQ-008 | Given an accessibility check (axe or equivalent), when run on the page, then there are zero WCAG 2.1 AA violations and the button is reachable by Tab with a visible focus indicator. |
| AC-009 | REQ-009 | Given a standard-connection audit, when the page loads, then total weight is under 100 KB and LCP is under 2.5 s. |
| AC-010 | REQ-010 | Given the network panel on load, when I inspect requests, then only same-origin static assets appear, with no cookies set. |

## Constraints

- Scope: one static welcome page, a placeholder Getting Started destination, automated tests, and local run instructions.
- Platforms: responsive web (320px up to desktop), latest Chrome, Edge, Firefox and Safari.
- Stack direction: plain HTML/CSS/JS in a new `welcome-app/` directory in this workspace, with a minimal local static server. Final stack choice belongs to architecture/planning.
- Language: English only, no internationalisation.
- Feature flags: no feature flag system in use (client-kb.md); none required for this new page.
- Compliance: client is subject to PCI-DSS, HIPAA and GDPR; the page handles no personal data (REQ-010).
- Client guardrails: test every change immediately, no unsolicited changes, no credentials committed, no PR without a linked ticket reference.

## Non-Goals

- NG-001: Real Getting Started or onboarding flow. The destination is a placeholder only; the real flow is a separate ticket.
- NG-002: Authentication, user accounts, or personalisation, since the page is public and static.
- NG-003: Internationalisation (English only) and any analytics or telemetry, to avoid consent and PII scope.
- NG-004: Backend, database, or API work.

## Assumptions

- ASM-001: Description copy: "Hari SDLC Agent automates your software delivery lifecycle, from Jira ticket to pull request, with human approval at every step." (risk_if_wrong: low; validation_needed: false)
- ASM-002: Test stack is Vitest/Jest with Testing Library plus Playwright with axe, and needs Node.js and npm installed locally. (risk_if_wrong: medium; validation_needed: true)
- ASM-003: Getting Started placeholder is a section or second static page in the same app. (risk_if_wrong: low; validation_needed: false)
- ASM-004: Target repo for the PR is `KBSHari/AgenticAI`, confirmed at the PR phase. (risk_if_wrong: medium; validation_needed: true)

## Edge Cases

- EC-001 (REQ-004): Viewport below 320px or very large (above 2560px) → content stays readable and centred, with no overflow.
- EC-002 (REQ-005): A static asset such as the stylesheet or favicon is missing → no console error for the favicon (inline or present) and content stays readable.
- EC-003 (REQ-003): JavaScript disabled → the heading, description and the button as a plain link still work.
- EC-004 (REQ-008): Keyboard-only or screen-reader user → logical focus order, and the button is announced with its label.

## Backward Compatibility

✅ No breaking changes identified. This is a new, greenfield page with no existing API, schema, library, event, config or behaviour affected.

## Decision Log

| # | Decision | Alternatives Considered | Why Chosen | Q&A Round |
|---|----------|------------------------|------------|-----------|
| DL-001 | Plain static HTML/CSS/JS in a new `welcome-app/` directory | React + Vite; inside AgenticAI | User accepted default; minimal footprint for a single static page | Round 1 |
| DL-002 | Get Started goes to a placeholder destination | External URL; disabled stub | User accepted default; real flow is out of scope | Round 1 |
| DL-003 | No data collection, cookies, analytics or third-party scripts | Basic analytics | User accepted default; avoids consent and GDPR scope | Round 1 |
| DL-004 | Heading and description copy drafted by the agent | User-supplied copy | User chose defaults, so the agent drafts it | Round 1 |

## Glossary

| Term | Definition |
|------|------------|
| Hari SDLC Agent | The application this welcome page introduces; automates the software delivery lifecycle from Jira ticket to pull request. |
| Get Started | The primary call-to-action button on the welcome page. |
| Placeholder Getting Started destination | A stub section or page the button navigates to; the real onboarding flow is out of scope. |
| WCAG 2.1 AA | Web Content Accessibility Guidelines 2.1, conformance level AA. |
| LCP | Largest Contentful Paint, a web performance metric for main-content load time. |
| axe | Automated accessibility testing engine used to check WCAG violations. |
| PII | Personally identifiable information. |
| PCI-DSS / HIPAA / GDPR | Payment-card, health-data and EU data-protection compliance regimes that apply to the client. |

## Affected Repos

- Single-repo change. A new `welcome-app/` directory is created in this workspace (git root at the home directory; the PR target repo `KBSHari/AgenticAI` is decided at the PR phase).
- No upstream or cross-repo dependencies.
