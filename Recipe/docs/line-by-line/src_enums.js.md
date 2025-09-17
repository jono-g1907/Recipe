File: src/enums.js
Purpose: Central definitions for string enums reused by models, routes, and views.

At a glance: Exports three plain objects: `Difficulty`, `MealType`, and `Location`.

Imports & dependencies: None.

Configuration/Constants:
- `Difficulty`: `Easy`, `Medium`, `Hard` – referenced in recipe validation and UI badges.
- `MealType`: `Breakfast`, `Lunch`, `Dinner`, `Snack` – used by `Recipe` model validation and select inputs.
- `Location`: `Pantry`, `Fridge`, `Freezer` – used by `InventoryItem` validation and forms.

Main content:
- Declares and exports simple objects; relies on consumers to treat them as read-only. No guarding against mutation.

Edge cases & errors:
- If consumers mutate these objects, validations relying on equality checks may misbehave. Consider freezing.

Exports & consumers:
- Imported by `src/models/Recipe.js`, `src/models/InventoryItem.js`, `src/routes/recipes.js`, `src/routes/inventory.js`, `src/seed.js`, and `index.js`.

Related files: `docs/line-by-line/src_models_Recipe.js.md`, `docs/line-by-line/src_models_InventoryItem.js.md`.
