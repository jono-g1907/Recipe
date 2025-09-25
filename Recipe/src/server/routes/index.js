const registerAuthRoutes = require('./authRoutes');
const registerDashboardRoutes = require('./dashboardRoutes');
const registerRecipeRoutes = require('./recipeRoutes');
const registerInventoryRoutes = require('./inventoryRoutes');

function registerPageRoutes(app, dependencies) {
  registerDashboardRoutes(app, dependencies);
  registerAuthRoutes(app, dependencies);
  registerRecipeRoutes(app, dependencies);
  registerInventoryRoutes(app, dependencies);
}

module.exports = registerPageRoutes;
