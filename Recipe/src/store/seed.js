// Utility responsible for seeding the database with initial content. It checks
// whether collections are empty before inserting so we can safely run it
// multiple times during development workshops.
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const InventoryItem = require('../models/InventoryItem');
const seedData = require('../seed');
const { ensureConnection } = require('./base');

async function seedDatabase() {
  await ensureConnection();

  const userCount = await User.estimatedDocumentCount();
  if (userCount === 0) {
    // Insert the predefined users first so recipes/inventory can reference
    // their `_id` values.
    await User.insertMany(seedData.USERS);
  }

  const userDocs = await User.find({}, { _id: 1, userId: 1 }).lean();
  const userMap = {};
  for (let i = 0; i < userDocs.length; i++) {
    const entry = userDocs[i];
    if (entry && entry.userId) {
      userMap[entry.userId] = entry._id;
    }
  }

  const recipeCount = await Recipe.estimatedDocumentCount();
  if (recipeCount === 0) {
    const recipeSeed = seedData.RECIPE_SEED.map(function (recipe) {
      const ownerId = userMap[recipe.userId];
      // Embed the Mongo reference where possible so population works.
      return Object.assign({}, recipe, ownerId ? { user: ownerId } : {});
    });
    await Recipe.insertMany(recipeSeed);
  }

  const inventoryCount = await InventoryItem.estimatedDocumentCount();
  if (inventoryCount === 0) {
    const inventorySeed = seedData.INVENTORY_SEED.map(function (item) {
      const ownerId = userMap[item.userId];
      // Same approach for the inventory collection.
      return Object.assign({}, item, ownerId ? { user: ownerId } : {});
    });
    await InventoryItem.insertMany(inventorySeed);
  }
}

module.exports = {
  seedDatabase
};
