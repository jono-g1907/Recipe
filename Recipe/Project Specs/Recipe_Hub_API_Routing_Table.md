# Recipe Hub API – Routing Table

## Information
- **App name:** Recipe Hub – Personal Meal Planning Assistant  
- **Base URL:** `http://localhost:8080/api` (all endpoints are relative to this)  
- **Domain focus:** recipes and basic ingredient inventory, search/filtering, alerts and recipe & inventory integration

## Conventions
- **Content type:** Requests/Responses use `application/json`  
- **ID convention:** Every path includes the ID suffix `-31477046`

---

## Recipes

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/add-recipe-31477046` | Create a recipe | Headers: `x-user-id` (required, resolves logged-in chef). Body: `title`, `ingredients[] { ingredientName, quantity, unit }`, `instructions[]`, `mealType`, `cuisineType`, `prepTime`, `difficulty`, `servings`, `chef`. | Returns JSON `{ recipe }` with **201**. Validation errors return `{ error }` with **400** or **422**. Authentication/authorisation failures return **401/403**. |
| GET | `/recipes-list-31477046` | List recipes visible to the user | Headers: `x-user-id` (required). Query: `scope` (`mine` to limit to the chef's own recipes; default lists all accessible recipes). | Returns JSON `{ recipes, page: 1, total }` with **200**. Errors return `{ error }` with **401** for missing/invalid session or **403** if the account lacks chef access. |
| GET | `/recipes/:recipeId-31477046` | Retrieve a single recipe | Headers: `x-user-id` (required). Path: `recipeId`. | Returns JSON `{ recipe }` with **200** when the user has view permission. Missing recipe → `{ error }` **404**. Permission/auth issues → `{ error }` with **401/403**. |
| POST | `/recipes/:recipeId/update-31477046` | Update an existing recipe | Headers: `x-user-id` (required). Path: `recipeId`. Body: recipe fields to replace/update (same structure as creation). | Returns JSON `{ recipe }` with **200** on success. Validation or permission failures return `{ error }` with **400/403**. Missing recipe returns `{ error }` with **404**. |
| DELETE | `/recipes/:recipeId-31477046` | Delete a recipe | Headers: `x-user-id` (required). Path: `recipeId`. | Returns **204** (no body) when deleted. `{ error }` with **401/403** for auth issues or **404** when not found. |

---

## Inventory

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/add-inventory-31477046` | Create a new inventory item | Headers: `x-user-id` (required, must belong to authorised inventory staff). Body: `ingredientName`, `quantity`, `unit`, optional `category`, `location`, `purchaseDate`, `expirationDate`, `cost`, `createdDate`. | Returns JSON `{ item }` with **201**. Validation errors return `{ error }` with **400/422**. Auth/permission failures return `{ error }` with **401/403**. |
| GET | `/inventory-dashboard-31477046` | Paginated inventory listing | Headers: `x-user-id` (required). Query: `page`, `limit`, `q`, `category`, `location`, `unit`, `userId`, `expiringBy`, `lowStockBelow`, `sort`. | Returns JSON `{ items, page, total, limit }` with **200**. Auth errors return `{ error }` with **401/403**. |
| GET | `/inventory-dashboard/:inventoryId-31477046` | Fetch a single inventory record | Headers: `x-user-id` (required). Path: `inventoryId`. | Returns JSON `{ item }` with **200**. Missing item → `{ error }` **404**. Auth failures → `{ error }` **401/403**. |
| POST | `/inventory-dashboard/:inventoryId/update-31477046` | Update or adjust inventory | Headers: `x-user-id` (required). Path: `inventoryId`. Body: either adjustment `{ diff }` or `{ set }`, or standard inventory fields to replace (`ingredientName`, `quantity`, `unit`, etc.). | Returns JSON `{ item }` with **200**. Validation failures → `{ error }` **400/422**. Missing item → `{ error }` **404**. Auth issues → `{ error }` **401/403**. |
| DELETE | `/inventory-dashboard/:inventoryId-31477046` | Delete an inventory item | Headers: `x-user-id` (required). Path: `inventoryId`. | Returns **204** on success. Missing item → `{ error }` **404**. Auth issues → `{ error }` **401/403**. |
| GET | `/inventory/expiring-31477046` | List items expiring by a given date | Headers: `x-user-id` (required). Query: `by` (required ISO date), optional `page`, `limit`, `category`, `location`, `unit`, `userId`. | Returns JSON `{ by, items, page, total, limit }` with **200**. Missing/invalid `by` → validation `{ error }` **400**. |
| GET | `/inventory/low-stock-31477046` | Show items below a threshold | Headers: `x-user-id` (required). Query: `threshold` (required number ≥ 0), optional `category`, `location`, `unit`, `userId`. | Returns JSON `{ threshold, items }` with **200**. Validation failures → `{ error }` **400**. |
| GET | `/inventory/value-31477046` | Calculate total inventory value | Headers: `x-user-id` (required). Query: optional `groupBy` (`category` or `location`). | Returns JSON `{ totalValue }` and optional `{ groupBy, breakdown[] }` with **200**. Auth failures → `{ error }` **401/403**. |

---

## Auth & Users

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/auth/register-31477046` | Register a new account | Body: `email`, `password`, `fullname`, `role`, `phone`. | Returns JSON `{ success: true, user }` with **201**. Validation failures → `{ success: false, message }` with **400**. Conflicts surface as validation messages. |
| POST | `/auth/login-31477046` | Log in an existing user | Body: `email`, `password`. | Returns JSON `{ success: true, user }` with **200**. Invalid credentials → `{ success: false, message }` with **401**. Unknown email → `{ success: false, message }` with **404**. Validation errors → **400**. |
| POST | `/auth/logout-31477046` | Log out a user session | Body: `userId` (required, case-insensitive). | Returns JSON `{ success: true, message }` with **200**. Missing ID → `{ success: false, message }` **400**. Unknown account → `{ success: false, message }` **404**. |

---

## Analytics & AI

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| GET | `/dashboard-stats-31477046` | Retrieve dashboard summary metrics | — | Returns JSON `{ success: true, stats }` with **200**. Server errors propagate through standard error handling. |
| POST | `/ai/analyze-31477046` | Generate AI-backed nutrition analysis for a recipe | Body: `ingredients` (array of strings or ingredient objects `{ name/ingredientName, quantity, unit }`, at least one entry required). | Returns JSON `{ analysis }` with **200**. Missing ingredients → `{ error, message }` with **400**. Server/AI failures bubble to error middleware. |

---

> **Note:** All paths are relative to the base URL `http://localhost:8080/api` and include the ID suffix `-31477046`.
