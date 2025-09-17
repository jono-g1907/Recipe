# Glossary

| Term | Definition |
| --- | --- |
| **APP_ID** | Unique identifier (`31477046`) appended to route paths and resource IDs to meet assignment specifications. Defined in `src/lib/constants.js`. |
| **AUTHOR_NAME** | `Jonathan Gan`; used for greetings and deriving `ME` seed value. |
| **ME** | Derived user identifier (`AUTHOR_NAME` without spaces + `-` + `APP_ID`). Used as `chef` and `userId` in seeds. |
| **Recipe** | Domain model representing a cooking recipe with ingredients, instructions, and metadata. Implemented in `src/models/Recipe.js`. |
| **InventoryItem** | Domain model for pantry items including quantity, location, and expiry metadata. Implemented in `src/models/InventoryItem.js`. |
| **ValidationError** | Custom error thrown by models when data fails validation. Triggers 400/422 responses or redirects for HTML clients. |
| **Store** | In-memory singleton (`src/store.js`) holding arrays of `Recipe` and `InventoryItem` instances. |
| **Dashboard** | Landing page (`GET /`) summarising totals and quick links. |
| **Expiry Status** | Derived field (`ok`, `soon`, `expired`, `unknown`) computed in `inventory-dashboard` route for display badges. |
| **Diff vs Set** | Options for adjusting inventory quantity via `/api/inventory/:id/adjust-APP_ID`: `diff` adds/subtracts from current value; `set` replaces it. |
| **Seeds** | Pre-loaded data defined in `src/seed.js` to bootstrap the store at startup. |
| **Invalid page** | User-facing error page at `/invalid.html` shown when validation fails for HTML clients. |
| **Static mounts** | Express static middleware exposures (e.g., `/bootstrap`, `/css`, `/views`). |
