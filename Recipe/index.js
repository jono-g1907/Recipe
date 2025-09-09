const  constants = require('./src/lib/constants');
const  enums = require('./src/enums');
const  ValidationError = require('./src/errors/ValidationError');
const  Recipe = require('./src/models/Recipe');
const  InventoryItem = require('./src/models/InventoryItem');
const  seed = require('./src/seed');

const  APP_ID = constants.APP_ID;
const  AUTHOR_NAME = constants.AUTHOR_NAME;
const  Difficulty = enums.Difficulty;
const  MealType = enums.MealType;
const  Location = enums.Location;

// seed for previous behaviour
const { ME, INVENTORY_SEED, RECIPE_SEED } = require('./src/seed');

module.exports = {
  APP_ID: APP_ID,
  AUTHOR_NAME: AUTHOR_NAME,
  Difficulty: Difficulty,
  MealType: MealType,
  Location: Location,
  Recipe: Recipe,
  InventoryItem: InventoryItem,
  DataStore: DataStore,
  ValidationError: ValidationError,
  SEEDS: {
    ME,
    INVENTORY_SEED,
    RECIPE_SEED
  }
};

if (require.main === module) {
    const lib = module.exports;
  
    console.log('Seeded Recipes');
    console.log(lib.SEEDS.RECIPE_SEED);
  
    console.log('\nInventory');
    console.log(lib.SEEDS.INVENTORY_SEED);
  }
  