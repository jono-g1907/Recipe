# Configuration Guide

This project favours hard-coded configuration with no `.env` support. This document lists all tunable values and where they originate.

## Environment Variables

| Name | Default | Used in | Mandatory | Notes |
| --- | --- | --- | --- | --- |
| *(none)* | — | — | — | All configuration is hard-coded. Consider adding `PORT` and `APP_ID` overrides for flexibility. |

## Application Constants

| Constant | Value | Defined in | Consumers |
| --- | --- | --- | --- |
| `APP_ID` | `31477046` | `src/lib/constants.js` | Route URLs, templates, API paths, seeds |
| `AUTHOR_NAME` | `Jonathan Gan` | `src/lib/constants.js` | Dashboard greeting, seeds |

## Server Settings (`src/server.js`)
- `app.set('port', 8080)`: Change to use `process.env.PORT || 8080` if deploying to cloud platforms.
- View engine: EJS rendering `.html` files under `src/views`.
- Static directories:
  - `/bootstrap`: currently points to `../node_modules/bootstrap/dist/css/bootstrap.min.css` (file). Update to directory mount.
  - `/css`: exposes `src/css`. Templates reference `/bootstrap.min.css` from here.
  - `/images`: configured but directory missing; create `src/images` or remove mount.
  - `/views`: served as static (index disabled) to allow direct access to error pages.

## Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `express` | ^5.1.0 | HTTP server. Note: Express 5 is currently in RC; monitor changelog. |
| `ejs` | ^3.1.10 | Template engine to render `.html` files with EJS syntax. |

No devDependencies are defined. Consider adding ESLint/Prettier for style enforcement.

## Scripts (`package.json`)
- `npm test`: placeholder that always fails (`exit 1`). Replace with actual test runner when implemented.
- Missing scripts: add ` : ???`? (Opportunity: add `"start": "node src/server.js"`).

## Data Seeds (`src/seed.js`)
- Inventory and recipe seeds rely on `APP_ID` and `AUTHOR_NAME`. Updating constants without adjusting seeds may break invariants (e.g., duplicate detection tests).

## File System Expectations
- `src/store.js` builds in-memory arrays on startup. No database configuration required.
- Forms rely on static HTML; ensure `src/views` remains accessible.

## Deployment Checklist
1. Add environment-controlled port and base URL.
2. Provide process manager configuration (e.g., PM2, Heroku Procfile) referencing `src/server.js`.
3. Harden static mounts (fix Bootstrap path, remove unused `images` until directory exists).
