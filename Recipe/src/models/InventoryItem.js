const mongoose = require('mongoose');
// user model to double check inventory item is always tied to valid user
const User = require('./User');

// make it easy to see valid shapes for data
// e.g. I-12345
const INVENTORY_ID_REGEX = /^I-\d{5}$/;
// e.g. U-12345 
const USER_ID_REGEX = /^U-\d{5}$/;
// allow letters, spaces, apostrophes, and hyphens
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
const LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

// helper validator that ensures a date value is today or earlier
function notInFuture(value) {
  if (!value) return false;
  const now = new Date();
  return value.getTime() <= now.getTime();
}

// helper validator that ensures date a comes after date b
function isAfter(a, b) {
  if (!a || !b) return false;
  return a.getTime() > b.getTime();
}

// custom validator that enforces two decimal places and a reasonable cost
function costValidator(value) {
  if (typeof value !== 'number') return false;
  if (value < 0.01 || value > 999.99) return false;
  // multiply by 100, round, then compare to original to make sure we only have up to two digits after the decimal point
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 1e-6;
}

// inventory item schema
const inventorySchema = new mongoose.Schema({
  // public identifier shown to the user. e.g. I-00042
  inventoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: INVENTORY_ID_REGEX
  },
  // store the user's public id alongside the Mongo ObjectId
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
  // user is the actual reference to the User collection
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // name of the ingredient this record is tracking
  ingredientName: {
    type: String,
    required: true,
    trim: true,
    match: INGREDIENT_NAME_REGEX
  },
  // how much of the ingredient we have on hand
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    max: 9999
  },
  // unit of measurement (must match the UNITS array above)
  unit: {
    type: String,
    required: true,
    trim: true,
    lowercase: false,
    enum: UNITS
  },
  // broad category to make filtering and reporting easier
  category: {
    type: String,
    required: true,
    enum: CATEGORIES
  },
  // when item was bought. cannot be in the future
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
  // when the ingredient goes bad. must come after the purchase date
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
  // where in the kitchen westore the ingredient
  location: {
    type: String,
    required: true,
    enum: LOCATIONS
  },
  // price paid. uses the costValidator to enforce reasonable values
  cost: {
    type: Number,
    required: true,
    validate: {
      validator: costValidator,
      message: 'Cost must be between 0.01 and 999.99 with up to 2 decimals.'
    }
  },
  // when this record was originally created in the business system
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
  // mongo timestamps, when the document was inserted
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  // updated each time we save
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});


// hooks run before or after mongoose operations
// update the updatedAt timestamp every time the document is saved
inventorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// indexes speed up lookups by inventoryId and userId
inventorySchema.index({ inventoryId: 1 });
inventorySchema.index({ userId: 1 });

module.exports = mongoose.model('InventoryItem', inventorySchema);