File: src/views/inventory-dashboard-31477046.html
Purpose: Inventory listing UI with grouping, expiry badges, and delete buttons.

At a glance: Shows grouped tables of inventory items aggregated by location or category. Accepts locals `groupBy`, `groups`, `totalValue`, `appId`, `msg`, `itemCount` (itemCount currently unused). Provides client-side delete button calling API.

Imports & dependencies:
- `<link rel="stylesheet" href="/bootstrap.min.css">` plus inline styles for badges.
- Relies on `fetch` API for delete actions hitting `/api/inventory/:id-APP_ID`.
- Form query uses `group` parameter to switch grouping.

Configuration/Constants:
- Template expects `groups` object shaped `{ key: { items: [...], value: number } }` as prepared in `src/server.js`.
- Inline script needs `appId` to build API URL suffix.

Main content (annotated walkthrough):
- Navbar with buttons linking to Home/Add/Delete pages.
- `group` selection form submits GET to same page, preserving Acceptable values `location`/`category`.
- Optional success alert displays `msg` (set when deletion occurs).
- Info alert shows total value (rounded to 2 decimals).
- Loops through `groups` to render a table per group:
  - Table columns include ID, user, ingredient, quantity, unit, category, purchase/expiry dates, `daysLeft`, `expiryStatus` badge, location, cost, created date, actions.
  - Converts `expiryStatus` to badge class/text.
  - Delete button triggers `deleteInventory(id)`.
- Script `deleteInventory(id)` confirms with user, sends `DELETE` request, and reloads page on success; otherwise alerts.

Edge cases & errors:
- Inline text contains stray "??" characters (likely encoding issue) near table header; should be cleaned.
- `itemCount` local used only in `itemCount: rows.length` server side but not rendered.
- Delete API call assumes server responds quickly; no spinner or disabled state.

Related files: `docs/line-by-line/src_server.js.md` (data prep), `docs/line-by-line/src_routes_inventory.js.md` (DELETE endpoint).
