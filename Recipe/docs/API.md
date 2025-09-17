# API Reference

This document covers every HTTP interface exposed by the Recipe app. HTML routes live at the root; JSON APIs are mounted under `/api`. Middleware stack and error handling are described in `docs/MIDDLEWARE.md`.

## Global Middleware

| Order | Middleware | Purpose |
| --- | --- | --- |
| 1 | `express.json()` | Parses JSON bodies for API clients. |
| 2 | `express.urlencoded({ extended: true })` | Parses form submissions (UI posts) and supports querystring-style encodings. |
| 3 | `express.static('../node_modules/bootstrap/dist/css/bootstrap.min.css')` at `/bootstrap` | Intended to provide Bootstrap CSS. Note: path targets a file; see `docs/CONFIG.md`. |
| 4 | `express.static('images')` | Serves static assets; directory currently absent. |
| 5 | `express.static('css')` | Serves `/bootstrap.min.css` and `/style.css`. |
| 6 | EJS view routes | Render HTML pages listed below. |
| 7 | `express.static('views', { index: false })` | Allows direct access to plain HTML files (e.g., `/invalid.html`). |
| 8 | `/api` router | Hosts JSON endpoints. |
| 9 | `notFound` | Returns HTML/JSON 404s. |
| 10 | `errorHandler` | Normalises validation failures and unexpected errors. |

### Status Code Reference

| Status | Meaning | Emitted by |
| --- | --- | --- |
| 200 | Success (GET/PATCH) | JSON list/detail responses, rendered HTML |
| 201 | Created | POST `/api/recipes-APP_ID`, POST `/api/inventory-APP_ID` |
| 204 | No content | DELETE endpoints (success) |
| 302 | Redirect | UI forms redirect on success or validation failure (HTML clients) |
| 400 | Bad request | Validation errors mentioning "required", invalid JSON |
| 404 | Not found | Missing recipe/inventory IDs, unmatched routes |
| 422 | Unprocessable entity | Validation errors for numeric/enumeration issues |
| 500 | Server error | Uncaught exceptions (JSON: `{ error: 'Server error' }`) |

### Authentication & Authorization

No authentication is implemented. All endpoints are publicly accessible.

---

## HTML Routes

| Method | Path | Description | Query/body | Success |
| --- | --- | --- | --- | --- |
| GET | `/` | Dashboard metrics and quick links | None | `200` HTML (`views/index.html`) |
| GET | `/add-recipe-31477046` | Recipe creation form | None | `200` HTML |
| GET | `/add-inventory-31477046` | Inventory creation form | None | `200` HTML |
| GET | `/recipes-list-31477046` | Recipe table | Optional `deleted` message | `200` HTML |
| GET | `/delete-recipe-31477046` | Recipe delete form | Optional `error`, `lastId` | `200` HTML |
| GET | `/delete-inventory-31477046` | Inventory delete form | Optional `error`, `lastId` | `200` HTML |
| POST | `/delete-inventory-31477046` | Deletes by ID | Form `inventoryId` | `302` redirect (`/inventory-dashboard-...` on success, form reload on error) |
| GET | `/inventory-dashboard-31477046` | Grouped inventory view | Optional `group`, `deleted` | `200` HTML |
| POST | `/delete-recipe-31477046` | Deletes by ID | Form `recipeId` | `302` redirect to `/recipes-list-...` |
| POST | `/add-recipe-31477046` | Creates recipe | Form fields listed in `docs/VIEWS.md` | `302` redirect to `/recipes-list-...`; validation errors bubble to `/invalid.html` |
| POST | `/add-inventory-31477046` | Creates inventory item | Form fields in `docs/VIEWS.md` | `302` redirect to `/inventory-dashboard-...`; validation errors bubble to `/invalid.html` |

---

## JSON API Routes (`/api`)

### Endpoint Matrix

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/recipes-31477046` | Create recipe |
| GET | `/api/recipes-31477046` | List recipes |
| GET | `/api/recipes/:recipeId-31477046` | Retrieve recipe by ID |
| PATCH | `/api/recipes/:recipeId-31477046` | Partial update recipe |
| DELETE | `/api/recipes/:recipeId-31477046` | Delete recipe |
| POST | `/api/inventory-31477046` | Create inventory item |
| GET | `/api/inventory-31477046` | List inventory |
| PATCH | `/api/inventory/:inventoryId/adjust-31477046` | Adjust or set inventory quantity |
| DELETE | `/api/inventory/:inventoryId-31477046` | Delete inventory item |

### Recipes Resource

#### POST `/api/recipes-31477046`
- **Body**: JSON matching Recipe schema. See `docs/MODELS-and-SCHEMAS.md` for field breakdown.
- **Success**: `201 { "recipe": Recipe }`.
- **Errors**: `400` missing requireds, `422` invalid enums/numbers, `400` duplicates.
- **curl**:
  ```bash
  curl -X POST http://localhost:8080/api/recipes-31477046 \
       -H "Content-Type: application/json" \
       -d '{
         "recipeId": "R-31477046-010",
         "title": "Miso Soup",
         "ingredients": [
           { "ingredientName": "Dashi", "quantity": 500, "unit": "ml" },
           { "ingredientName": "Miso paste", "quantity": 50, "unit": "g" }
         ],
         "instructions": ["Warm dashi", "Whisk in miso off heat"],
         "mealType": "Dinner",
         "cuisineType": "Japanese",
         "prepTime": 15,
         "difficulty": "Easy",
         "servings": 2,
         "chef": "JonathanGan-31477046",
         "createdDate": "2025-09-15"
       }'
  ```
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/recipes-31477046', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  ```

#### GET `/api/recipes-31477046`
- **Response**: `200 { recipes: Recipe[], page: 1, total }`.
- **curl**: `curl http://localhost:8080/api/recipes-31477046`
- **fetch**:
  ```js
  const res = await fetch('http://localhost:8080/api/recipes-31477046');
  const data = await res.json();
  ```

#### GET `/api/recipes/:recipeId-31477046`
- **Params**: `recipeId` (without suffix). Example path: `/api/recipes/R-31477046-001-31477046`.
- **Success**: `200 { recipe: Recipe }`.
- **Error**: `404 { error: 'Recipe not found' }`.
- **curl**: `curl http://localhost:8080/api/recipes/R-31477046-001-31477046`
- **fetch**:
  ```js
  const res = await fetch('http://localhost:8080/api/recipes/R-31477046-001-31477046');
  if (res.status === 404) throw new Error('Missing');
  ```

#### PATCH `/api/recipes/:recipeId-31477046`
- **Body**: Partial recipe fields, e.g. `{ "prepTime": 20 }`.
- **Success**: `200 { recipe: Recipe }`.
- **Errors**: `404` missing recipe, `400/422` invalid payload.
- **curl**:
  ```bash
  curl -X PATCH http://localhost:8080/api/recipes/R-31477046-001-31477046 \
       -H "Content-Type: application/json" \
       -d '{ "prepTime": 20 }'
  ```
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/recipes/R-31477046-001-31477046', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prepTime: 20 })
  });
  ```

#### DELETE `/api/recipes/:recipeId-31477046`
- **Success**: `204`.
- **Error**: `404 { error: 'Recipe not found' }`.
- **curl**: `curl -X DELETE http://localhost:8080/api/recipes/R-31477046-001-31477046`
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/recipes/R-31477046-001-31477046', { method: 'DELETE' });
  ```

### Inventory Resource

#### GET `/api/inventory-31477046`
- **Response**: `200 { items: InventoryItem[], page: 1, total }`.
- **curl**: `curl http://localhost:8080/api/inventory-31477046`
- **fetch**:
  ```js
  const res = await fetch('http://localhost:8080/api/inventory-31477046');
  ```

#### POST `/api/inventory-31477046`
- **Body**: Inventory schema (see `docs/MODELS-and-SCHEMAS.md`).
- **Success**: `201 { item: InventoryItem }`.
- **Errors**: `400/422` validation, duplicate IDs.
- **curl**:
  ```bash
  curl -X POST http://localhost:8080/api/inventory-31477046 \
       -H "Content-Type: application/json" \
       -d '{
         "inventoryId": "I-31477046-010",
         "userId": "JonathanGan-31477046",
         "ingredientName": "Gochujang",
         "quantity": 1,
         "unit": "jar",
         "category": "Condiments",
         "purchaseDate": "2025-09-10",
         "expirationDate": "2026-03-01",
         "location": "Pantry",
         "cost": 6.5,
         "createdDate": "2025-09-10"
       }'
  ```
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/inventory-31477046', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  ```

#### PATCH `/api/inventory/:inventoryId/adjust-31477046`
- **Body**: Either `{ "diff": number }` or `{ "set": number }` (mutually exclusive).
- **Success**: `200 { item: InventoryItem }`.
- **Errors**: `404` missing item, `400/422` invalid payload (both diff & set, NaN, negative results). HTML clients get `302 /invalid.html`.
- **curl**:
  ```bash
  curl -X PATCH http://localhost:8080/api/inventory/I-31477046-001/adjust-31477046 \
       -H "Content-Type: application/json" \
       -d '{ "diff": -0.5 }'
  ```
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/inventory/I-31477046-001/adjust-31477046', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ set: 2 })
  });
  ```

#### DELETE `/api/inventory/:inventoryId-31477046`
- **Success**: `204`.
- **Errors**: `404 { error: 'Inventory item not found' }`.
- **curl**: `curl -X DELETE http://localhost:8080/api/inventory/I-31477046-001-31477046`
- **fetch**:
  ```js
  await fetch('http://localhost:8080/api/inventory/I-31477046-001-31477046', { method: 'DELETE' });
  ```

### Error Envelope

Validation errors return the shape:
```json
{
  "error": "Validation failed",
  "details": ["message", ...]
}
```
Uncaught server errors under `/api` respond with `500 { "error": "Server error" }`.

---

## Static Assets

- `/bootstrap.min.css` served from `src/css/bootstrap.min.css` (local copy).
- `/style.css` (custom styles, currently unused).
- `/invalid.html`, `/404.html` accessible via static middleware.

## Follow-ups

- Correct the Bootstrap static mount to a directory.
- Introduce authentication and rate limiting if deploying publicly.
