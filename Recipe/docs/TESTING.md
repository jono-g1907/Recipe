# Testing Strategy

No automated tests are currently defined (see `package.json`: `npm test` intentionally fails). This guide outlines recommended coverage to ensure confidence in the codebase.

## Immediate Actions
1. **Set up Jest** (or Mocha) with `supertest` for HTTP endpoint testing.
2. **Add npm scripts**:
   ```json
   {
     "scripts": {
       "start": "node src/server.js",
       "test": "jest"
     }
   }
   ```
3. **Configure test environment** to import `src/server.js` without starting the listener (export the Express app for testing).

## Suggested Test Suites

### Unit Tests
- **Models** (`Recipe`, `InventoryItem`):
  - Creation success/failure cases for required fields, enum validation, numeric boundaries.
  - `update` method handles partial patches and preserves untouched fields.
  - `adjustQuantity`, `setQuantity`, `isExpiringSoon`, `isLowStock` behaviours for edge inputs.
- **Utils**: Validate sanitisation and cloning of arrays/objects/dates.
- **ValidationError**: Ensure message array normalisation.

### Integration Tests
- **HTML routes**: Use `supertest` to fetch `/`, `/inventory-dashboard-31477046`, verifying status 200 and key markers in HTML.
- **API endpoints**:
  - CRUD lifecycle for recipes and inventory, including duplicate detection, validation error messages, and 404 responses.
  - Adjust quantity endpoint with both `diff` and `set` variants and error cases.
  - Ensure `Accept: text/html` on invalid requests triggers `302 /invalid.html`.

### Snapshot/UI Tests
- Pre-render critical templates with mock locals to ensure required placeholders exist (using Jest snapshot or dedicated view tests).

### Manual Smoke Tests
- While automation is being added, run:
  ```bash
  npm install
  node src/server.js
  ```
  Then verify:
  - Dashboard loads metrics.
  - Add recipe/inventory forms submit successfully.
  - Delete flows redirect with flash messages.
  - `/api/recipes-31477046` returns JSON list.

## Tooling Enhancements
- Add ESLint with recommended rules to catch issues like the `const` reassignment bug in `add-inventory` view.
- Configure Prettier for consistent formatting.

## Test Data Management
- Seeds mutate in-memory store. For repeatable tests, expose helpers to reset store state (e.g., `store.reset()` returning cloned seeds) or re-require module between tests.

## CI Pipeline
- Integrate GitHub Actions (or preferred CI) to run `npm ci && npm test` on each pull request.
- Optional: add coverage thresholds and badge once tests exist.
