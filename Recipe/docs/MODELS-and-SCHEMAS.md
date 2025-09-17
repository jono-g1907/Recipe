# Models and Schemas

All persistence lives in-memory via JavaScript objects. The following schemas describe the expected shape for each model, corresponding API payloads, and validation rules enforced by the constructors.

## Recipe

| Field | Type | Required | Validation / Constraints | Default |
| --- | --- | --- | --- | --- |
| `recipeId` | string | Yes | Trimmed; must be non-empty; duplicates rejected by routes. | n/a |
| `title` | string | Yes | Trimmed; non-empty. | n/a |
| `ingredients` | array of Ingredient | Yes | Must be non-empty array; each ingredient validated (see below). | n/a |
| `instructions` | array of string | Yes | Must be non-empty; each string trimmed; empty steps dropped. | n/a |
| `mealType` | enum (`Breakfast`,`Lunch`,`Dinner`,`Snack`) | Yes | Must match `enums.MealType`. | n/a |
| `cuisineType` | string | Optional | Trimmed; may be empty string. | Empty string |
| `prepTime` | number | Yes | Must be finite and > 0 (minutes). | n/a |
| `difficulty` | enum (`Easy`,`Medium`,`Hard`) | Yes | Must match `enums.Difficulty`. | n/a |
| `servings` | number | Yes | Must be finite and > 0. | n/a |
| `chef` | string | Yes | Trimmed; non-empty (often matches `seed.ME`). | n/a |
| `createdDate` | Date | Yes | Input coerced to `Date`; invalid or missing defaults to `new Date()`. | `new Date()` | 

**Ingredient structure**

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `ingredientName` | string | Yes | Trimmed; must be non-empty. |
| `quantity` | number | Yes | Must be finite and > 0. |
| `unit` | string | Yes | Trimmed; must be non-empty. |

**Methods**
- `new Recipe(data)` validates on creation.
- `recipe.update(partial)` re-runs validation on touched fields.
- `recipe.toJSON()` deep clones fields.

## InventoryItem

| Field | Type | Required | Validation / Constraints | Default |
| --- | --- | --- | --- | --- |
| `inventoryId` | string | Yes | Trimmed; non-empty; duplicates rejected by routes. | n/a |
| `userId` | string | Yes | Trimmed; non-empty. | n/a |
| `ingredientName` | string | Yes | Trimmed; non-empty. | n/a |
| `quantity` | number | Yes | Finite, = 0. | n/a |
| `unit` | string | Yes | Trimmed; non-empty. | n/a |
| `category` | string | Optional | Trimmed; defaults to empty string when missing. | `''` |
| `purchaseDate` | Date | Yes | Input coerced to Date; invalid defaults to `new Date()`. | `new Date()` |
| `expirationDate` | Date | Yes | Coerced to Date; invalid defaults to `new Date()`. Must not be earlier than purchase date. | `new Date()` |
| `location` | enum (`Pantry`,`Fridge`,`Freezer`) | Yes | Must match `enums.Location`. | n/a |
| `cost` | number | Yes | Finite, = 0. | n/a |
| `createdDate` | Date | Yes | Coerced to Date; invalid defaults to `new Date()`. | `new Date()` |

**Methods**
- `new InventoryItem(data)` validates on creation.
- `item.update(partial)` revalidates touched fields.
- `item.adjustQuantity(diff)` increments by finite value; ensures result non-negative.
- `item.setQuantity(quantity)` sets quantity to non-negative finite value.
- `item.isExpiringSoon(days)` returns boolean; invalid/negative days -> false.
- `item.isLowStock(threshold)` returns boolean; invalid/negative threshold -> false.
- `item.toJSON()` returns deep clone.

## ValidationError

- Custom error carrying `errors` array of message strings.
- Interpreted by `error` middleware to pick status code (400 when message includes "required", otherwise 422).

## Relationships & Data Flow

- `src/store.js` instantiates models from `src/seed.js` and shares arrays. API/UI routes mutate these arrays directly, so data lasts for process lifetime only.
- No foreign keys; relationships are implicit (recipes reference `chef` string, inventory references `userId`).

## Derived Identifiers

- `seed.ME = AUTHOR_NAME-without-spaces + '-' + APP_ID` ensures consistent `userId`/`chef` values.
- Routes expect IDs embedded in paths (e.g., `/recipes/:id-APP_ID`), so when generating IDs ensure suffix is appended.

## Future Considerations

- Consider freezing enum objects to prevent accidental mutation.
- Replace `new Date()` defaults with `null` to surface invalid inputs rather than silently correcting.
- For persistence, map these models to database schemas (e.g., Mongo or SQL) ensuring validations align.
