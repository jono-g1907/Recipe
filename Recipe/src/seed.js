const enums = require('./enums');
const { APP_ID, AUTHOR_NAME } = require('./lib/constants');

const { Location, MealType, Difficulty } = enums;

const DEFAULT_USER_ID = 'U-00001';
const SECOND_USER_ID = 'U-00002';

const USERS = [
  {
    userId: DEFAULT_USER_ID,
    email: 'jonathan.gan@example.com',
    password: 'Password1!',
    fullname: AUTHOR_NAME,
    role: 'chef',
    phone: '+61-400-314-770',
    isLoggedIn: false,
    createdAt: '2024-05-10'
  },
  {
    userId: SECOND_USER_ID,
    email: 'mario.rossi@example.com',
    password: 'Password1!',
    fullname: 'Mario Rossi',
    role: 'chef',
    phone: '+39-347-555-0111',
    isLoggedIn: false,
    createdAt: '2024-05-12'
  }
];

const INVENTORY_SEED = [
  {
    inventoryId: 'I-00001',
    userId: DEFAULT_USER_ID,
    ingredientName: 'Rolled Oats',
    quantity: 1.0,
    unit: 'kg',
    category: 'Grains',
    purchaseDate: '2024-08-30',
    expirationDate: '2025-08-30',
    location: 'Pantry',
    cost: 4.5,
    createdDate: '2024-08-30'
  },
  {
    inventoryId: 'I-00002',
    userId: DEFAULT_USER_ID,
    ingredientName: 'Milk',
    quantity: 2.0,
    unit: 'liters',
    category: 'Dairy',
    purchaseDate: '2024-09-01',
    expirationDate: '2024-09-10',
    location: 'Fridge',
    cost: 3.2,
    createdDate: '2024-09-01'
  }
];

const RECIPE_SEED = [
  {
    recipeId: 'R-00001',
    userId: DEFAULT_USER_ID,
    title: 'Protein Oats (Microwave)',
    ingredients: [
      { ingredientName: 'Rolled Oats', quantity: 60, unit: 'g' },
      { ingredientName: 'Milk', quantity: 250, unit: 'ml' },
      { ingredientName: 'Whey Protein', quantity: 30, unit: 'g' }
    ],
    instructions: [
      'Add oats and milk to a microwave safe bowl and stir once.',
      'Microwave for 2 and a half minutes, stirring halfway through.',
      'Stir in whey protein until smooth and serve immediately.'
    ],
    mealType: MealType.BREAKFAST,
    cuisineType: 'Other',
    prepTime: 7,
    difficulty: Difficulty.EASY,
    servings: 1,
    chef: AUTHOR_NAME,
    createdDate: '2024-09-01'
  },
  {
    recipeId: 'R-00002',
    userId: SECOND_USER_ID,
    title: 'Classic Spaghetti Carbonara',
    ingredients: [
      { ingredientName: 'Spaghetti', quantity: 400, unit: 'g' },
      { ingredientName: 'Pancetta', quantity: 200, unit: 'g' },
      { ingredientName: 'Eggs', quantity: 4, unit: 'pieces' },
      { ingredientName: 'Pecorino Romano', quantity: 100, unit: 'g' },
      { ingredientName: 'Black Pepper', quantity: 2, unit: 'tsp' }
    ],
    instructions: [
      'Boil a large pot of salted water then cook spaghetti until al dente.',
      'Crisp the pancetta in a skillet and set it aside while leaving the fat.',
      'Whisk eggs with the cheese until creamy and season with pepper.',
      'Combine hot pasta, pancetta, and egg mixture off the heat for a silky sauce.'
    ],
    mealType: MealType.DINNER,
    cuisineType: 'Italian',
    prepTime: 25,
    difficulty: Difficulty.MEDIUM,
    servings: 4,
    chef: 'Mario Rossi',
    createdDate: '2024-07-20'
  }
];

module.exports = {
  USERS,
  INVENTORY_SEED,
  RECIPE_SEED,
  DEFAULT_USER_ID,
  SECOND_USER_ID
};

