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

async function getNextUserId() {
  await ensureConnection();
  const lastUser = await User.findOne().sort({ userId: -1 }).lean();
  if (!lastUser || !lastUser.userId) {
    return 'U-00001';
  }
  const parts = String(lastUser.userId).split('-');
  const number = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
  const nextNumber = Number.isFinite(number) ? number + 1 : 1;
  return 'U-' + String(nextNumber).padStart(5, '0');
}

async function getUserByEmail(email) {
  await ensureConnection();
  const normalised = (email || '').toLowerCase();
  return User.findOne({ email: normalised }).lean();
}

async function getUserByUserId(userId) {
  await ensureConnection();
  return User.findOne({ userId }).lean();
}

async function setUserLoginState(userId, state) {
  await ensureConnection();
  return User.findOneAndUpdate({ userId }, { isLoggedIn: state }, { new: true }).lean();
}

async function createUser(data) {
  await ensureConnection();
  const payload = Object.assign({}, data);
  if (!payload.userId) {
    payload.userId = await getNextUserId();
  }
  if (payload.email) {
    payload.email = String(payload.email).toLowerCase();
  }
  const user = new User(payload);
  const saved = await user.save();
  return saved.toObject();
}

async function getAllRecipes() {
  await ensureConnection();
  return Recipe.find(
    {},
    'recipeId userId title mealType cuisineType prepTime difficulty servings chef createdDate ingredients instructions'
  )
    .sort({ createdDate: -1, recipeId: 1 })
    .lean();
}

async function getRecipeByRecipeId(recipeId) {
  await ensureConnection();
  return Recipe.findOne({ recipeId }).lean();
}

async function getRecipeByTitleForUser(userId, title) {
  await ensureConnection();
  const normalisedUserId = (userId || '').trim().toUpperCase();
  const normalisedTitle = (title || '').trim();
  if (!normalisedUserId || !normalisedTitle) {
    return null;
  }
  return Recipe.findOne({ userId: normalisedUserId, title: normalisedTitle }).lean();
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

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const deletedRecipe = await Recipe.findOneAndDelete({ recipeId: normalisedId }).lean();
  return deletedRecipe || null;
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
  const [recipeCount, inventoryCount, userCount, cuisineInfo, inventoryTotals] = await Promise.all([
    Recipe.countDocuments({}),
    InventoryItem.countDocuments({}),
    User.countDocuments({}),
    Recipe.distinct('cuisineType'),
    InventoryItem.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ])
  ]);

  const totalValue = inventoryTotals.length && inventoryTotals[0].total ? Number(inventoryTotals[0].total) : 0;

  return {
    recipeCount,
    inventoryCount,
    userCount,
    cuisineCount: cuisineInfo.length,
    inventoryValue: totalValue
  };
}

module.exports = {
  seedDatabase,
  getNextUserId,
  getUserByEmail,
  getUserByUserId,
  setUserLoginState,
  createUser,
  getAllRecipes,
  getRecipeByRecipeId,
  getRecipeByTitleForUser,
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