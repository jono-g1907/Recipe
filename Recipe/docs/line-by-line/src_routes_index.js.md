File: src/routes/index.js
Purpose: Aggregates modular routers into a single `/api` mount point.

At a glance: Wraps Express router, attaches recipes and inventory routers without additional prefixes.

Imports & dependencies:
- `express` – to create a new router instance.
- `./recipes` – resource-specific router (see `docs/line-by-line/src_routes_recipes.js.md`).
- `./inventory` – resource-specific router (see `docs/line-by-line/src_routes_inventory.js.md`).

Configuration/Constants: None.

Main content:
- Instantiates router, uses `router.use` to attach child routers. Because the child routers define absolute paths (e.g., `/recipes-31477046`), no base path is passed.
- Exports router for consumption in `src/server.js` under `/api`.

Edge cases & errors:
- Order matters if future routers share overlapping paths; currently disjoint.

Related files: `docs/line-by-line/src_server.js.md`.
