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
| POST | `/add-recipe-31477046` | Create a recipe | `title` (string), `ingredients` (Ingredient[]), `instructions` (string[]), `mealType` (string), `cuisineType` (string), `prepTime` (number), `difficulty` (string), `servings` (number), `chef` (string) | Returns JSON `{recipe}` with **201**. Returns JSON `{error}` with **400** or **422**. |
| GET | `/recipes-list-31477046` | List recipes | `page` (number), `limit` (number), `q` (string), `mealType` (string), `cuisineType` (string), `maxPrepTime` (number), `difficulty` (string), `chef` (string), `createdFrom` (date), `createdTo` (date), `ingredientsAll` (csv), `ingredientsAny` (csv), `sort` (`field:dir`) | Returns JSON `{items:[recipe], page, total}` with **200**. |
| GET | `/recipes/:recipeId-31477046` | Get one recipe | Path: `recipeId` (string) | Returns JSON `{recipe}` with **200**. Returns JSON `{error}` with **404**. |
| POST | `/recipes/:recipeId/update-31477046` | Update recipe | Path: `recipeId` (string); Body: full recipe | Returns JSON `{recipe}` with **200**. Returns JSON `{error}` with **400**, **422**, or **404**. |
| DELETE | `/recipes/:recipeId-31477046` | Delete recipe | Path: `recipeId` (string) | Returns no content with **204**. Returns JSON `{error}` with **404**. |
| POST | `/recipes/:recipeId/delete-31477046` | Form delete | Path: `recipeId` (or body) | Returns **204** or **303** (redirect). Returns **404** if not found. |
| GET | `/recipes/search-31477046` | Text search | Query: `q` (string), `fields` (csv), plus list filters | Returns JSON `{items:[recipe], page, total}` with **200**. |
| GET | `/recipes/suggest-31477046` | Suggest from inventory | Query: `minMatch` (number 0–1), `excludeDifficulties` (csv), `timeBudget` (number mins) | Returns JSON `{items:[{recipe, matchScore, missingIngredients:[]}]} ` with **200**. |

---

## Inventory

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/add-inventory-31477046` | Add inventory item | `userId` (string), `ingredientName` (string), `quantity` (number), `unit` (string), `category` (string, optional), `purchaseDate` (date), `expirationDate` (date), `location` (string), `cost` (number) | Returns JSON `{item}` with **201**. Returns JSON `{error}` with **400** or **422**. |
| GET | `/inventory-dashboard-31477046` | List inventory | `page` (number), `limit` (number), `q` (string), `category` (string), `location` (string), `expiringBy` (date), `lowStockBelow` (number), `userId` (string), `sort` (`field:dir`) | Returns JSON `{items:[item], page, total}` with **200**. |
| GET | `/inventory-dashboard/:inventoryId-31477046` | Get one item | Path: `inventoryId` (string) | Returns JSON `{item}` with **200**. Returns JSON `{error}` with **404**. |
| POST | `/inventory-dashboard/:inventoryId/update-31477046` | Update inventory item | Path: `inventoryId`; Body: partial or full fields | Returns JSON `{item}` with **200**. Returns **400/422** or **404**. |
| DELETE | `/delete-inventory/:inventoryId-31477046` | Delete item | Path: `inventoryId` (string) | Returns no content with **204**. Returns JSON `{error}` with **404**. |
| POST | `/delete-inventory/:inventoryId-31477046` | Form delete | Path: `inventoryId` | Returns **204** or **303** (redirect). Returns **404**. |
| GET | `/inventory/expiring-31477046` | Items expiring by date | By ISO date, `page`, `limit` | Returns JSON `{items, page, total}` with **200**. |
| GET | `/inventory/low-stock-31477046` | Below threshold | `Threshold`, `category`, `unit` | Returns JSON `{items}` with **200**. |

---

## Auth & Users

| HTTP Method | Endpoint Path | Description | Expected Parameters | Response / Behaviours |
|---|---|---|---|---|
| POST | `/users/register-31477046` | Register user | `email`, `password`, `fullname`, `role`, `phone` | Returns JSON `{user: {userId, email, fullname, role}}` with **201**. Returns **400/422** validation or **409** email exists. |
| POST | `/users/login-31477046` | Login | `email`, `password` | Returns JSON `{user: {userId, email, fullname, role}, token/sessionId}` with **200**. Returns **401** invalid creds or **404** not found. |
| POST | `/users/logout-31477046` | Logout | — | Returns **401** unauthenticated status code. |
| GET | `/users/me-31477046` | Current profile | Auth | Returns **401** status code. |
| GET | `/users/check-unique-email-31477046` | Email availability | `?email=` | Returns **400** malformed code. |

---

> **Note:** All paths are relative to the base URL `http://localhost:8080/api` and include the ID suffix `-31477046`.
