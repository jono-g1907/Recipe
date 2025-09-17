File: src/views/invalid.html
Purpose: Generic error page shown when a request fails validation or other non-API errors occur.

At a glance: Displays friendly message and link back home.

Imports & dependencies: Inline CSS only; no scripts.

Configuration/Constants:
- Static message includes garbled apostrophe ("wasn??Tt") likely due to encoding.

Main content:
- Minimal markup using system font and centered layout.

Edge cases & errors:
- Encoding issue should be corrected to read "wasn’t".

Related files: `docs/line-by-line/src_middleware_error.js.md` (serves this page), `docs/line-by-line/src_routes_inventory.js.md` (redirects here for HTML clients).
