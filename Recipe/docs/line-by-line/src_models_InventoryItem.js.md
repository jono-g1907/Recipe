File: src/models/InventoryItem.js
Purpose: Domain model encapsulating inventory business rules, validation, and helper methods.

At a glance: Constructor validates incoming data, serialises via `toJSON`, supports partial updates (`update`), quantity adjustments (`adjustQuantity`, `setQuantity`), status checks (`isExpiringSoon`, `isLowStock`), and central `_assignAndValidate` that enforces field requirements.

Imports & dependencies:
- `../lib/utils` ? `sanitiseString`, `toFiniteNumber`, `clone` for data normalisation.
- `../errors/ValidationError` – thrown when validation fails.
- `../enums` ? `Location` enum validating location values.

Configuration/Constants:
- `allowed` locations derived each call (`[Location.PANTRY, Location.FRIDGE, Location.FREEZER]`).

Main content (annotated walkthrough):
1. **Constructor**: `function InventoryItem(data)` immediately delegates to `_assignAndValidate(data, false)` ensuring new instances are validated on creation.
2. **`toJSON()`**: Returns a cloned plain object with all persisted fields. Uses `clone` to avoid exposing internal references.
3. **`update(partial)`**: Calls `_assignAndValidate(partial, true)` enabling partial field updates while re-running validation.
4. **`adjustQuantity(diff)`**:
   - Coerces `diff` to finite number; throws `ValidationError` if invalid.
   - Adds `diff` to current `this.quantity`, ensuring result is non-negative.
   - Returns new quantity.
5. **`setQuantity(quantity)`**:
   - Coerces target value; enforces non-negative finite.
   - Sets `this.quantity`, returns new value.
6. **`isExpiringSoon(x)`**:
   - Coerces `x` to finite. Non-finite or negative returns `false`.
   - Computes a future timestamp `now + x days` and compares to `this.expirationDate` (assumes Date instance).
7. **`isLowStock(threshold)`**:
   - Coerces threshold, returns `false` for non-finite/negative.
   - Checks `this.quantity < threshold`.
8. **`_assignAndValidate(patch, isPatch)`** (core logic):
   - Builds `prev` snapshot via `toJSON()` if instance already initialised.
   - Copies previous state, then conditionally updates fields based on `isPatch` (patch only touches provided keys).
   - Sanitises strings, coerces numbers, sets defaults for optional `category`.
   - Date handling: For `purchaseDate`, `expirationDate`, `createdDate`, builds new `Date` objects, defaulting to now when invalid or missing (on create). Ensures result is `Date` instances.
   - Location sanitised string, cost coerced to finite number.
   - Validation collects errors:
     * Required: `inventoryId`, `userId`, `ingredientName`, `unit`.
     * `quantity` must be finite = 0.
     * Location must be one of enum values (when defined).
     * `cost` must be finite = 0.
     * `expirationDate` cannot precede `purchaseDate`.
   - Throws `ValidationError(errors)` if any issues.
   - On success, assigns validated fields back onto `this`.

Edge cases & errors:
- Dates default to `new Date()` when invalid, which may surprise consumers expecting null; document in `docs/MODELS-and-SCHEMAS.md`.
- Location validation assumes enums constant; mutated enums would break check.

Security notes:
- Input sanitisation removes extraneous whitespace, reducing injection risk albeit basic.

Exports & consumers:
- Used by `src/routes/inventory.js`, `src/store.js`, and UI POST handlers in `src/server.js`.

Related files: `docs/line-by-line/src_routes_inventory.js.md`, `docs/line-by-line/src_views_inventory-dashboard-31477046.html.md`.
