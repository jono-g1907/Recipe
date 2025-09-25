// Each file exports a function that registers a set of related pages on the Express app.
const registerAuthRoutes = require('./authRoutes');
const registerDashboardRoutes = require('./dashboardRoutes');
const registerRecipeRoutes = require('./recipeRoutes');
const registerInventoryRoutes = require('./inventoryRoutes');

function registerPageRoutes(app, dependencies) {
  // The order is not critical here, but keeping it grouped makes it easier to reason about.
  registerDashboardRoutes(app, dependencies);
  registerAuthRoutes(app, dependencies);
  registerRecipeRoutes(app, dependencies);
  registerInventoryRoutes(app, dependencies);
}

module.exports = registerPageRoutes;
