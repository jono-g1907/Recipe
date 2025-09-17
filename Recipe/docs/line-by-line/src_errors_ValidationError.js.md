File: src/errors/ValidationError.js
Purpose: Custom error class signalling validation failures from domain models.

At a glance: Extends `Error`, captures an array of message strings in `errors`.

Imports & dependencies: None (pure JS class).

Configuration/Constants: None.

Main content:
- Constructor accepts `errors` (expected array). Calls `Error.call` with fixed message `Validation failed`, sets `.name`, and stores a normalised array.
- Prototype chain set to inherit from `Error`.

Edge cases & errors:
- If non-array passed, `.errors` becomes empty array, potentially hiding specific problems.

Exports & consumers:
- Thrown by `Recipe` and `InventoryItem` validation routines.
- Recognised by `src/middleware/error.js` to choose HTTP status, and by UI handlers to redirect invalid form submissions.

Related files: `docs/line-by-line/src_middleware_error.js.md`.
