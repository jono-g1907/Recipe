const  constants = require('./src/lib/constants');
const  enums = require('./src/enums');
const  ValidationError = require('./src/errors/ValidationError');
const  Recipe = require('./src/models/Recipe');
const  InventoryItem = require('./src/models/InventoryItem');
const  User = require('./src/models/User');
const  seed = require('./src/seed');

const  APP_ID = constants.APP_ID;
const  AUTHOR_NAME = constants.AUTHOR_NAME;
const  Difficulty = enums.Difficulty;
const  MealType = enums.MealType;
const  Location = enums.Location;
const InventoryCategory = enums.InventoryCategory;
const Unit = enums.Unit;
const CuisineType = enums.CuisineType;

// seed for previous behaviour
const { USERS, INVENTORY_SEED, RECIPE_SEED, DEFAULT_USER_ID, SECOND_USER_ID } = seed;

module.exports = {
  APP_ID,
  AUTHOR_NAME,
  Difficulty,
  MealType,
  Location,
  InventoryCategory,
  Unit,
  CuisineType,
  Recipe,
  InventoryItem,
  User,
  ValidationError,
  SEEDS: {
    USERS,
    INVENTORY_SEED,
    RECIPE_SEED,
    DEFAULT_USER_ID,
    SECOND_USER_ID
  }
};

if (require.main === module) {
  const lib = module.exports;

  console.log('Seed Users');
  console.log(lib.SEEDS.USERS);

  console.log('\nSeeded Recipes');
  console.log(lib.SEEDS.RECIPE_SEED);

  console.log('\nInventory');
  console.log(lib.SEEDS.INVENTORY_SEED);
}