File: src/views/delete-inventory-31477046.html
Purpose: HTML form to delete inventory items by ID, showing server-provided error states.

At a glance: Similar structure to recipe deletion; expects locals `error` and `lastId`.

Imports & dependencies:
- `<link href="/bootstrap.min.css" rel="stylesheet">`.
- Locals filled by `src/server.js` GET handler.

Configuration/Constants:
- Post target `/delete-inventory-31477046`.

Main content:
- Displays alert when `error` defined.
- Form retains last attempted ID and offers back/reset/delete buttons.

Edge cases:
- Template uses EJS guard `(typeof lastId !== 'undefined' && lastId)` ensuring undefined values render as empty string.

Related files: `docs/line-by-line/src_server.js.md`.
