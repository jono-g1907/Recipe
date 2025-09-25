const mongoose = require('mongoose');
const User = require('./User');

const INVENTORY_ID_REGEX = /^I-\d{5}$/;
const USER_ID_REGEX = /^U-\d{5}$/;
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
const LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

function notInFuture(value) {
  if (!value) return false;
  const now = new Date();
  return value.getTime() <= now.getTime();
}

function isAfter(a, b) {
  if (!a || !b) return false;
  return a.getTime() > b.getTime();
}

function costValidator(value) {
  if (typeof value !== 'number') return false;
  if (value < 0.01 || value > 999.99) return false;
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 1e-6;
}

const inventorySchema = new mongoose.Schema({
  inventoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: INVENTORY_ID_REGEX
  },
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ingredientName: {
    type: String,
    required: true,
    trim: true,
    match: INGREDIENT_NAME_REGEX
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    max: 9999
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    lowercase: false,
    enum: UNITS
  },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES
  },
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
  location: {
    type: String,
    required: true,
    enum: LOCATIONS
  },
  cost: {
    type: Number,
    required: true,
    validate: {
      validator: costValidator,
      message: 'Cost must be between 0.01 and 999.99 with up to 2 decimals.'
    }
  },
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
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});


inventorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

inventorySchema.index({ inventoryId: 1 });
inventorySchema.index({ userId: 1 });

module.exports = mongoose.model('InventoryItem', inventorySchema);


