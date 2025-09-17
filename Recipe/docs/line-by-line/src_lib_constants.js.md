File: src/lib/constants.js
Purpose: Hard-coded identifiers shared across UI, seeds, and API paths.

At a glance: Exports `APP_ID` (`31477046`) and `AUTHOR_NAME` (`Jonathan Gan`).

Imports & dependencies: None.

Configuration/Constants:
- `APP_ID` drives URL suffixes (`/add-recipe-31477046`, `/api/...-31477046`), view copy, and grouping.
- `AUTHOR_NAME` seeds display strings and IDs.

Main content:
- Simple literal export. No dynamic lookup or environment override.

Edge cases & errors:
- Changing `APP_ID` requires touching views/routes that embed the number in literal strings. Consider centralising templating to avoid divergence.

Related files: `docs/line-by-line/src_seed.js.md`, `docs/line-by-line/src_routes_recipes.js.md`.
