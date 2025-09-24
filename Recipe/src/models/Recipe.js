const mongoose = require('mongoose');
const User = require('./User');

const RECIPE_ID_REGEX = /^R-\d{5}$/;
const USER_ID_REGEX = /^U-\d{5}$/;
const TITLE_REGEX = /^[A-Za-z0-9\s'\-\(\)]{3,100}$/;
const CHEF_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
const CUISINE_OPTIONS = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

function notInFuture(value) {
  if (!value) return false;
  const now = new Date();
  return value.getTime() <= now.getTime();
}

const ingredientSchema = new mongoose.Schema({
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
    lowercase: true,
    enum: UNITS
  }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  recipeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: RECIPE_ID_REGEX
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
      message: 'User Id must exist before creating a recipe.'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    match: TITLE_REGEX
  },
  chef: {
    type: String,
    required: true,
    trim: true,
    match: CHEF_REGEX
  },
  ingredients: {
    type: [ingredientSchema],
    required: true,
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length >= 1 && value.length <= 20;
      },
      message: 'Ingredients must contain between 1 and 20 items.'
    }
  },
  instructions: {
    type: [String],
    required: true,
    validate: {
      validator: function (value) {
        if (!Array.isArray(value)) return false;
        if (value.length < 1 || value.length > 15) return false;
        for (let i = 0; i < value.length; i++) {
          const step = (value[i] || '').trim();
          if (step.length < 10 || step.length > 500) return false;
        }
        return true;
      },
      message: 'Instructions must contain 1 to 15 steps and each step should be 10-500 characters.'
    }
  },
  mealType: {
    type: String,
    required: true,
    enum: MEAL_TYPES
  },
  cuisineType: {
    type: String,
    required: true,
    enum: CUISINE_OPTIONS
  },
  prepTime: {
    type: Number,
    required: true,
    min: 1,
    max: 480
  },
  difficulty: {
    type: String,
    required: true,
    enum: DIFFICULTIES
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    max: 20
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

recipeSchema.index({ userId: 1, title: 1 }, { unique: true });

recipeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);



