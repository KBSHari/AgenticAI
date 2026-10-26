# Hari SDLC Agent: Welcome App

A small static welcome page for the Hari SDLC Agent (Jira ticket SCRUM-1). It has a welcome page, a placeholder Getting Started page, a tiny local web server and automated tests.

The app makes no network calls, sets no cookies, uses no analytics and collects no personal data.

## Prerequisites

- Node.js 20 or newer (check with `node --version`)
- npm (ships with Node.js)

## Install

Run these from this directory (`welcome-app/`):

```
npm install
npx playwright install chromium
```

`npx playwright install chromium` downloads the browser used by the end-to-end tests. You only need to run it once per machine.

## Run the app

```
npm start
```

Then open http://127.0.0.1:3000 in your browser. The server only listens on your own machine.

If port 3000 is already in use, pick another port with the `PORT` environment variable:

- macOS, Linux or Git Bash: `PORT=3100 npm start`
- Windows PowerShell: `$env:PORT=3100; npm start`

## Run the tests

| Command | What it runs |
|---------|--------------|
| `npm test` | All tests: unit tests, then end-to-end tests |
| `npm run test:unit` | Unit tests only (page structure and server behaviour) |
| `npm run test:e2e` | Browser tests only (console errors, responsive layout, accessibility, size) |

The end-to-end tests start their own server on port 4173, so you do not need to run `npm start` first. If the browser is missing, install it with `npx playwright install chromium`.

Only Chromium is tested automatically. Please smoke-check the page by hand in Firefox, Safari and Edge before a release.

The page-load time check runs against your own machine, so it is a lower bound and not a measurement over a real network.

## Project layout

| Path | Purpose |
|------|---------|
| `public/index.html` | Welcome page |
| `public/getting-started.html` | Placeholder page that "Get Started" opens |
| `public/styles.css` | Shared styles |
| `server/server.js` | Local web server; serves only the `public/` folder |
| `tests/unit/` | Unit tests (Vitest with jsdom and Testing Library) |
| `tests/e2e/` | Browser tests (Playwright with axe accessibility checks) |
| `vitest.config.js`, `playwright.config.js` | Test configuration |
