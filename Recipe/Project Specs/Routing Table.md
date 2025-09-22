# Enhanced API Routing Table — Recipe Hub / CloudKitchen Pro (ID: 31477046)

**Base URL:** `http://localhost:8080/api`  
**Content-Type:** `application/json`  
**Rule:** Every path includes your student ID suffix `-31477046`.

---

## 1) Auth & Users

| Method | Endpoint Path | Purpose | Expected Body / Query | Success | Error Cases |
|---|---|---|---|---|---|
| POST | **/users/register-31477046** | Register a new user | Body: `{ email, password, fullname, role, phone }` | `201 { user: { userId, email, fullname, role } }` | `400/422` validation errors; `409` email exists |
| POST | **/users/login-31477046** | Log in and start a session (or mint JWT) | Body: `{ email, password }` | `200 { user: { userId, email, fullname, role }, token/sessionId }` | `401` invalid credentials; `404` account not found |
| POST | **/users/logout-31477046** | Log out (invalidate session/JWT) | – | `204` no content | `401` not authenticated |
| GET | **/users/me-31477046** | Get current user profile | – (auth required) | `200 { userId, email, fullname, role, phone, createdAt }` | `401` not authenticated |
| GET | **/users/check-unique-email-31477046** | Client-side uniqueness check | Query: `email` | `200 { isAvailable: boolean }` | `400` malformed email |

**Validation (server-side):** enforce email uniqueness and complexity rules for `password`, `role ∈ {admin, chef, manager}`, `fullname` length/characters, and valid `phone` (AU/international).

---

## 2) Homepage / Stats

| Method | Endpoint Path | Purpose | Expected Body / Query | Success | Error Cases |
|---|---|---|---|---|---|
| GET | **/home-31477046** | Render/return homepage stats (for EJS or JSON) | – (auth required) | `200 { username, email, counts: { users, recipes, inventory } }` | `401` not authenticated |

Notes: Use efficient Mongoose queries/aggregations to compute counts. The homepage should display logged-in `username` and `email` and include a logout action.

---

## 3) Recipes

| Method | Endpoint Path | Purpose | Expected Body / Query | Success | Error Cases |
|---|---|---|---|---|---|
| POST | **/add-recipe-31477046** | Create a recipe | Body: `{ userId, title, chef, ingredients, instructions, mealType, cuisineType, prepTime, difficulty, servings, createdDate }` (server may generate `recipeId`) | `201 { recipe }` | `400/422` validation errors |
| GET | **/recipes-list-31477046** | List & filter recipes (paginated) | Query: `page, limit, q, mealType, cuisineType, maxPrepTime, difficulty, chef, createdFrom, createdTo, ingredientsAll, ingredientsAny, sort` | `200 { items:[recipe], page, total }` | – |
| GET | **/recipes/:recipeId-31477046** | Get one recipe | Path: `recipeId` | `200 { recipe }` | `404` not found |
| **POST** | **/recipes/:recipeId/update-31477046** | **Update a recipe** (replaces prior PUT/PATCH) | Path: `recipeId`; Body: *partial or full* recipe fields; server performs field-level update with validation | `200 { recipe }` | `400/422` validation; `404` not found |
| DELETE | **/recipes/:recipeId-31477046** | Delete a recipe | Path: `recipeId` | `204` no content | `404` not found |
| POST (form-friendly) | **/recipes/:recipeId/delete-31477046** | Delete via HTML form (no JS/method-override) | Path: `recipeId` (in path or body) | `204` (or `303` redirect) | `404` not found |
| GET | **/recipes/search-31477046** | Text search | Query: `q`, `fields`, plus list filters | `200 { items:[recipe], page, total }` | – |
| GET | **/recipes/suggest-31477046** | Suggest recipes from inventory | Query: `minMatch (0–1)`, `excludeDifficulties`, `timeBudget` (mins) | `200 { items:[{ recipe, matchScore, missingIngredients:[] }] }` | – |

**Validation (server-side):**  
- `recipeId` format `R-XXXXX` (if client supplies), unique.  
- `userId` exists and uses `U-XXXXX` format.  
- `title` unique **per user**, length 3–100.  
- `chef` 2–50, limited characters.  
- `ingredients` 1–20, each ≥3 chars (or structured `{item, qty}`).  
- `instructions` 1–15 steps, each ≥10 chars.  
- `mealType ∈ {Breakfast, Lunch, Dinner, Snack}`.  
- `cuisineType ∈ {Italian, Asian, Mexican, American, French, Indian, Mediterranean, Other}`.  
- `prepTime` 1–480 (minutes), `difficulty ∈ {Easy, Medium, Hard}`, `servings` 1–20, `createdDate` ≤ now.

---

## 4) Inventory

| Method | Endpoint Path | Purpose | Expected Body / Query | Success | Error Cases |
|---|---|---|---|---|---|
| POST | **/add-inventory-31477046** | Add inventory item | Body: `{ userId, ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost, createdDate }` (server may generate `inventoryId`) | `201 { item }` | `400/422` validation errors |
| GET | **/inventory-dashboard-31477046** | List & filter items (paginated) | Query: `page, limit, q, category, location, expiringBy, lowStockBelow, userId, sort` | `200 { items:[item], page, total }` | – |
| GET | **/inventory-dashboard/:inventoryId-31477046** | Get one item | Path: `inventoryId` | `200 { item }` | `404` not found |
| **POST** | **/inventory-dashboard/:inventoryId/update-31477046** | **Update an item** (replaces prior PUT/PATCH) | Path: `inventoryId`; Body: *partial or full* fields; server performs field-level update with validation | `200 { item }` | `400/422`; `404` |
| DELETE | **/inventory-dashboard/:inventoryId-31477046** | Delete an item | Path: `inventoryId` | `204` | `404` |
| POST (form-friendly) | **/delete-inventory/:inventoryId-31477046** | Delete via HTML form | Path: `inventoryId` | `204` (or `303` redirect) | `404` |
| GET | **/inventory/expiring-31477046** | Items expiring by a date | Query: `by` (ISO date), `page, limit` | `200 { items:[item], page, total }` | – |
| GET | **/inventory/low-stock-31477046** | Items below threshold | Query: `threshold` (number), `category?`, `unit?` | `200 { items:[item] }` | – |
| GET | **/inventory/value-31477046** | Aggregated inventory value | Query: `groupBy? (category|location)` | `200 { totalValue, breakdown? }` | – |

**Validation (server-side):**  
- `inventoryId` format `I-XXXXX` (if client supplies), unique.  
- `userId` exists and uses `U-XXXXX` format.  
- `ingredientName` 2–50, limited characters.  
- `quantity > 0` (≤ 9999, decimals ok), `unit ∈ {pieces, kg, g, liters, ml, cups, tbsp, tsp, dozen}`.  
- `category ∈ {Vegetables, Fruits, Meat, Dairy, Grains, Spices, Beverages, Frozen, Canned, Other}`.  
- `purchaseDate` ≤ now; `expirationDate` > `purchaseDate`; `location ∈ {Fridge, Freezer, Pantry, Counter, Cupboard}`.  
- `cost` positive, 2 decimal places, 0.01–999.99; `createdDate` ≤ now.

---

## 5) Role Visibility (Routing-Level)

- **Admin:** Inventory + Reports; no recipe pages.  
- **Chef:** Recipes + Inventory; no reports.  
- **Manager:** Inventory only; no recipes/reports.

Implement this at the router/middleware level (page access/menus), not with DB-level permissions.

---

## 6) Notes for Controllers / DB Integration

- All create/update routes must validate against the Mongoose schemas, enforce uniqueness (e.g., user email, `recipeId`, `inventoryId`, `title` per user), and coerce/trim inputs server-side.  
- `userId` must be attached to created recipes and inventory items (from session or request body).  
- Use indexes for: `users.email` (unique), `recipes.recipeId` (unique), `recipes.userId+title` (unique compound), `inventory.inventoryId` (unique).  
- Homepage counts should use `estimatedDocumentCount()` or `.countDocuments({})` appropriately; use aggregation for `inventory/value`.  
- EJS forms that can't send `DELETE` can target the provided POST delete endpoints.

