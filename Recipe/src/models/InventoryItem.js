// Load mongoose so we can build a schema to describe how an inventory item
// should look when stored in MongoDB.
const mongoose = require('mongoose');
// Pull in the User model so we can double-check that an inventory item is
// always tied to a valid user.
const User = require('./User');

// Regex = pattern of characters we can test strings against.
// These constants make it easy to see the valid shapes for our data.
// Example: an inventoryId must look like "I-12345".
const INVENTORY_ID_REGEX = /^I-\d{5}$/;
// Every userId should follow the "U-12345" pattern to stay consistent.
const USER_ID_REGEX = /^U-\d{5}$/;
// Ingredient names allow letters, spaces, apostrophes, and hyphens.
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
// Enumerations (enums) list the only allowed values for a field.
const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
const LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

// Helper validator that ensures a date value is today or earlier.
function notInFuture(value) {
  if (!value) return false;
  const now = new Date();
  return value.getTime() <= now.getTime();
}

// Helper validator that ensures date "a" comes after date "b".
function isAfter(a, b) {
  if (!a || !b) return false;
  return a.getTime() > b.getTime();
}

// Custom validator that enforces two decimal places and a reasonable cost.
function costValidator(value) {
  if (typeof value !== 'number') return false;
  if (value < 0.01 || value > 999.99) return false;
  // Math trick: multiply by 100, round, then compare to original to make sure
  // we only have up to two digits after the decimal point.
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 1e-6;
}

// The schema acts like a blueprint for inventory documents in MongoDB.
const inventorySchema = new mongoose.Schema({
  // Public identifier shown to the user. Example: I-00042.
  inventoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: INVENTORY_ID_REGEX
  },
  // We also store the user's public id (string) alongside the Mongo ObjectId.
  userId: {
    type: String,
    required: true,
    trim: true,
    match: USER_ID_REGEX,
    validate: {
      validator: async function (value) {
        if (!value) return false;
        const exists = await User.exists({ userId: value });
        return !!exists;
      },
      message: 'User Id must exist before creating an inventory item.'
    }
  },
  // "user" is the actual reference (foreign key) to the User collection.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Name of the ingredient this record is tracking.
  ingredientName: {
    type: String,
    required: true,
    trim: true,
    match: INGREDIENT_NAME_REGEX
  },
  // How much of the ingredient we have on hand.
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    max: 9999
  },
  // Unit of measurement (must match the UNITS array above).
  unit: {
    type: String,
    required: true,
    trim: true,
    lowercase: false,
    enum: UNITS
  },
  // Broad category to make filtering and reporting easier.
  category: {
    type: String,
    required: true,
    enum: CATEGORIES
  },
  // When we bought the item. Cannot be in the future.
  purchaseDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return notInFuture(value);
      },
      message: 'Purchase date cannot be in the future.'
    }
  },
  // When the ingredient goes bad. Must come after the purchase date.
  expirationDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        if (!value || !this.purchaseDate) return false;
        return isAfter(value, this.purchaseDate);
      },
      message: 'Expiration date must be after purchase date.'
    }
  },
  // Where in the kitchen we store the ingredient.
  location: {
    type: String,
    required: true,
    enum: LOCATIONS
  },
  // Price we paid. Uses the costValidator to enforce reasonable values.
  cost: {
    type: Number,
    required: true,
    validate: {
      validator: costValidator,
      message: 'Cost must be between 0.01 and 999.99 with up to 2 decimals.'
    }
  },
  // When this record was originally created in the business system.
  createdDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return notInFuture(value);
      },
      message: 'Created date cannot be in the future.'
    }
  },
  // Mongo-managed timestamps: when the document was inserted.
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  // Updated each time we save. See pre('save') hook below.
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});


// "Hooks" run before or after certain mongoose operations. Here we update the
// updatedAt timestamp every time the document is saved.
inventorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes speed up lookups by inventoryId and userId.
inventorySchema.index({ inventoryId: 1 });
inventorySchema.index({ userId: 1 });

// Export a model so other files can create/read/update/delete inventory items.
module.exports = mongoose.model('InventoryItem', inventorySchema);


