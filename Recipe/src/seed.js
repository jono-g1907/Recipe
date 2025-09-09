const enums = require('./enums');
const { APP_ID, AUTHOR_NAME } = require('./lib/constants');

const { Location, MealType, Difficulty } = enums;

// user id
const ME = AUTHOR_NAME.replace(/\s+/g, '') + '-' + APP_ID;

// INVENTORY
const INVENTORY_SEED = [
  {
    inventoryId: 'I-31477046-001',
    userId: ME,
    ingredientName: 'Rolled Oats',
    quantity: 1.0,
    unit: 'kg',
    category: 'Grains',
    purchaseDate: '2025-08-30',
    expirationDate: '2026-08-30',
    location: Location.PANTRY,
    cost: 4.5,
    createdDate: '2025-08-30'
  },
  {
    inventoryId: 'I-31477046-002',
    userId: ME,
    ingredientName: 'Milk',
    quantity: 2.0,
    unit: 'L',
    category: 'Dairy',
    purchaseDate: '2025-09-01',
    expirationDate: '2025-09-10',
    location: Location.FRIDGE,
    cost: 3.2,
    createdDate: '2025-09-01'
  }
];

// RECIPES
const RECIPE_SEED = [
  {
    recipeId: 'R-31477046-001',
    title: 'Protein Oats (Microwave)',
    ingredients: [
      { ingredientName: 'Rolled Oats', quantity: 60, unit: 'g' },
      { ingredientName: 'Milk', quantity: 250, unit: 'ml' },
      { ingredientName: 'Whey Protein', quantity: 30, unit: 'g' }
    ],
    instructions: [
      'Add oats and milk to a microwave-safe bowl.',
      'Microwave 2–3 minutes, stirring halfway.',
      'Stir in whey protein until smooth and serve.'
    ],
    mealType: MealType.BREAKFAST,
    cuisineType: 'International',
    prepTime: 7,
    difficulty: Difficulty.EASY,
    servings: 1,
    chef: ME,
    createdDate: '2025-09-01'
  },
  {
    recipeId: 'R-00003',
    title: 'Classic Spaghetti Carbonara',
    ingredients: [
      { ingredientName: 'Spaghetti', quantity: 400, unit: 'g' },
      { ingredientName: 'Pancetta', quantity: 200, unit: 'g' },
      { ingredientName: 'Eggs', quantity: 4, unit: 'pieces' },
      { ingredientName: 'Pecorino Romano', quantity: 100, unit: 'g' },
      { ingredientName: 'Black Pepper', quantity: 2, unit: 'tsp' }
    ],
    instructions: [
      'Boil salted water and cook spaghetti al dente.',
      'Crisp pancetta in a pan; set aside.',
      'Whisk eggs with cheese.',
      'Combine hot pasta and pancetta; fold in egg mixture off heat.'
    ],
    mealType: MealType.DINNER,
    cuisineType: 'Italian',
    prepTime: 25,
    difficulty: Difficulty.MEDIUM,
    servings: 4,
    chef: 'MarioRossi-87654321',
    createdDate: '2025-07-20'
  }
];

module.exports = { ME: ME, INVENTORY_SEED: INVENTORY_SEED, RECIPE_SEED: RECIPE_SEED };