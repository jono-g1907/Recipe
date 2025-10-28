# Recipe Hub API – Routing Table

## Information
- **App name:** Recipe Hub – Personal Meal Planning Assistant
- **Base URL:** `http://localhost:8080/api` (all endpoints below are relative to this)
- **Domain focus:** recipe management, ingredient inventory tracking, dashboard statistics, and AI-assisted nutrition analysis

## Conventions
- **Content type:** Requests/Responses use `application/json`
- **ID convention:** Every path includes the ID suffix `-31477046`
- **User identification:** Protected endpoints expect the active user's ID via the `x-user-id` header (preferred), or `userId` in the query/body

---

## Authentication

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/auth/register-31477046` | Register a new user account | Body: `email`, `password`, `fullname`, `role`, `phone` | Returns **201** with `{ success: true, user }`. Returns **400** with `{ success: false, message }` when validation fails or the email already exists. |
| POST | `/auth/login-31477046` | Authenticate and mark a user as logged in | Body: `email`, `password` | Returns **200** with `{ success: true, user }` including `isLoggedIn`. Returns **400** for validation errors, **404** if the account is not found, **401** for an incorrect password. |
| POST | `/auth/logout-31477046` | Log out the supplied user | Body: `userId` (string; case-insensitive) | Returns **200** with `{ success: true, message }`. Returns **400** if `userId` is missing, **404** if the account cannot be found. |

---

## Dashboard

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| GET | `/dashboard-stats-31477046` | Retrieve aggregate counts for the dashboard widgets | Requires logged-in user (via `x-user-id` or `userId`) | Returns **200** with `{ success: true, stats }`. Forwards errors to the error middleware if retrieval fails. |

---

## Recipes

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/add-recipe-31477046` | Create a recipe for the authenticated chef | Auth required. Body supports `title`, `ingredients[]`, `instructions[]`, `mealType`, `cuisineType`, `prepTime`, `difficulty`, `servings`, `chef`, etc. | Returns **201** with `{ recipe }`. Returns **403** if the user lacks chef permissions, **400** with validation errors (e.g. duplicate title). |
| GET | `/recipes-list-31477046` | List recipes visible to the authenticated chef | Auth required. Query: optional `scope=mine` to restrict to the chef's own recipes. | Returns **200** with `{ recipes, page: 1, total }`. Returns **403** if the user lacks recipe access. |
| GET | `/recipes/:recipeId-31477046` | Fetch a single recipe by ID | Auth required. Path: `recipeId`. | Returns **200** with `{ recipe }` when accessible. Returns **404** if missing, **403** if the user cannot view it. |
| POST | `/recipes/:recipeId/update-31477046` | Update a recipe owned by the authenticated chef | Auth required. Path: `recipeId`. Body accepts partial recipe fields. | Returns **200** with `{ recipe }`. Returns **404** if not found, **403** if the user cannot modify it, **400** for validation errors. |
| DELETE | `/recipes/:recipeId-31477046` | Delete a recipe owned by the authenticated chef | Auth required. Path: `recipeId`. | Returns **204** on success. Returns **404** if not found, **403** if the user cannot delete it. |

---

## Inventory

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/add-inventory-31477046` | Create a new inventory record for the authenticated staff member | Auth required. Body: `ingredientName`, `quantity`, `unit`, `category`, `purchaseDate`, `expirationDate`, `location`, `cost`, etc. | Returns **201** with `{ item }`. Returns **401** when no/invalid login, **403** if the user lacks inventory access, **400** with validation errors. |
| GET | `/inventory-dashboard-31477046` | Paginated inventory list with filtering | Auth required. Query: `page`, `limit`, `q`, `category`, `location`, `unit`, `userId`, `expiringBy`, `lowStockBelow`, `sort`. | Returns **200** with `{ items, page, total, limit }`. Returns **401/403** when authentication fails. |
| GET | `/inventory-dashboard/:inventoryId-31477046` | Retrieve details of a single inventory item | Auth required. Path: `inventoryId`. | Returns **200** with `{ item }`. Returns **404** when not found, **401/403** for authentication issues. |
| POST | `/inventory-dashboard/:inventoryId/update-31477046` | Update quantity or fields on an inventory item | Auth required. Path: `inventoryId`. Body: either `diff`/`set` for quantity adjustments or other fields. | Returns **200** with `{ item }`. Returns **404** when the item is missing, **400** for invalid payloads, **403** if the user lacks access. |
| DELETE | `/inventory-dashboard/:inventoryId-31477046` | Permanently delete an inventory record | Auth required. Path: `inventoryId`. | Returns **204** on success. Returns **404** when not found, **401/403** for authentication issues. |
| GET | `/inventory/expiring-31477046` | List items expiring before a provided date | Auth required. Query: `by` (ISO date), supports pagination filters (`page`, `limit`, `category`, `location`, `unit`, `userId`). | Returns **200** with `{ by, items, page, total, limit }`. Returns **400** if `by` is invalid. |
| GET | `/inventory/low-stock-31477046` | Highlight low-stock items under a threshold | Auth required. Query: `threshold` (number), optional `category`, `location`, `unit`, `userId`. | Returns **200** with `{ threshold, items }`. Returns **400** if `threshold` is missing/invalid. |
| GET | `/inventory/value-31477046` | Calculate total inventory value (optionally grouped) | Auth required. Query: optional `groupBy=category` or `groupBy=location`. | Returns **200** with `{ totalValue, groupBy?, breakdown? }`. Returns **401/403** when authentication fails. |

---

## AI & Analysis

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/ai/analyze-31477046` | Run nutrition analysis via Gemini (with local fallback) | Body: `ingredients` array of strings or ingredient objects | Returns **200** with `{ analysis }` (`summary`, `score`, `concerns`, `suggestions`). Returns **400** when no ingredients are supplied. |

---

> **Note:** All paths are relative to `http://localhost:8080/api` and include the ID suffix `-31477046`.
