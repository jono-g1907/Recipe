const seed = require('./seed');
const users = require('./users');
const recipes = require('./recipes');
const inventory = require('./inventory');
const analytics = require('./analytics');

module.exports = {
  seedDatabase: seed.seedDatabase,
  getNextUserId: users.getNextUserId,
  getUserByEmail: users.getUserByEmail,
  getUserByUserId: users.getUserByUserId,
  setUserLoginState: users.setUserLoginState,
  createUser: users.createUser,
  getAllRecipes: recipes.getAllRecipes,
  getRecipeByRecipeId: recipes.getRecipeByRecipeId,
  getRecipeByTitleForUser: recipes.getRecipeByTitleForUser,
  getRecipesByOwner: recipes.getRecipesByOwner,
  createRecipe: recipes.createRecipe,
  updateRecipe: recipes.updateRecipe,
  deleteRecipe: recipes.deleteRecipe,
  listInventory: inventory.listInventory,
  getAllInventory: inventory.getAllInventory,
  getInventoryItemById: inventory.getInventoryItemById,
  createInventoryItem: inventory.createInventoryItem,
  updateInventoryItem: inventory.updateInventoryItem,
  deleteInventoryItem: inventory.deleteInventoryItem,
  adjustInventoryQuantity: inventory.adjustInventoryQuantity,
  setInventoryQuantity: inventory.setInventoryQuantity,
  findExpiringInventory: inventory.findExpiringInventory,
  findLowStockInventory: inventory.findLowStockInventory,
  calculateInventoryValue: inventory.calculateInventoryValue,
  getDashboardStats: analytics.getDashboardStats,
  getSmartRecipeDashboardData: analytics.getSmartRecipeDashboardData,
  getAdvancedAnalyticsDashboard: analytics.getAdvancedAnalyticsDashboard,
  getSharedInventorySnapshot: inventory.getSharedInventorySnapshot,
  getInventoryBasedSuggestions: analytics.getInventoryBasedSuggestions
};