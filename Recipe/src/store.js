const { connectToDatabase } = require('./lib/db');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const InventoryItem = require('./models/InventoryItem');
const seed = require('./seed');

async function ensureConnection() {
  await connectToDatabase();
}

async function seedDatabase() {
  await ensureConnection();

  const userCount = await User.estimatedDocumentCount();
  if (userCount === 0) {
    await User.insertMany(seed.USERS);
  }

  const recipeCount = await Recipe.estimatedDocumentCount();
  if (recipeCount === 0) {
    await Recipe.insertMany(seed.RECIPE_SEED);
  }

  const inventoryCount = await InventoryItem.estimatedDocumentCount();
  if (inventoryCount === 0) {
    await InventoryItem.insertMany(seed.INVENTORY_SEED);
  }
}

async function getAllRecipes() {
  await ensureConnection();
  return Recipe.find().sort({ createdDate: -1 }).lean();
}

async function getRecipeByRecipeId(recipeId) {
  await ensureConnection();
  return Recipe.findOne({ recipeId }).lean();
}

async function createRecipe(data) {
  await ensureConnection();
  const recipe = new Recipe(data);
  const saved = await recipe.save();
  return saved.toObject();
}

async function updateRecipe(recipeId, patch) {
  await ensureConnection();
  return Recipe.findOneAndUpdate({ recipeId }, patch, { new: true, runValidators: true }).lean();
}

async function deleteRecipe(recipeId) {
  await ensureConnection();
  return Recipe.deleteOne({ recipeId });
}

async function getAllInventory() {
  await ensureConnection();
  return InventoryItem.find().sort({ createdDate: -1 }).lean();
}

async function getInventoryItemById(inventoryId) {
  await ensureConnection();
  return InventoryItem.findOne({ inventoryId }).lean();
}

async function createInventoryItem(data) {
  await ensureConnection();
  const item = new InventoryItem(data);
  const saved = await item.save();
  return saved.toObject();
}

async function updateInventoryItem(inventoryId, patch) {
  await ensureConnection();
  return InventoryItem.findOneAndUpdate({ inventoryId }, patch, { new: true, runValidators: true }).lean();
}

async function deleteInventoryItem(inventoryId) {
  await ensureConnection();
  return InventoryItem.deleteOne({ inventoryId });
}

async function adjustInventoryQuantity(inventoryId, diff) {
  await ensureConnection();
  const doc = await InventoryItem.findOne({ inventoryId });
  if (!doc) {
    return null;
  }
  const newQuantity = doc.quantity + diff;
  if (newQuantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  doc.quantity = newQuantity;
  const saved = await doc.save();
  return saved.toObject();
}

async function setInventoryQuantity(inventoryId, amount) {
  await ensureConnection();
  const doc = await InventoryItem.findOne({ inventoryId });
  if (!doc) {
    return null;
  }
  if (amount < 0) {
    throw new Error('Quantity cannot be negative');
  }
  doc.quantity = amount;
  const saved = await doc.save();
  return saved.toObject();
}

async function getDashboardStats() {
  await ensureConnection();
  const [recipeCount, inventoryCount, cuisineInfo, inventoryValue] = await Promise.all([
    Recipe.countDocuments({}),
    InventoryItem.countDocuments({}),
    Recipe.distinct('cuisineType'),
    InventoryItem.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ])
  ]);

  const totalValue = inventoryValue.length ? inventoryValue[0].total : 0;

  return {
    recipeCount,
    inventoryCount,
    cuisineCount: cuisineInfo.length,
    inventoryValue: totalValue
  };
}

module.exports = {
  seedDatabase,
  getAllRecipes,
  getRecipeByRecipeId,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getAllInventory,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  setInventoryQuantity,
  getDashboardStats
};


