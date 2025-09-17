File: src/models/Recipe.js
Purpose: Domain model encapsulating recipe validation, mutation, and serialisation logic.

At a glance: Validates recipe creation/updates, enforces enumerated fields, sanitises nested arrays, exposes `toJSON`, and throws `ValidationError` when invariants fail.

Imports & dependencies:
- `../lib/utils` ? `sanitiseString`, `toFiniteNumber`, `clone` for consistent data handling.
- `../errors/ValidationError` – error type raised on invalid state.
- `../enums` ? `Difficulty`, `MealType` enumerations.

Configuration/Constants:
- `validateIngredient(ing, pathPrefix)` local helper ensures ingredient objects include `ingredientName`, positive `quantity`, and `unit`.
- Allowed values arrays built inline for `mealType`, `difficulty`.

Main content (annotated walkthrough):
1. **`validateIngredient` helper**:
   - Trims and coerces nested ingredient fields.
   - Accumulates error messages keyed by `pathPrefix` (e.g., `ingredients[0].quantity`).
2. **Constructor**: `function Recipe(data)` delegates to `_assignAndValidate(data, false)` for immediate validation.
3. **`Recipe.from(data)`**: Convenience factory `return new Recipe(data)`.
4. **`update(partial)`**: Calls `_assignAndValidate(partial, true)` enabling patch semantics.
5. **`toJSON()`**: Returns deep-cloned snapshot of fields (ingredients/instructions arrays cloned with helper to avoid mutation leakage).
6. **`_assignAndValidate(patch, isPatch)`** (core):
   - Similar pattern to `InventoryItem`: start from previous `toJSON()` snapshot when patching, else empty object.
   - On create, ensures all fields go through sanitisation. On patch, only keys present in `patch` are recalculated.
   - For `ingredients`: expects array; maps each entry to sanitised object via `sanitiseString` and `toFiniteNumber`. Missing/invalid arrays result in `undefined` (later validated).
   - For `instructions`: expects array of strings; sanitised and filtered.
   - Coerces other primitives: `mealType`, `cuisineType`, `prepTime`, `difficulty`, `servings`, `chef`.
   - `createdDate`: on create without explicit date, defaults to `new Date()`. Invalid dates reset to `new Date()`.
   - Validation collects errors:
     * Required: `recipeId`, `title`, `chef`.
     * `ingredients`: must be non-empty array; each ingredient validated via helper (positive quantity, etc.).
     * `instructions`: must be non-empty array of steps.
     * `mealType`: must match one of `MealType` enum values.
     * `prepTime`: positive finite number (minutes).
     * `servings`: positive finite number.
     * `difficulty`: must match `Difficulty` enum values.
   - On validation failure throws `ValidationError(errors)`.
   - Otherwise reassigns validated fields onto instance.

Edge cases & errors:
- Invalid `createdDate` forcibly set to now; perhaps surprising. Documented for future improvements.
- Ingredients array loses additional properties beyond `ingredientName`, `quantity`, `unit` by design.

Exports & consumers:
- Instantiated in `src/routes/recipes.js`, `src/server.js` (form handlers), and `src/store.js` (seed load).

Related files: `docs/line-by-line/src_routes_recipes.js.md`, `docs/line-by-line/src_views_add-recipe-31477046.html.md`.
