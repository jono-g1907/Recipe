File: index.js
Purpose: Provide a single export surface for consumers who want models, enums, constants, and seed data without importing individual files.

At a glance: Exports app identifiers, enum lookups, the two model constructors, the ValidationError class, and bundled seed data. When run directly it logs the seed payloads to stdout.

Imports & dependencies:
- `./src/lib/constants` – supplies the `APP_ID` and `AUTHOR_NAME` string literals shared across the app.
- `./src/enums` – delivers enum objects (`Difficulty`, `MealType`, `Location`). Documented in `docs/line-by-line/src_enums.js.md`.
- `./src/errors/ValidationError` – bubble up the custom error type; see `docs/line-by-line/src_errors_ValidationError.js.md`.
- `./src/models/Recipe` – exposes the recipe domain model (see `docs/line-by-line/src_models_Recipe.js.md`).
- `./src/models/InventoryItem` – exposes the inventory domain model (see `docs/line-by-line/src_models_InventoryItem.js.md`).
- `./src/seed` – provides prebuilt recipe/inventory/user constants used for bootstrapping (`docs/line-by-line/src_seed.js.md`).

Configuration/Constants:
- `APP_ID` and `AUTHOR_NAME` are cached locals mirroring the constants module. No environment configuration occurs here.
- `Difficulty`, `MealType`, `Location` mirror enum exports for convenience.

Main content (annotated walkthrough):
- Module-scope requires pull the reusable pieces listed above into local variables for re-export.
- `module.exports = { … }` gathers identifiers into a structured object. Note the nested `SEEDS` object bundling `ME`, `INVENTORY_SEED`, and `RECIPE_SEED` for downstream tests/demos.
- The `if (require.main === module)` block acts as a CLI helper: when you run `node index.js`, it loads the same export object and prints the recipe and inventory seeds. This is non-invasive for `require()` consumers.

Edge cases & errors:
- No runtime validation here—the file trusts the imported modules. Failures would originate from missing modules or from consumers mutating the exported structures.

Exports & consumers:
- Export shape contains constant strings, enum maps, model constructors, the ValidationError class, and the `SEEDS` bundle. `src/store.js` builds on `seed.js` directly instead of going through this facade, but external scripts/tests can depend on `index.js` for a one-stop import.

Related files: `docs/line-by-line/src_store.js.md` (uses the seed data), `docs/line-by-line/src_server.js.md` (runtime entrypoint).
