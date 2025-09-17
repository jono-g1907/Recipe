File: src/store.js
Purpose: Simple in-memory data store initialised from seeds to mimic persistence.

At a glance: Imports recipes/inventory seeds, instantiates model objects for each entry, exports `{ recipes, inventory }` arrays shared across the app.

Imports & dependencies:
- `./models/Recipe` – used to instantiate seeded recipes with validation.
- `./models/InventoryItem` – same for inventory.
- `./seed` – source data arrays (`RECIPE_SEED`, `INVENTORY_SEED`).

Configuration/Constants:
- Two arrays `recipes` and `inventory` defined once at module scope.

Main content:
- Iterates over `seed.RECIPE_SEED`, pushes validated `Recipe` instances into `recipes`. Catches and logs bad seeds.
- Repeats for `seed.INVENTORY_SEED` with `InventoryItem`.
- Exports `{ recipes, inventory }` object so consumers share references (mutations persist for process lifetime).

Edge cases & errors:
- Logging uses `console.error`; invalid seeds do not halt startup but result in missing entries.
- No persistence beyond memory—restarts reset data to seeds.

Related files: `docs/line-by-line/src_seed.js.md`, `docs/line-by-line/src_server.js.md`.
