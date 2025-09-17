File: src/views/index.html
Purpose: Landing dashboard summarising recipes and inventory stats for the student user.

At a glance: Renders hero stats, quick actions, and personalised welcome message. Requires EJS locals: `username`, `id`, `totalRecipes`, `totalInventory`, `cuisineCount`, `inventoryValue`.

Imports & dependencies:
- `<link rel="stylesheet" href="/bootstrap.min.css">` – served via Express static mount (`src/server.js`).

Configuration/Constants:
- Uses hard-coded navbar links referencing assignment-specific routes (e.g., `/inventory-dashboard-31477046`).

Main content (annotated walkthrough):
- Top navbar includes brand links to Home/Inventory plus welcome text using `username`/`id`.
- Statistics cards display totals for recipes, inventory, cuisine types, and inventory value (formatted with `.toFixed(2)` in template—requires numeric `inventoryValue`).
- Quick actions list relevant pages.
- Footer reiterates assignment details and identity.

Edge cases & errors:
- `inventoryValue.toFixed(2)` assumes `inventoryValue` is numeric; `server.js` ensures this.
- No client-side scripts; purely presentational.

Related files: `docs/line-by-line/src_server.js.md` (supplies locals).
