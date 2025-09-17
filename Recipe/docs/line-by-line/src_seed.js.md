File: src/seed.js
Purpose: Provides deterministic seed data for recipes and inventory along with a derived user identifier.

At a glance: Imports enums/constants, builds `ME` user ID, defines two seed arrays, exports them for the store and external consumers.

Imports & dependencies:
- `./enums` – ensures seed values align with allowed enumerations.
- `./lib/constants` – pulls in `APP_ID` and `AUTHOR_NAME` to build IDs.

Configuration/Constants:
- `ME`: constructed as `AUTHOR_NAME` without spaces + `-` + `APP_ID`.
- `INVENTORY_SEED`: Two items pre-populating pantry and fridge entries, using enum `Location` values.
- `RECIPE_SEED`: Two recipes covering different difficulties/meal types.

Main content:
- Exports `{ ME, INVENTORY_SEED, RECIPE_SEED }`.

Edge cases & errors:
- Seed dates expressed as ISO strings; models convert to `Date` objects during instantiation.

Related files: `docs/line-by-line/src_store.js.md`, `docs/line-by-line/index.js.md`.
