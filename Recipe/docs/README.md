# Recipe Documentation Hub

Welcome to the documentation set for the Recipe assignment. This guide orients new contributors and stakeholders to the codebase, architecture, and operational procedures.

## Executive Summary
- **Purpose**: Manage recipes and pantry inventory for Assignment 1 (FIT2095) via HTML dashboards and a JSON API.
- **Tech Stack**: Node.js 18+, Express 5, EJS templates, Bootstrap styling, in-memory storage seeded from `src/seed.js`.
- **Key Features**: Dashboard metrics, recipe/inventory CRUD (forms + API), validation via domain models, centralised error handling.

## Quickstart
1. Install [Node.js 18 or newer](https://nodejs.org/en/download).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node src/server.js
   ```
4. Open http://localhost:8080/ in your browser.

### Platform Notes
- **Windows**: Use PowerShell or CMD. Commands above work unchanged. Ensure `node` is in PATH.
- **macOS**: Install Node via Homebrew (`brew install node`) or nvm. Use Terminal for commands shown.
- **Linux**: Use package manager (apt/yum) or nvm to install Node. When binding to privileged ports (<1024), run as non-root and proxy via nginx.

### Seeding / Reset
- Seeds load automatically at startup from `src/seed.js` via `src/store.js`. Restarting the process resets data.

## NPM Scripts
| Command | Description |
| --- | --- |
| `npm install` | Install dependencies. |
| `node src/server.js` | Launch application on port 8080. |
| `npm test` | Currently fails intentionally; replace when the test suite is added. |

## Directory Map
```
Recipe/
+- docs/                     ? Documentation bundle (this folder)
¦  +- README.md              ? High-level guide
¦  +- ARCHITECTURE.md
¦  +- API.md
¦  +- CONFIG.md
¦  +- CONTRIBUTING.md
¦  +- FAQ.md
¦  +- GLOSSARY.md
¦  +- MIDDLEWARE.md
¦  +- MODELS-and-SCHEMAS.md
¦  +- SECURITY.md
¦  +- TESTING.md
¦  +- VIEWS.md
¦  +- COVERAGE_REPORT.md     ? Documentation coverage summary
¦  +- line-by-line/          ? Per-file annotated walkthroughs
+- src/
¦  +- server.js              ? Express entrypoint
¦  +- routes/                ? API routers
¦  +- models/                ? Domain models & validation
¦  +- middleware/            ? 404 + error handlers
¦  +- views/                 ? EJS templates
¦  +- css/                   ? Bootstrap + custom styles
¦  +- lib/                   ? Constants & utilities
¦  +- errors/                ? ValidationError class
¦  +- seed.js                ? Initial data
¦  +- store.js               ? In-memory data store
+- index.js                  ? Package export surface
+- package.json              ? npm manifest
+- package-lock.json         ? Dependency lockfile
```

## Key Resources
- [Architecture](ARCHITECTURE.md)
- [API Reference](API.md)
- [Model & Schema Guide](MODELS-and-SCHEMAS.md)
- [Views Catalogue](VIEWS.md)
- [Middleware Pipeline](MIDDLEWARE.md)
- [Configuration](CONFIG.md)
- [Security Checklist](SECURITY.md)
- [Testing Plan](TESTING.md)
- [Contribution Guide](CONTRIBUTING.md)
- [Glossary](GLOSSARY.md)
- [FAQ](FAQ.md)
- [Per-file walkthroughs](line-by-line/)

## Support & Next Steps
- Review `docs/SECURITY.md` before exposing the app publicly.
- Track unresolved issues or follow-ups in `docs/COVERAGE_REPORT.md` and project issue tracker.
- For questions, see the FAQ or contact the original author noted in `src/lib/constants.js`.
