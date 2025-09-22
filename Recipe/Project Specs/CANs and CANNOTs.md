# What You **CAN** and **CANNOT** Use When Developing the App (Printable)

**Purpose:** A concise, print‑friendly policy you can drop straight into your repo.  
**Source:** “CANs and CANNOTs” brief (transcribed).

---

## ✅ You **CAN** Use

- **Node.js + Express.js** for the backend.  
  *This is mandatory for server‑side implementation.*

- **MongoDB (ONLY)** as the database management system.

- **Bootstrap** on the frontend for styling and layout.  
  **Do not** use a CDN; serve Bootstrap **locally from `node_modules`** as static assets.

- **External helper functions** for data manipulation **if needed**.  
  Keep them lightweight (e.g., parsing/formatting) and **cite sources** if reused verbatim.

---

## ⛔ You **CANNOT** Use

- **External frameworks/libraries** not introduced in the unit materials.  
  Examples: **no `fetch` API** and **no `method-override`** module. Follow the specs and taught materials only.

- **Angular or React** for the frontend.  
  Single‑Page Application frameworks are **not permitted**.

- **Any pre‑made templates** (Bootstrap themes, W3Schools snippets, Tailwind, etc.).  
  The UI must be **built from scratch**.

<div style="page-break-after: always;"></div>

## MongoDB Identity vs Application Identity

- **Do not overwrite Mongoose’s `_id` field.**  
  `_id` is always an **ObjectId** and is the **primary key** in MongoDB.

- The assignment’s **“custom format”** refers to your **`userId`** attribute (a **string**), not a replacement for `_id`.  
  Think of `_id` as MongoDB’s own identity, and `userId` as your **application‑level** identifier that follows the required format.

- When another collection (e.g., **Recipe**) “links” to a user, it refers to this **`userId` string**, **not** the MongoDB `_id`.  
  Because of that, you **cannot** use Mongoose’s `populate()` directly on `userId` (it only works with ObjectId refs).  
  Instead, **perform manual lookups** using `userId` in your queries or aggregation pipelines.

### Example (Manual Lookup with `userId`)
```js
// Find a Recipe by application-level userId
const recipe = await Recipe.findOne({ userId: "u-31477046" });

// Join-like aggregation using userId (not populate)
const pipeline = [
  { $match: { userId: "u-31477046" } },
  { $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userInfo"
  }}
];
const results = await Recipe.aggregate(pipeline);
```

---

## Permission Matrix Clarification (Routing‑Level Access)

- The permission matrix governs **which routes** a role can access; it is **not** a blanket rule about data visibility in **reports**.
- **Admins** can **view** recipe information indirectly **via reports** (e.g., **popularity analysis**), but **do not** have **CRUD access** to the **Recipes pages** themselves.  
  The Recipes feature remains restricted to **Chefs**.
- Consequently, a report card may display aggregated recipe data to Admins without granting them page‑level permissions for recipe management.

<div style="page-break-after: always;"></div>

## Practical Compliance (Optional Helpers)

### Serve Bootstrap Locally (no CDN)
```bash
npm i bootstrap
```

**Express static mapping (scoped to Bootstrap):**
```js
import express from "express";
import path from "path";

const app = express();
app.use(
  "/bootstrap",
  express.static(path.join(process.cwd(), "node_modules", "bootstrap", "dist"))
);
```

**In your HTML/EJS:**
```html
<link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css">
<script src="/bootstrap/js/bootstrap.bundle.min.js"></script>
```

### Sanity Checklist
- [ ] Backend is **Node.js + Express** only.  
- [ ] Database is **MongoDB** (no alternates).  
- [ ] **Bootstrap** served **locally** from `node_modules` (no CDN).  
- [ ] No **Angular/React** or SPA frameworks.  
- [ ] No **pre‑made templates** (Bootstrap themes, Tailwind, W3Schools, etc.).  
- [ ] No **unintroduced libraries/APIs** (e.g., `method-override`, `fetch`).  
- [ ] Respect **`_id`** as ObjectId; use **`userId`** for app‑level references; **manual lookups** instead of `populate()`.  
- [ ] Reports may show **aggregated** recipe info to Admins; **no** Admin CRUD on Recipes pages.

---

*End of document.*
