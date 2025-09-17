# Architecture Overview

## System Context
- **User** interacts via web browser hitting HTML endpoints for dashboards/forms.
- **API Clients** (including front-end scripts) call JSON endpoints under `/api`.
- **Application Server**: Single Express process (`src/server.js`) handling both HTML and JSON requests.
- **Data Store**: In-memory arrays initialised from `src/seed.js`. No external database.

## Layering

```
Browser / API client
        ¦
        ?
Express Router (UI routes, /api router)
        ¦
        ?
Controllers (route handlers in src/server.js and src/routes/*)
        ¦
        ?
Domain Models (Recipe, InventoryItem)
        ¦
        ?
Store (src/store.js in-memory arrays)
```

### Entry Points
- `src/server.js` boots server, registers middleware, defines HTML routes, mounts routers, and listens on port 8080.
- `src/routes/index.js` aggregates resource routers.
- `index.js` (root) exports constants, enums, models, and seeds for external consumption/testing.

### Domain Layer
- `src/models/Recipe.js` and `src/models/InventoryItem.js` encapsulate validation/business logic on creation & mutation.
- `ValidationError` defines consistent error shape for invalid inputs.
- `src/lib/utils.js` provides sanitisation primitives used across models.

### Data Layer
- `src/store.js` initialises `recipes` and `inventory` arrays using seeds.
- No persistence beyond process lifetime; all mutations operate directly on in-memory arrays.

### Presentation Layer
- `src/views/*.html` templates rendered via EJS, featuring inline scripts for duplication checks & deletion actions.
- CSS served from `src/css` (Bootstrap + custom `style.css`). Note: `style.css` currently unused.

### API Layer
- `src/routes/recipes.js` and `src/routes/inventory.js` expose REST endpoints. They rely on shared store and domain models for validation, returning JSON responses.
- Error handling centralised in `src/middleware/error.js`, ensuring consistent responses and HTML redirects.

## Data Flow Examples
1. **Create Recipe via UI**:
   - User submits form -> `POST /add-recipe-31477046` in `server.js`.
   - Handler sanitises inputs, instantiates `Recipe`, performs duplicate check, updates store, redirects.
   - On validation failure, throws `ValidationError`, caught by `errorHandler`, which redirects HTML clients to `/invalid.html`.

2. **Delete Inventory from Dashboard**:
   - Button triggers `fetch DELETE /api/inventory/<id>-APP_ID`.
   - `src/routes/inventory.js` locates item, removes from store, responds `204`.
   - Front-end reloads page to refresh grouped view.

3. **Adjust Inventory Quantity via API**:
   - Client sends `PATCH /api/inventory/<id>/adjust-APP_ID` with `{ diff }` or `{ set }`.
   - Router ensures only one is supplied, uses model methods to apply change, returns updated item. Validation errors return JSON or redirect to `/invalid.html` if Accept header indicates HTML.

## Cross-Cutting Concerns
- **Validation**: Handled exclusively by models; routes do minimal parsing.
- **Error Handling**: Centralised; consistent JSON/HTML responses.
- **Configuration**: Hard-coded constants (APP_ID, port) shared via `src/lib/constants.js`.

## Known Gaps
- No persistence layer. Consider adding database repository abstraction if state must survive restarts.
- No authentication/authorization; all endpoints open.
- Static asset mount for Bootstrap misconfigured (file vs directory).
- Client-side scripts contain minor bugs (duplicate check `const` usage) and encoding artifacts in templates.

## Future Extensions
1. Introduce repository layer to swap in persistent storage.
2. Extract controllers from `src/server.js` to keep file focused on wiring.
3. Implement service layer for business rules (e.g., compute inventory value once, reuse across API/UI).
4. Provide API versioning (e.g., `/api/v1/`) to support future changes without breaking existing clients.
