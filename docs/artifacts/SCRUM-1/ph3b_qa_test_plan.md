# QA Test Plan: SCRUM-1

## Meta
- Ticket: SCRUM-1
- Classification: Small Feature
- Phase: 3b (QA Test Generation)
- Generated at: 2026-10-26T19:10:46.000+0530

## Inputs Summary
Covers all 10 acceptance criteria (AC-001 to AC-010) from `ph1_problem_spec.md` and the 4 edge cases (EC-001 to EC-004), against the static-site design in `ph2_design_spec.md` (COMP-001 to COMP-012). Greenfield: no existing endpoints or components are modified, so no backward-compatibility invariants apply. 30 test cases (3 per AC: positive, negative, edge). Run mode is plan-only: no test management tool profile exists for Zephyr Scale and no QA automation repo is configured.

## Existing Zephyr Matches (JQL filter 28319)
Not queried. The workspace has no tool profile for Zephyr Scale (only a Zephyr Squad profile exists), so duplicate discovery was skipped. The project is greenfield, so matches are not expected. All tests are marked `decision: new`. Recommended follow-up: a human checks filter 28319 before importing these cases.

## AC → Test Matrix

| AC | Priority (REQ) | Positive | Negative | Edge | Decision |
|----|----------------|----------|----------|------|----------|
| AC-001 | P0 | TC-001 | TC-002 | TC-003 | new |
| AC-002 | P0 | TC-004 | TC-005 | TC-006 | new |
| AC-003 | P0 | TC-007 | TC-008 | TC-009 | new |
| AC-004 | P0 | TC-010 | TC-011 | TC-012 | new |
| AC-005 | P0 | TC-013 | TC-014 | TC-015 | new |
| AC-006 | P0 | TC-016 | TC-017 | TC-018 | new |
| AC-007 | P0 | TC-019 | TC-020 | TC-021 | new |
| AC-008 | P1 | TC-022 | TC-023 | TC-024 | new |
| AC-009 | P1 | TC-025 | TC-026 | TC-027 | new |
| AC-010 | P0 | TC-028 | TC-029 | TC-030 | new |

## Test Cases

| ID | Title | Type | Preconditions | Steps | Expected | ACs | Priority | Decision | Regression |
|----|-------|------|---------------|-------|----------|-----|----------|----------|------------|
| TC-001 | Welcome page has the exact h1 | functional | Static files available | Load index.html; query heading level 1 | Exactly one h1 reads 'Welcome to Hari SDLC Agent' | AC-001 | critical | new | true |
| TC-002 | No duplicate or empty headings on welcome page | functional | Static files available | Count level-1 headings; check h1 not empty | Exactly one non-empty h1; no second h1 | AC-001 | high | new | true |
| TC-003 | Long h1 wraps at 320px without clipping | e2e | Server running | Open / at 320px width; check h1 bounding box inside viewport | h1 fully visible, no horizontal overflow | AC-001 | medium | new | false |
| TC-004 | Description paragraph follows the h1 | functional | Static files available | Load index.html; read element after h1 | A paragraph with the agreed description text is present | AC-002 | critical | new | true |
| TC-005 | Description is 1-2 sentences and non-empty | functional | Static files available | Split description into sentences | Count is 1 or 2; text not blank | AC-002 | high | new | true |
| TC-006 | Description wraps at 320px and 200% zoom | e2e | Server running | Open / at 320px and zoom 200% | Text fully readable, no overflow | AC-002 | medium | new | false |
| TC-007 | Get Started navigates to the placeholder page | functional | Server running | Click link named Get Started | URL is /getting-started.html and its h1 is 'Getting Started' | AC-003 | critical | new | true |
| TC-008 | Get Started target exists; unknown page returns 404 | integration | Server running | GET href of link; GET /does-not-exist | Link target 200; unknown path 404 with generic body | AC-003 | high | new | true |
| TC-009 | Get Started works by keyboard and without JavaScript | functional | Server running; JS disabled context | Tab to link; press Enter | Navigates to Getting Started page | AC-003 | high | new | true |
| TC-010 | Layout correct at 1280px | e2e | Server running | Open / at 1280px | Content centred in a bounded column; all elements visible | AC-004 | high | new | false |
| TC-011 | No horizontal scroll at 320px | e2e | Server running | Open / and /getting-started.html at 320px | scrollWidth <= clientWidth on both pages | AC-004 | critical | new | false |
| TC-012 | Layout holds at 768px, 280px and 2560px | e2e | Server running | Open / at each width | No overflow; content readable and centred | AC-004 | medium | new | false |
| TC-013 | Zero console messages on welcome page load | e2e | Server running | Open /; collect console, pageerror, requestfailed | Zero errors, zero warnings, zero failed requests | AC-005 | critical | new | false |
| TC-014 | CSP violation or missing favicon is detected as failure | e2e | Server running | Load page; assert no CSP violations and no favicon request errors | No console output; inline favicon in use | AC-005 | high | new | false |
| TC-015 | Getting Started page also loads clean | e2e | Server running | Open /getting-started.html with listeners | Zero console errors or warnings | AC-005 | medium | new | false |
| TC-016 | npm test runs unit and e2e and passes | integration | Dependencies and Chromium installed | Run npm test | Exit code 0; unit then e2e suites executed | AC-006 | critical | new | true |
| TC-017 | A failing assertion makes npm test exit non-zero | integration | Dependencies installed | Temporarily alter expected heading text; run npm test | Non-zero exit; failure names the assertion | AC-006 | high | new | true |
| TC-018 | Missing Chromium gives a clear message | functional | Dependencies installed, Chromium not installed | Run npm run test:e2e | Error points to the documented install command | AC-006 | medium | new | true |
| TC-019 | README steps work from a clean checkout | functional | Clean checkout, Node 20+ | Follow README: install, install browser, start, open URL, test | App served and tests pass | AC-007 | critical | new | true |
| TC-020 | Unsupported Node version fails clearly | functional | Node below declared engine | Run npm install | Engine warning or error is shown | AC-007 | medium | new | true |
| TC-021 | Port in use is resolved by PORT override | functional | Port 3000 occupied | Start with PORT=3100 per README | Server starts on 3100 and serves the page | AC-007 | medium | new | true |
| TC-022 | axe finds zero WCAG 2.1 A/AA violations | accessibility | Server running | Run axe (wcag2a, wcag2aa, wcag21a, wcag21aa) on both pages | Zero violations | AC-008 | critical | new | false |
| TC-023 | Text and focus contrast meet thresholds | accessibility | Server running | Check contrast of body text, link text and focus ring | Text >= 4.5:1; large text and focus indicator >= 3:1 | AC-008 | high | new | false |
| TC-024 | Keyboard focus is visible and link is announced | accessibility | Server running | Press Tab from page start; read accessible name and role | Get Started focused with visible indicator; named 'Get Started', role link | AC-008 | high | new | false |
| TC-025 | Welcome page transfer under 100 KB | e2e | Server running | Sum response body sizes for / | Total < 100 KB | AC-009 | high | new | false |
| TC-026 | Only HTML and CSS are requested | e2e | Server running | List requests on load | Only the document and styles.css; no fonts, images, scripts | AC-009 | medium | new | false |
| TC-027 | LCP under 2.5 s with throttling | e2e | Server running; CPU and network throttled | Measure LCP via PerformanceObserver | LCP < 2.5 s (localhost lower bound, see Flags F-2) | AC-009 | medium | new | false |
| TC-028 | All requests are same-origin | integration | Server running | Record every request on load of both pages | No request leaves the server's origin | AC-010 | critical | new | true |
| TC-029 | No cookies or storage; CSP blocks external resources | integration | Server running | Load pages; read cookies and storage; check CSP meta directives | Cookies empty; storage empty; CSP has default-src 'self' and script-src 'none' | AC-010 | critical | new | true |
| TC-030 | Server refuses traversal and non-GET; sets nosniff | integration | Server instance available | Request ../package.json and encoded variants; send POST | Never returns file contents; 403/404; POST gives 405; nosniff header present | AC-010 | critical | new | true |

EC coverage: EC-001 (extreme widths) TC-012; EC-002 (missing asset, favicon) TC-014; EC-003 (JavaScript disabled) TC-009; EC-004 (keyboard and screen reader) TC-024.

## Regression Subset

Rule applied: a test is regression when its type is functional or integration AND the AC is critical-path. Rules R1 (modifies an existing endpoint or component) and R3 (backward-compatibility invariant) cannot fire in a greenfield project. R2 fired using `ph1_problem_spec.md` priority P0 as the must-pass marker (AC-001 to AC-007 and AC-010). e2e and accessibility tests are excluded by type. 16 of 30 tests qualify.

| Test | Jira key | Rule fired | Planned location |
|------|----------|------------|------------------|
| TC-001 | not created | R2 (P0 critical path) | tests/unit/pages.test.js |
| TC-002 | not created | R2 (P0 critical path) | tests/unit/pages.test.js |
| TC-004 | not created | R2 (P0 critical path) | tests/unit/pages.test.js |
| TC-005 | not created | R2 (P0 critical path) | tests/unit/pages.test.js |
| TC-007 | not created | R2 (P0 critical path) | tests/e2e/welcome.spec.js |
| TC-008 | not created | R2 (P0 critical path) | tests/unit/server.test.js |
| TC-009 | not created | R2 (P0 critical path) | tests/e2e/welcome.spec.js |
| TC-016 | not created | R2 (P0 critical path) | package.json scripts |
| TC-017 | not created | R2 (P0 critical path) | manual mutation check |
| TC-018 | not created | R2 (P0 critical path) | README.md |
| TC-019 | not created | R2 (P0 critical path) | manual (README walkthrough) |
| TC-020 | not created | R2 (P0 critical path) | manual (README walkthrough) |
| TC-021 | not created | R2 (P0 critical path) | manual (README walkthrough) |
| TC-028 | not created | R2 (P0 critical path) | tests/e2e/welcome.spec.js |
| TC-029 | not created | R2 (P0 critical path) | tests/unit/pages.test.js |
| TC-030 | not created | R2 (P0 critical path) | tests/unit/server.test.js |

TC-017, TC-019, TC-020 and TC-021 are manual checks; they qualify as regression by rule but cannot be automated.

## Jira Issues Created / Linked

| Jira key | Action | Parent link |
|----------|--------|-------------|
| none | Plan-only run: no Zephyr Scale tool profile, so no Test issues were created | SCRUM-1 |

`.state/qa_jira_issues.json` records the 30 planned tests with deterministic dedup keys (`SCRUM-1::<AC>::<sha256(title)[:12]>`) so a later run can create them without duplicates.

## Automation PR
- Branch: none
- PR URL: skipped, no QA automation repo configured
- Lint status: skipped
- Note: the automated tests will instead be written inside the feature itself (COMP-005, COMP-006, COMP-007) during implementation.

## Sign-Off
- Status: partial-(plan-only)
- Notes: (1) Import the 30 cases into Zephyr Scale manually or supply a Zephyr Scale tool profile and re-run this phase; it is idempotent. (2) Check JQL filter 28319 for duplicates before importing. (3) Phase 4 should use the AC → Test Matrix above to size COMP-005, COMP-006 and COMP-007. (4) The summary comment for this phase is posted by the pipeline orchestrator as the standard phase comment.
