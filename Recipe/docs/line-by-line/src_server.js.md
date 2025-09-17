File: src/server.js
Purpose: Main Express server configuring middleware, rendering HTML dashboards/forms, and wiring REST API routers.

At a glance: Creates the Express app, sets up body parsers, static assets, view engine, and ten UI routes for dashboard, CRUD forms, and listings. Mounts `/api` routers, plus 404 and error handlers.

Imports & dependencies:
- `path` (Node core) – resolves absolute paths when serving static assets and templates.
- `express` – HTTP framework powering the server.
- `./middleware/notFound` – generic 404 responder (see `docs/line-by-line/src_middleware_notFound.js.md`).
- `./middleware/error` – centralized error handler (see `docs/line-by-line/src_middleware_error.js.md`).
- `./routes` – exported Express Router bundling API endpoints (see `docs/line-by-line/src_routes_index.js.md`).
- Several route handlers lazily `require('./store')`, `./models/*`, and `./errors/ValidationError` so they execute with fresh data snapshots.

Configuration/Constants:
- Hard codes `app.set('port', 8080)`; no environment override.
- View engine set to EJS rendering `.html` files inside `src/views`.
- Static assets served from `src/images` (directory absent—documented as Unknown), `src/css`, and `node_modules/bootstrap/dist/css/bootstrap.min.css` mounted under `/bootstrap` (note: points to a file path; Express expects a directory, so this should be revisited).

Main content (annotated walkthrough):
1. **App initialisation**: Build Express instance, set fixed port, register JSON and URL-encoded parsers for API and form submissions.
2. **Static assets**:
   - `app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css')));` attempts to expose the packaged Bootstrap CSS. Because `express.static` expects a directory, serving a single file this way likely falls back to 404. The `/src/css/bootstrap.min.css` static mount (below) actually satisfies `<link href="/bootstrap.min.css">` in templates.
   - `app.use(express.static(path.join(__dirname, 'images')));` – intended to serve user-uploaded images; directory currently missing (flagged Unknown in `docs/COVERAGE_REPORT.md`).
   - `app.use(express.static(path.join(__dirname, 'css')));` – serves `bootstrap.min.css` (vendor copy) and `style.css` at the web root.
3. **View engine**: Configures EJS to render `.html` templates from `src/views`. This allows using `<%= ... %>` inside `.html` files.
4. **Dashboard route (`GET /`)**:
   - Loads `store` to access current `recipes`/`inventory` arrays.
   - Derives counts, unique cuisine count, and total inventory value (number-sum ignoring NaN).
   - Renders `index.html` with user metadata and computed stats. Variables consumed by the template are documented in `docs/line-by-line/src_views_index.html.md`.
5. **Form/view routes**: `GET` endpoints render static templates:
   - `/add-recipe-31477046`
   - `/add-inventory-31477046`
   - `/recipes-list-31477046` (also builds `recipes` array via `toJSON`, sets optional flash `msg`).
   - `/delete-recipe-31477046` and `/delete-inventory-31477046` populate error states from query string.
   - `/inventory-dashboard-31477046` assembles grouped inventory data, calculates days-to-expiry, total cost, and groups by location/category based on query param. Outputs props used by the dashboard template.
6. **Delete handlers**:
   - `POST /delete-inventory-31477046` and `POST /delete-recipe-31477046` validate submitted IDs, search arrays, handle not-found cases by re-rendering forms with errors, and on success remove items then redirect to the relevant list with `deleted` query string for messaging.
7. **Create handlers**:
   - `POST /add-recipe-31477046` sanitises fields, parses multi-line ingredients/instructions, instantiates `Recipe`, checks for duplicate `recipeId`, pushes to store, and redirects to the recipe list. Errors propagate to `next` so middleware handles them (ValidationError -> redirect/JSON based on request).
   - `POST /add-inventory-31477046` mirrors the above for `InventoryItem`, parsing numeric fields, performing duplicate check, and redirecting to `/inventory-dashboard-31477046` on success.
8. **Static fallback**: `app.use(express.static(path.join(__dirname, 'views'), { index: false }));` allows direct access to plain HTML like `/invalid.html` while preventing directory index auto responses.
9. **API mount**: `app.use('/api', apiRouter);` attaches JSON API routes defined in `src/routes`.
10. **Error flow**: `notFound` handles unmatched requests; `errorHandler` processes thrown errors from routes (including `ValidationError`). Order is important: notFound before error handler, since error handler expects to be last.
11. **Server start**: `app.listen` logs the base URLs.

Edge cases & errors:
- Many handlers use `require('./store')` inline so `store` is re-evaluated lazily; since `store` exports cached arrays, it behaves like a singleton.
- Duplicate ID checks rely on linear scans; safe for small datasets.
- Missing `images` directory triggers static middleware logging but otherwise harmless.
- Validation errors thrown by models propagate to `errorHandler`, which may redirect HTML clients to `/invalid.html`.

Security notes:
- Body parsing is unrestricted; consider adding payload size limits and CSRF protections for production.
- Form routes trust sessionless POSTs; no auth present (documented in `docs/SECURITY.md`).

Related files: `docs/line-by-line/src_routes_inventory.js.md`, `docs/line-by-line/src_routes_recipes.js.md` (API counterpart), `docs/line-by-line/src_views_*` (templates receiving the locals described).
