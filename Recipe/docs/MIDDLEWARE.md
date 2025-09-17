# Middleware

Express middleware executes in the order registered inside `src/server.js`. Understanding this sequence is critical to predict request handling.

| Order | Module | Type | Purpose / Notes |
| --- | --- | --- | --- |
| 1 | `express.json()` | Built-in | Parses JSON bodies for API requests. Throws `SyntaxError` on invalid JSON, handled later by error middleware. |
| 2 | `express.urlencoded({ extended: true })` | Built-in | Parses HTML form submissions (`application/x-www-form-urlencoded`). Needed for dashboard forms. |
| 3 | `express.static('../node_modules/bootstrap/dist/css/bootstrap.min.css')` mounted at `/bootstrap` | Built-in | Intended to serve Bootstrap CSS; path targets a file not a directory (effectively no-op). See `docs/CONFIG.md` for fix. |
| 4 | `express.static('images')` | Built-in | Would serve static images; directory currently missing (harmless). |
| 5 | `express.static('css')` | Built-in | Serves `/bootstrap.min.css` (local copy) and `/style.css`. |
| 6 | Route handlers (dashboard + forms) | Application | Define EJS-rendered pages and form POST handlers (refer to `docs/API.md` & `docs/VIEWS.md`). |
| 7 | `express.static('views', { index: false })` | Built-in | Allows direct hits on `/invalid.html` etc without exposing automatic index pages. |
| 8 | `/api` router (`src/routes/index.js`) | Application | Hosts JSON endpoints for recipes/inventory. |
| 9 | `notFound` | Application | Handles any request not matched earlier. Chooses HTML vs JSON responses. |
| 10 | `errorHandler` | Application | Terminal error middleware; handles JSON parse errors, `ValidationError`s, and generic 500s.

## Error Propagation
- Route handlers wrap mutating operations in `try/catch` and call `next(err)` to ensure the error handler runs.
- `ValidationError` triggers custom status selection (400 vs 422). HTML clients (Accept header includes `text/html`) get redirected to `/invalid.html`; JSON clients receive structured payload.
- Static middleware runs before dynamic routes; when a static file matches, downstream handlers are skipped.

## Side Effects
- `express.static` caches files in memory when `ETag` caching is enabled (default). No explicit caching configured.
- Error middleware logs uncaught errors via `console.error`.

## Suggested Enhancements
1. Replace Bootstrap static mount with `express.static(path.join(__dirname, '../node_modules/bootstrap/dist'))` and update HTML references to `/bootstrap/css/bootstrap.min.css`.
2. Introduce request logging middleware (e.g., `morgan`) for observability.
3. Add rate limiting/auth middleware before API router if exposed publicly.
