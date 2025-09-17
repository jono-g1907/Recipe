File: src/routes/inventory.js
Purpose: REST API for inventory items, including quantity adjustment with HTML-aware error handling.

At a glance: Provides list, create, adjust, and delete operations for inventory records. Detects HTML clients to redirect them when validation fails.

Imports & dependencies:
- `express` – router factory.
- `../lib/constants` – `APP_ID` for path suffixes.
- `../models/InventoryItem` – validation/serialisation.
- `../errors/ValidationError` – propagated when business rules fail.
- `../store` – shared arrays (`inventory`).

Configuration/Constants:
- Utility `clientWantsHtml(req)` sniffing `Accept` header.
- `INVENTORY_BASE = '/inventory-' + APP_ID`.

Main content (annotated walkthrough):
- `findInventoryById(id)` helper linearly searches `store.inventory`.
- `GET INVENTORY_BASE`: Serialises all inventory items and returns `{ items, page: 1, total }`.
- `POST INVENTORY_BASE`: Constructs `InventoryItem` from `req.body`, checks for duplicate `inventoryId`, pushes to store, returns `201 { item }`.
- `PATCH /inventory/:inventoryId/adjust-APP_ID`:
  1. Finds item; returns `404` JSON if missing.
  2. Reads `diff` and `set` from body.
  3. Validates exclusivity (cannot send both) and presence of at least one param.
  4. If `diff` provided, calls `item.adjustQuantity(diff)`.
  5. If `set` provided, coerces to number, ensures finite, calculates difference and adjusts via `adjustQuantity` to reuse validation.
  6. Returns updated item JSON.
  7. In `catch`, if client Accepts HTML, redirects to `/invalid.html` (mirrors UI form expectations); otherwise forwards error to error middleware.
- `DELETE /inventory/:inventoryId-APP_ID`: Removes matching item and returns `204`, else `404`.

Edge cases & errors:
- HTML detection is substring-based; API clients sending `text/html` may get redirected unexpectedly.
- Quantity adjustment uses numeric conversions that may treat string numbers as valid (desired). Negative adjustments allowed as long as quantity stays non-negative.

Related files: `docs/line-by-line/src_models_InventoryItem.js.md`, `docs/line-by-line/src_views_inventory-dashboard-31477046.html.md`.
