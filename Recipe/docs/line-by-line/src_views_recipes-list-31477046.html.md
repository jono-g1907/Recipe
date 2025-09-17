File: src/views/recipes-list-31477046.html
Purpose: Recipe listing UI showing metadata, ingredient breakdown, and delete action per recipe.

At a glance: Displays table of recipes with formatted ingredients/instructions, delete buttons that call API. Accepts locals `recipes` (array) and optional `msg` (flash message).

Imports & dependencies:
- `<link rel="stylesheet" href="/bootstrap.min.css">` with inline CSS for monospace columns.
- Inline `deleteRecipe(id)` uses `fetch` DELETE on `/api/recipes/:id-31477046`.

Configuration/Constants:
- `badge` classes keyed on difficulty determine styling.

Main content (annotated walkthrough):
- Success alert when `msg` set (e.g., after deletion).
- Buttons to add/delete recipes.
- Table header covers ID, title, meal type, cuisine, prep, difficulty badge, servings, chef, created date, ingredients, instructions, actions.
- Template logic loops arrays to build newline-separated ingredient lines and numbered instruction steps.
- Delete button triggers confirmation and API call; page reloads on `204`.

Edge cases & errors:
- Created date displayed as raw `Date` object string (e.g., `Tue Sep...`); consider formatting.

Related files: `docs/line-by-line/src_server.js.md` (populates locals), `docs/line-by-line/src_routes_recipes.js.md` (DELETE endpoint).
