# Data Models Specification

This document specifies the **User**, **Recipe**, and **UserInventory** entities, their validation, and relationships. It is designed for a multi‑user system with role‑based access at the routing level.

---

## User Entity

### Overview
Represents individual users with authentication credentials, personal information, and a designated role that determines access permissions.

### Attributes
| Attribute | Type | Description | Example |
|---|---|---|---|
| `userId` | String | Auto‑generated unique identifier (format: `U-XXXXX`) created when a user registers. | `U-00001` |
| `email` | String | Unique email address used for authentication and communication. | `john.doe@example.com` |
| `password` | String | Hashed password that must meet complexity requirements. | `$2b$10$hashedpassword...` |
| `fullname` | String | Full name for display/personalization. | `John Michael Doe` |
| `role` | String (Enum) | Role determining access permissions: one of `admin`, `chef`, `manager`. | `chef` |
| `phone` | String | Contact number for communication/verification. | `+61-412-345-678` |
| `createdAt` | Date | Timestamp when the account was created (auto). | `2024-03-15T10:30:00.000Z` |
| `updatedAt` | Date | Timestamp when the account was last modified (auto). | `2024-03-20T14:45:30.000Z` |

### MongoDB Schema Details
- **Collection:** `users`
- **Primary Key:** `_id` (ObjectId)
- **Unique Attributes:** `email`
- **Required Fields:** `userId`, `email`, `password`, `fullname`, `role`, `phone`

### Validation Rules
- **Email:** Valid email format; **unique** across all users.
- **Password:** At least **8 characters**, includes **uppercase**, **lowercase**, **number**, and **special character**.
- **Full Name:** 2–100 chars; no numbers/special chars except spaces, hyphens, and apostrophes.
- **Role:** Exactly one of: `admin`, `chef`, `manager`.
- **Phone:** Valid phone number format (international accepted).

### Role Definitions (routing-level access)
- **Admin:** Full access (including **Reports**) **except** managing recipes.
- **Chef:** Can create, modify, delete **recipes** and manage **inventory**.
- **Manager:** Same as admin **without** access to **Reports**.

#### Permissions Matrix
| Role | Recipes | Inventory Items | Reports |
|---|---|---|---|
| Admin | ✗ | ✓ | ✓ |
| Chef | ✓ | ✓ | ✗ |
| Manager | ✗ | ✓ | ✗ |

---

## Recipe Entity

### Overview
Represents cooking recipes. Linked to the creator via `userId` for ownership and access control.

### Attributes
| Attribute | Type | Description | Example |
|---|---|---|---|
| `recipeId` | String | Unique identifier (format: `R-XXXXX`). | `R-00001` |
| `userId` | String | Reference to the user who created the recipe (format: `U-XXXXX`). | `U-00001` |
| `title` | String | Name of the recipe. | `Spaghetti Carbonara` |
| `chef` | String | Recipe author/submitter. | `John Smith` |
| `ingredients` | Array\<String\> **or** Array\<Object\> | List of ingredients with quantities; or objects with `item` and `qty`. | `["200g spaghetti", "100g pancetta", "2 eggs"]` |
| `instructions` | Array\<String\> | Step‑by‑step cooking instructions. | `["Boil water", "Cook pasta", "Mix eggs"]` |
| `mealType` | String | Category: `Breakfast`, `Lunch`, `Dinner`, `Snack`. | `Dinner` |
| `cuisineType` | String | Origin/style: `Italian`, `Asian`, `Mexican`, `American`, `French`, `Indian`, `Mediterranean`, `Other`. | `Italian` |
| `prepTime` | Number | Prep time in minutes (1–480). | `30` |
| `difficulty` | String | `Easy`, `Medium`, or `Hard`. | `Easy` |
| `servings` | Number | Number of people served (1–20). | `4` |
| `createdDate` | Date | Date added (cannot be in the future). | `2025-07-21T00:00:00.000Z` |

### MongoDB Schema Details
- **Collection:** `recipes`
- **Primary Key:** `_id` (ObjectId)
- **Unique Attributes:** `recipeId`
- **Foreign Key:** `userId` (references `users`)
- **Required Fields:** `recipeId`, `userId`, `title`, `chef`, `ingredients`, `instructions`, `mealType`, `cuisineType`, `prepTime`, `difficulty`, `servings`, `createdDate`

### Validation Rules
- **Recipe ID:** Format `R-XXXXX`; **unique** across recipes.
- **User ID:** Valid `U-XXXXX` that **exists** in `users`.
- **Title:** 3–100 chars; **unique per user**.
- **Chef:** 2–50 chars; no numbers/special chars except spaces/hyphens/apostrophes.
- **Ingredients:** 1–20 items; each string ≥3 chars (or structured objects).
- **Instructions:** 1–15 steps; each step ≥10 chars.
- **Meal Type:** One of `Breakfast|Lunch|Dinner|Snack`.
- **Cuisine Type:** One of `Italian|Asian|Mexican|American|French|Indian|Mediterranean|Other`.
- **Prep Time:** Integer 1–480.
- **Difficulty:** `Easy|Medium|Hard`.
- **Servings:** Integer 1–20.
- **Created Date:** Valid date, **not in the future**.

---

## UserInventory Entity

### Overview
Represents shared inventory items managed by all authenticated users. `userId` tracks which user added the item.

### Attributes
| Attribute | Type | Description | Example |
|---|---|---|---|
| `inventoryId` | String | Unique identifier (format: `I-XXXXX`). | `I-00001` |
| `userId` | String | Reference to user who added the item (format: `U-XXXXX`). | `U-00001` |
| `ingredientName` | String | Name of the ingredient. | `Tomatoes` |
| `quantity` | Number | Amount available (>0; supports decimals). | `5` |
| `unit` | String | Measurement unit: `pieces`, `kg`, `g`, `liters`, `ml`, `cups`, `tbsp`, `tsp`, `dozen`. | `pieces` |
| `category` | String | Category: `Vegetables`, `Fruits`, `Meat`, `Dairy`, `Grains`, `Spices`, `Beverages`, `Frozen`, `Canned`, `Other`. | `Vegetables` |
| `purchaseDate` | Date | Date acquired (not in the future). | `2025-07-15T00:00:00.000Z` |
| `expirationDate` | Date | Expiry date (must be after purchase date). | `2025-07-25T00:00:00.000Z` |
| `location` | String | Storage location: `Fridge`, `Freezer`, `Pantry`, `Counter`, `Cupboard`. | `Fridge` |
| `cost` | Number | Purchase cost per unit (0.01–999.99; max 2 decimals). | `4.50` |
| `createdDate` | Date | Date the item was added (not in the future). | `2025-07-21T00:00:00.000Z` |

### MongoDB Schema Details
- **Collection:** `inventory`
- **Primary Key:** `_id` (ObjectId)
- **Unique Attributes:** `inventoryId`
- **Required Fields:** `inventoryId`, `userId`, `ingredientName`, `quantity`, `unit`, `category`, `purchaseDate`, `expirationDate`, `location`, `cost`, `createdDate`

### Validation Rules
- **Inventory ID:** Format `I-XXXXX`; **unique** across inventory.
- **User ID:** Valid `U-XXXXX` that exists in `users`.
- **Ingredient Name:** 2–50 chars; no numbers/special chars except spaces and hyphens.
- **Quantity:** Positive number >0; max 9999; decimals allowed.
- **Unit:** One of `pieces|kg|g|liters|ml|cups|tbsp|tsp|dozen`.
- **Category:** One of `Vegetables|Fruits|Meat|Dairy|Grains|Spices|Beverages|Frozen|Canned|Other`.
- **Purchase Date:** Valid date; **not in the future**.
- **Expiration Date:** Valid date; **after** purchase date.
- **Location:** One of `Fridge|Freezer|Pantry|Counter|Cupboard`.
- **Cost:** Positive number with up to 2 decimals; 0.01–999.99.
- **Created Date:** Valid date; **not in the future**.

---

## Model Changes (from previous implementation)
- **New `userId` across all models** to support multi‑user relationships.
- **Recipe:** added `userId` (`U‑XXXXX`) to link each recipe to its creator (chef).
- **Inventory:** standardized `userId` format to `U‑XXXXX` for consistency.
- **User:** added auto‑generated `userId` (`U‑XXXXX`) as a human‑readable identifier.

## Entity Relationships
- **User → Recipe:** One‑to‑Many (each chef can create multiple recipes).
- **User → Inventory:** Many‑to‑Many (multiple users can manage shared items).
- **Recipe ↔ Inventory:** No direct relationship in core tasks.
