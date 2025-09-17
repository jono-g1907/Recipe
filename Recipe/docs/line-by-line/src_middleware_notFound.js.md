File: src/middleware/notFound.js
Purpose: Express catch-all 404 handler returning HTML or JSON depending on the client.

At a glance: Sends `404.html` for HTML clients, JSON payload otherwise.

Imports & dependencies:
- `path` (Node core) – resolves the template path under `src/views`.

Configuration/Constants: None.

Main content:
- Uses `req.accepts('html')` to detect UI clients, delivering `views/404.html` via `sendFile`.
- Default case responds with `{ error: 'Not Found', path: req.originalUrl }`.

Edge cases & errors:
- `req.accepts` relies on content negotiation; some API clients might be served HTML if they accept both.

Exports & consumers:
- Last middleware before `errorHandler` in `src/server.js`.

Related files: `docs/line-by-line/src_views_404.html.md`.
