File: src/views/add-inventory-31477046.html
Purpose: HTML form for adding inventory items with client-side validation and duplicate checks.

At a glance: Collects IDs, quantities, dates, and location; posts to `/add-inventory-31477046`. Inline JavaScript validates numeric fields, date ordering, and checks for duplicate IDs via API call.

Imports & dependencies:
- `<link rel="stylesheet" href="/bootstrap.min.css">` for styling.
- Inline script uses `XMLHttpRequest`, interacts with `/api/inventory-APP_ID` endpoint.
- Relies on server handler `POST /add-inventory-31477046` (`src/server.js`).

Configuration/Constants:
- Script hard-codes `APP_ID = '31477046'`.

Main content (annotated walkthrough):
- Form fields map directly to `InventoryItem` model (`inventoryId`, `userId`, `ingredientName`, `quantity`, `unit`, `category`, `cost`, `purchaseDate`, `expirationDate`, `createdDate`, `location`).
- Submit/Back buttons allow navigation to dashboard.

Script logic:
1. Grabs key inputs (ID, quantity, cost, purchase/expiration dates).
2. `checkDuplicate(cb)` attempts to fetch `/api/inventory-APP_ID` and flag duplicates by calling `setCustomValidity`. Note: `isDup` is declared as `const` but reassigned within loop (`isDup = true`), which would throw in strict mode—highlighted in `docs/FAQ.md` as a bug to fix.
3. `validateNumbers()` ensures quantity > 0, cost = 0, and expiration date not before purchase. Sets custom validity messages on failure.
4. Event listeners keep validity feedback fresh and re-run duplicate check on blur.
5. Form submit prevents default, runs validation + duplicate check, then submits only when `form.checkValidity()` passes.

Edge cases & errors:
- Duplicate check bug: `const isDup = false;` followed by `isDup = true;` will throw `TypeError` in browsers, preventing duplicate detection. Needs correction (use `let`).
- Absence of network error handling for duplicates besides silent fallback.

Security notes:
- Client-side checks complement server-side validations. Still lacks CSRF/auth.

Related files: `docs/line-by-line/src_server.js.md`, `docs/line-by-line/src_models_InventoryItem.js.md`.
