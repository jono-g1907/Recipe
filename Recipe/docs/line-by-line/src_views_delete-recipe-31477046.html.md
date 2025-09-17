File: src/views/delete-recipe-31477046.html
Purpose: HTML form to remove recipes by ID with inline error feedback from server.

At a glance: Displays optional `error` alert, retains last attempted ID via query parameter, posts to `/delete-recipe-31477046`.

Imports & dependencies:
- `<link rel="stylesheet" href="/bootstrap.min.css">`.
- Expects locals: `error`, `lastId` from `src/server.js` GET handler.

Configuration/Constants:
- Form action fixed to assignment-suffixed path.

Main content:
- Simple form with text input for `recipeId`, helper text, and navigation buttons.
- No client-side script; relies on server validation to display errors/repopulate last ID.

Edge cases:
- If server doesn’t pass `error`, template still renders gracefully.

Related files: `docs/line-by-line/src_server.js.md` (GET + POST logic).
