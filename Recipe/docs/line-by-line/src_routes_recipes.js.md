File: src/routes/recipes.js
Purpose: REST API for managing recipes (CRUD) backed by the in-memory store.

At a glance: Defines routes for creating, retrieving, listing, updating, and deleting recipes. All paths embed the `APP_ID` suffix required by the assignment specification.

Imports & dependencies:
- `express` – builds router instance.
- `../lib/constants` – supplies `APP_ID` (ensures route suffix matches UI and seeds).
- `../models/Recipe` – validates/serialises recipes.
- `../errors/ValidationError` – bubbled to central error handler.
- `../store` – in-memory arrays `recipes` (shared singleton).

Configuration/Constants:
- `RECIPES_BASE = '/recipes-' + APP_ID` – e.g., `/recipes-31477046`.

Main content (annotated walkthrough):
- `findRecipeById(id)` helper performs linear search over `store.recipes` returning instance or `null`.
- `POST RECIPES_BASE`:
  1. Builds `Recipe` from `req.body`.
  2. Checks for duplicate `recipeId`; throws `ValidationError` if found.
  3. Pushes new recipe to store and responds `201 { recipe: rec.toJSON() }`.
- `GET /recipes/:recipeId-APP_ID`:
  - Extracts prefixless ID from params, returns JSON representation or `404` if missing.
- `PATCH /recipes/:recipeId-APP_ID`:
  - Looks up recipe, returns `404` if absent.
  - Calls `rec.update(req.body)` which may throw `ValidationError` or adjust fields.
  - Responds with updated JSON snapshot.
- `GET RECIPES_BASE`:
  - Returns all recipes as JSON array plus `page: 1` and `total` count (fixed values—no pagination yet).
- `DELETE /recipes/:recipeId-APP_ID`:
  - Removes matching recipe via `splice` and returns `204 No Content`; otherwise `404`.
- Each handler wraps mutating operations in try/catch forwarding errors via `next` where necessary.

Edge cases & errors:
- No pagination or filtering; the `page` field is hard-coded.
- Duplicate checks are O(n); acceptable for small dataset.
- Missing body validation beyond model ensures only known fields are stored.

Security notes:
- No authentication/authorization. JSON body limit uses Express defaults; see `docs/SECURITY.md` for follow-up.

Related files: `docs/line-by-line/src_models_Recipe.js.md`, `docs/line-by-line/src_server.js.md` (form handlers that mirror API logic).
