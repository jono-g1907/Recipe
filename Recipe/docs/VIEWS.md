# Views

All templates live in `src/views` and are rendered via EJS (HTML files with `<%= %>` placeholders). Static assets served from `/bootstrap.min.css` and optional `/style.css`.

## Common Patterns
- Templates expect the Express server to provide locals documented below.
- Forms post back to Express routes; successful submissions redirect, while validation errors either re-render forms with context or bubble to `/invalid.html` (see `docs/MIDDLEWARE.md`).
- Delete buttons on listing pages call REST APIs using `fetch` and reload on success.

## Template Reference

### `index.html`
- **Route**: `GET /`
- **Locals**: `username`, `id`, `totalRecipes`, `totalInventory`, `cuisineCount`, `inventoryValue` (number).
- **Features**: Navbar, hero section, four metric cards, quick-action lists, footer with student details. Inventory value uses `.toFixed(2)`.
- **Dependencies**: `/bootstrap.min.css`.

### `add-recipe-31477046.html`
- **Route**: `GET /add-recipe-31477046`, posts to same path.
- **Locals**: None.
- **Form Fields**: `title`, `recipeId`, `chef`, `mealType`, `cuisineType`, `difficulty`, `prepTime`, `servings`, `createdDate`, `ingredientsText`, `instructionsText` (mapping described in `docs/MODELS-and-SCHEMAS.md`).
- **Script**:
  - Validates ingredient text formatting (`name | quantity | unit`, positive quantity).
  - Fetches `/api/recipes-31477046` to alert on duplicate `recipeId`.
  - Calls `form.submit()` only when `form.checkValidity()` passes.
- **Notes**: Hard-coded `APP_ID` must match constants.

### `add-inventory-31477046.html`
- **Route**: `GET /add-inventory-31477046`, posts to same path.
- **Locals**: None.
- **Form Fields**: `inventoryId`, `userId`, `ingredientName`, `quantity`, `unit`, `category`, `cost`, `purchaseDate`, `expirationDate`, `createdDate`, `location`.
- **Script**:
  - Validates quantity > 0, cost = 0, expiration = purchase.
  - Tries to detect duplicate IDs via `/api/inventory-31477046` (bug: `const isDup` reassigned; fix documented in `docs/FAQ.md`).
  - Prevents submission until `form.checkValidity()` true.

### `recipes-list-31477046.html`
- **Route**: `GET /recipes-list-31477046`.
- **Locals**: `recipes` (array of JSON objects), optional `msg` shown as success alert.
- **Features**: Table listing with difficulty badge, newline-separated ingredient/step lists, delete button per row.
- **Script**: `deleteRecipe(id)` calls `DELETE /api/recipes/:id-31477046`, reloads on `204`, alerts on failure.

### `inventory-dashboard-31477046.html`
- **Route**: `GET /inventory-dashboard-31477046`.
- **Locals**: `groupBy`, `groups` (object keyed by group value), `totalValue`, `msg`, `appId`, `itemCount` (unused), `groups` entry format `{ items: [], value: number }`.
- **Features**: Grouping toggled via `<select name="group">`, summary of total value, table per group with expiry badges derived from `expiryStatus`.
- **Script**: `deleteInventory(id)` calls `DELETE /api/inventory/:id-APP_ID`, reloads on success.
- **Notes**: Contains stray encoding artifacts (`??` characters) to clean in future pass.

### `delete-recipe-31477046.html`
- **Route**: `GET /delete-recipe-31477046` and `POST` of same path.
- **Locals**: `error` (string), `lastId`.
- **Features**: Renders error alert when provided; retains last submitted ID in input value.

### `delete-inventory-31477046.html`
- **Route**: `GET /delete-inventory-31477046` and `POST` of same path.
- **Locals**: `error`, `lastId`.
- **Features**: Same behaviour as recipe deletion form.

### `invalid.html`
- **Usage**: Served directly (`/invalid.html`) or via error handler redirects.
- **Locals**: None.
- **Notes**: Contains garbled apostrophe string `wasn??Tt`; adjust to `wasn't`.

### `404.html`
- **Usage**: 404 fallback for HTML clients.
- **Locals**: None.

## Static Assets
- `src/css/bootstrap.min.css`: Local Bootstrap build included for offline use; served at `/bootstrap.min.css` via `express.static('css')`.
- `src/css/style.css`: Custom styles; currently not linked by templates (see `docs/CONFIG.md`).

## Client-Side Event Flow Summary
- Form submissions rely on HTML5 validation (`setCustomValidity`, `checkValidity`).
- Duplicate checks issue GET requests to API endpoints—these operate asynchronously and may need debouncing if dataset grows.
- Delete buttons use Fetch API followed by `location.reload()`; errors displayed via `alert()`.

## Suggested Enhancements
1. Extract shared validation helpers to separate JS file to avoid duplication between forms.
2. Use Fetch API with `async/await` for readability and centralise error messaging.
3. Link `style.css` (or remove if not needed) to avoid unused asset.
