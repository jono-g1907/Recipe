File: src/middleware/error.js
Purpose: Central Express error handler translating thrown errors into HTML redirects or JSON responses.

At a glance: Detects JSON parse errors, custom `ValidationError`s, and falls back to 500 responses, logging unexpected issues.

Imports & dependencies:
- `path` (Node core) – resolves the fallback HTML path.
- `../errors/ValidationError` – type guard for validation failures.

Configuration/Constants:
- Internal helpers `clientWantsHtml` (Accept header sniff) and `pickValidationStatus` (upgrades to 400 when any message contains "required").

Main content (annotated walkthrough):
1. **Invalid JSON**: Express 5 forwards body-parser errors as `SyntaxError` with a `.body` property. Handler short-circuits with `400 { error: 'Invalid JSON body' }`.
2. **Validation errors**: Checks `instanceof ValidationError`.
   - Chooses `400` vs `422` via `pickValidationStatus`.
   - If Accept header prefers HTML, redirects to `/invalid.html` (served by static middleware). Otherwise returns JSON describing the error list.
3. **Unknown errors**: Logs to stderr. For API paths (`req.path` starting `/api`), responds with JSON `500`. For other routes, serves `views/invalid.html` to give the user a friendly page.

Edge cases & errors:
- `clientWantsHtml` only inspects string inclusion; browsers sending `*/*` will not trigger the HTML redirect. Works for current forms which set default Accept.
- Logging leverages `console.error`, so production deployments may need structured logging.

Security notes:
- Keeps error details minimal for non-validation issues, avoiding sensitive leakage.

Exports & consumers:
- Registered last in `src/server.js`.

Related files: `docs/line-by-line/src_middleware_notFound.js.md`, `docs/line-by-line/src_server.js.md`.
