const mongoose = require('mongoose');
// User model to make sure each recipe belongs to a valid user
const User = require('./User');

// regex constants for exact format each string must follow
// e.g. R-12345
const RECIPE_ID_REGEX = /^R-\d{5}$/; 
// matches the user id format used everywhere else
const USER_ID_REGEX = /^U-\d{5}$/; 
// allow letters, numbers, spaces, apostrophes, parentheses and hyphens
const TITLE_REGEX = /^[A-Za-z0-9\s'\-\(\)]{3,100}$/;
// chef name is simple text
const CHEF_REGEX = /^[A-Za-z\s'\-]{2,50}$/; 
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
// allowed values for a field
const CUISINE_OPTIONS = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

// reusable validator to never store a future date
function notInFuture(value) {
  if (!value) return false;
  const now = new Date();
  return value.getTime() <= now.getTime();
}

// sub schema for a single ingredient entry within a recipe
const ingredientSchema = new mongoose.Schema({
  // basic name for the ingredient
  ingredientName: {
    type: String,
    required: true,
    trim: true,
    match: INGREDIENT_NAME_REGEX
  },
  // amount of the ingredient used
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    max: 9999
  },
  // unit of measurement, limited to the UNITS array
  unit: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: UNITS
  }
}, { _id: false });

// main schema blueprint for recipe documents stored in MongoDB
const recipeSchema = new mongoose.Schema({
  // publicid exposed in the UI/API
  recipeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: RECIPE_ID_REGEX
  },
  // store the user's public id in addition to the ObjectId reference
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
  // reference to the User collection
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // display title of the recipe
  title: {
    type: String,
    required: true,
    trim: true,
    match: TITLE_REGEX
  },
  // name of the person who created the recipe
  chef: {
    type: String,
    required: true,
    trim: true,
    match: CHEF_REGEX
  },
  // recipe ingredient list using the sub schema above
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
  // step-by-step instructions as an array of strings
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
  // type of meal the recipe is best suited for
  mealType: {
    type: String,
    required: true,
    enum: MEAL_TYPES
  },
  // region or style of cooking
  cuisineType: {
    type: String,
    required: true,
    enum: CUISINE_OPTIONS
  },
  // preparation time in minutes
  prepTime: {
    type: Number,
    required: true,
    min: 1,
    max: 480
  },
  // simple difficulty rating chosen from the DIFFICULTIES array
  difficulty: {
    type: String,
    required: true,
    enum: DIFFICULTIES
  },
  // number of servings the recipe makes
  servings: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  // when the recipe was created in the system
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
  // timestamp Mongo sets when the document is inserted
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  // timestamp we update every time the document changes
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});

// indexes for faster searches and to prevent duplicate titles per user
recipeSchema.index({ userId: 1, title: 1 }, { unique: true });
recipeSchema.index({ recipeId: 1 });
recipeSchema.index({ userId: 1 });

// update the updatedAt timestamp every time the document is saved
recipeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);