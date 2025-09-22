# Part II: Chemist Application (Postman)

In **Week 7**, there is **no UI (no HTML views)**. You’ll test everything using the **Postman HTTP client**.

We’ll build a small backend to manage **medical prescriptions**. Each **prescription** has a **name** and a **list of medicines**. Each **medicine** has a **name** and a **dose**. The project is organized into three subfolders:

- `controllers/` — request handlers (business logic)  
- `models/` — Mongoose schemas and models  
- `routes/` — Express routers/endpoints  

---

## What is `server.js`?

The entry point of the app. It’s responsible for:

- Setting up the Express application  
- Connecting to MongoDB  
- Registering middleware (e.g., `express.json()`, logging, CORS)  
- Registering routes (from the `routes/` folder)  
- Starting the server on a specified port  

---

## Part 1: Models — Mongoose Schemas & Models

Create the `models` folder with two files: `medicine.js` and `prescription.js`.

### `models/medicine.js`

```js
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  // Line 6: The name of the medicine is mandatory.
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Line 12: The dose is controlled by a validator that ensures the value is within the range of 0..100.
  dose: {
    type: Number,
    required: true,
    validate: {
      validator: (v) => v >= 0 && v <= 100,
      message: "Dose must be between 0 and 100",
    },
  },
}, { timestamps: true });

// Line 19: This creates and exports a Mongoose model "Medicine".
// Mongoose will map this to the "medicines" collection (lowercase plural of model name).
module.exports = mongoose.model("Medicine", medicineSchema);
```

**Notes**

- **"Medicine"** is the model name. The collection will be **`medicines`**.  
- `medicineSchema` defines structure and validation rules (name required; dose between 0 and 100).

---

### `models/prescription.js`

```js
const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Lines 5–8: 'medicines' is an array of ObjectIds referencing the Medicine collection.
  medicines: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
  ],
}, { timestamps: true });

// The value of ref: "Medicine" must match the model name in medicine.js.
// ref tells Mongoose which model to use when you call .populate().
module.exports = mongoose.model("Prescription", prescriptionSchema);
```

---

## Part 2: Controllers — Handlers Implementation

Create a `controllers` folder with two files: `medicine-controller.js` and `prescription-controller.js`.

### `controllers/medicine-controller.js`

```js
const Medicine = require("../models/medicine");

module.exports = {
  // Create a new medicine
  createMedicine: async function (req, res) {
    try {
      const aMedicine = new Medicine({
        name: req.body.name,
        dose: parseInt(req.body.dose, 10),
      });
      const saved = await aMedicine.save();
      res.status(200).json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get all medicines
  getAll: async function (req, res) {
    try {
      const medicines = await Medicine.find({}).exec();
      res.status(200).json(medicines);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Delete by id (expects id in query ?id=... or in body)
  deleteById: async function (req, res) {
    try {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const result = await Medicine.findByIdAndDelete(id).exec();
      if (!result) return res.status(404).json({ error: "Medicine not found" });

      res.status(200).json({ message: "Medicine deleted", id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
```

**Notes**

- Line 1: Reference the `Medicine` model to save/find/delete from the `medicines` collection.  
- The file exports an object of handler functions (e.g., `createMedicine`, `getAll`, `deleteById`).

---

### `controllers/prescription-controller.js`

```js
const Prescription = require("../models/prescription");
const Medicine = require("../models/medicine");

module.exports = {
  // Create a new prescription (empty medicines list initially)
  createPrescription: async function (req, res) {
    try {
      const aPrescription = new Prescription({ name: req.body.name });
      const saved = await aPrescription.save();
      res.status(200).json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get all prescriptions (populate medicines for details, not just ObjectIds)
  getAll: async function (req, res) {
    try {
      const pres = await Prescription.find({})
        .populate("medicines") // Line 11 equivalent: fetch medicine details
        .exec();
      res.status(200).json(pres);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Add an existing medicine to an existing prescription
  // Expects: { prescriptionId, medicineId } in body
  addMedicine: async function (req, res) {
    try {
      const { prescriptionId, medicineId } = req.body;
      if (!prescriptionId || !medicineId) {
        return res.status(400).json({ error: "prescriptionId and medicineId are required" });
      }

      // Lines 15–18: Fetch medicine and prescription by ID
      const [medicine, prescription] = await Promise.all([
        Medicine.findById(medicineId).exec(),
        Prescription.findById(prescriptionId).exec(),
      ]);
      if (!medicine) return res.status(404).json({ error: "Medicine not found" });
      if (!prescription) return res.status(404).json({ error: "Prescription not found" });

      // Line 19: Push the medicine _id into the prescription.medicines array (avoid duplicates)
      if (!prescription.medicines.some(id => id.toString() === medicine._id.toString())) {
        prescription.medicines.push(medicine._id);
      }

      // Line 20: Save the updated prescription
      const updated = await prescription.save();

      // Return populated result (instead of redirect, suitable for Postman usage)
      const populated = await updated.populate("medicines");
      res.status(200).json(populated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
```

**Notes**

- `.populate("medicines")` works because `prescriptionSchema` defines `medicines: [{ type: ObjectId, ref: "Medicine" }]`.  
- `addMedicine` links existing documents (many-to-many like behavior through an array of refs).

---

## Part 3: Routes — Express Endpoints

Create a `routes` folder with two router files: `medicine-routes.js` and `prescription-routes.js`.

### `routes/medicine-routes.js`

```js
const express = require("express");
const medicineCont = require("../controllers/medicine-controller");

const router = express.Router();

router.post("/", medicineCont.createMedicine);
router.get("/", medicineCont.getAll);
router.delete("/", medicineCont.deleteById);

module.exports = router;
```

**Why a router?**

- The router keeps medicine-specific endpoints **modular** and separate from `server.js`.  
- Line 2: The router delegates to controller functions on incoming requests.  
- Line 10: Export the router so `server.js` can mount it.

---

### `routes/prescription-routes.js`

```js
const express = require("express");
const prescriptionCont = require("../controllers/prescription-controller");

const router = express.Router();

router.post("/", prescriptionCont.createPrescription);
router.get("/", prescriptionCont.getAll);
router.put("/", prescriptionCont.addMedicine);

module.exports = router;
```

**Why not write these routes directly in `server.js`?**

You *could* do:

```js
app.post("/med", medicineCont.createMedicine);
app.get("/med", medicineCont.getAll);
app.delete("/med", medicineCont.deleteById);
```

…but that’s only OK for tiny apps. For anything real, split by resource to keep code **modular**, **scalable**, and **maintainable**.

---

## Part 4: `server.js` — App Wiring

Create `server.js` at the project root:

```js
const mongoose = require("mongoose");
const express = require("express");
// Optional middleware (uncomment if installed)
// const morgan = require("morgan");
// const cors = require("cors");

const medicineRouter = require("./routes/medicine-routes");
const prescriptionRouter = require("./routes/prescription-routes");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chemist_app";
const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(express.json());
// app.use(morgan("dev"));
// app.use(cors());

// Lines 19–20 equivalent: configure routers and pathnames
app.use("/med", medicineRouter);
app.use("/pres", prescriptionRouter);

// Database + server start
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
```

---

## Testing with Postman

### Base URL
```
http://localhost:8080
```

### Medicines

- **Create medicine** — `POST /med`  
  **Body (JSON):**
  ```json
  { "name": "Paracetamol", "dose": 50 }
  ```

- **List medicines** — `GET /med`

- **Delete medicine** — `DELETE /med?id=<medicineId>`  
  (Alternatively, send `{ "id": "<medicineId>" }` in the body.)

### Prescriptions

- **Create prescription** — `POST /pres`  
  **Body (JSON):**
  ```json
  { "name": "Prescription A" }
  ```

- **List prescriptions (populated medicines)** — `GET /pres`

- **Add medicine to prescription** — `PUT /pres`  
  **Body (JSON):**
  ```json
  {
    "prescriptionId": "<prescriptionId>",
    "medicineId": "<medicineId>"
  }
  ```

**Expected behavior:**

- `GET /pres` returns prescriptions where each item includes `medicines` as **full medicine documents** (because of `.populate("medicines")`), not just ObjectIds.  
- Trying to add the same medicine twice to the same prescription won’t duplicate it (we guard for duplicates in the controller).

---

## Project Structure Recap

```
.
├── controllers/
│   ├── medicine-controller.js
│   └── prescription-controller.js
├── models/
│   ├── medicine.js
│   └── prescription.js
├── routes/
│   ├── medicine-routes.js
│   └── prescription-routes.js
└── server.js
```

---

## Tips

- Use **environment variables** for `MONGO_URI` and `PORT` in production.  
- Add **indexes** and **validation** rules as your data grows.  
- Keep controllers **focused** on business logic; keep routers **thin**.  
- For more complex linking behavior, consider a dedicated **junction model** (like an `Enrollment`) if the relationship itself needs metadata.

Test everything thoroughly with **Postman**. No HTML views needed for this part.
