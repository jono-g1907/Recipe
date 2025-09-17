File: src/lib/utils.js
Purpose: Shared helper functions for sanitising strings, coercing numbers, and cloning values used by models.

At a glance: Exports `sanitiseString`, `toFiniteNumber`, and `clone`.

Imports & dependencies: None.

Configuration/Constants: None.

Main content (annotated walkthrough):
- `sanitiseString(value)` -> string: Trims input when it is a string, otherwise returns empty string. Used to normalise incoming text fields before validation/storage.
- `toFiniteNumber(value)` -> number: Casts to `Number` and returns `NaN` when non-finite. Models use this to detect invalid numeric input.
- `clone(value)` -> deep clone of arrays/objects/dates: Recursively duplicates arrays/objects/dates while leaving primitives untouched. Protects against accidental mutation when returning model data (`toJSON`) or staging updates during validation.

Edge cases & errors:
- `clone` does not handle circular references, Maps/Sets, or class instances—adequate for current plain-data use cases.

Exports & consumers:
- `Recipe` and `InventoryItem` models rely heavily on these helpers.

Related files: `docs/line-by-line/src_models_Recipe.js.md`, `docs/line-by-line/src_models_InventoryItem.js.md`.
