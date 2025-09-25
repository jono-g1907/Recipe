// Helpers that keep authentication logic separate from the route handlers.
const { buildLoginRedirectUrl, resolveActiveUser } = require('../../lib/auth');
// Remove any unexpected characters from user-supplied text before it hits the templates.
const { sanitiseString } = require('../../lib/utils');
// Permission helpers make the role checks easier to read.
const { userCanAccessRecipes, userCanAccessInventory } = require('../../lib/permissions');
// Collections of valid select options shared between the server and templates.
const {
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS
} = require('../../lib/validationConstants');

function registerDashboardRoutes(app, dependencies) {
  // Pull the data store and appId out of the dependency object so the routes can use them.
  const store = dependencies.store;
  const appId = dependencies.appId;

  // Visiting the bare domain just redirects people to the login page for their instance.
  app.get('/', function (req, res) {
    res.redirect(302, '/login-' + appId);
  });

  // Main dashboard page shown after login.
  app.get('/home-' + appId, async function (req, res, next) {
    try {
      // Confirm the user is logged in and grab their account details.
      const result = await resolveActiveUser(req, store);
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      // Gather stats from the store to display on the dashboard.
      const stats = await store.getDashboardStats();
      const successMessage = req.query && req.query.success === '1'
        ? 'Login successful. Your account details are now loaded for new submissions.'
        : sanitiseString(req.query && req.query.successMessage);
      const errorMessage = sanitiseString(req.query && req.query.errorMessage);

      // These flags help the template decide which sections to show based on the user's role.
      const canManageRecipes = userCanAccessRecipes(user);
      const canManageInventory = userCanAccessInventory(user);
      const canViewAnalytics = String(user.role).toLowerCase() === 'admin';

      let myRecipes = [];
      let recipeSuggestions = [];
      if (canManageRecipes) {
        // Load the user's own recipes and some auto-generated suggestions at the same time.
        const [mine, suggestions] = await Promise.all([
          store.getRecipesByOwner(user.userId, { limit: 5 }),
          store.getInventoryBasedSuggestions(3)
        ]);
        myRecipes = mine;
        recipeSuggestions = suggestions;
      }

      let sharedInventory = [];
      if (canManageInventory) {
        // Inventory managers see a snapshot of recently updated items.
        sharedInventory = await store.getSharedInventorySnapshot(5);
      }

      res.render('index.html', {
        username: user.fullname,
        email: sanitiseString(user.email),
        id: user.userId,
        role: user.role,
        totalRecipes: stats.recipeCount,
        totalInventory: stats.inventoryCount,
        userCount: stats.userCount,
        cuisineCount: stats.cuisineCount,
        inventoryValue: Number(stats.inventoryValue || 0),
        canManageRecipes: canManageRecipes,
        canManageInventory: canManageInventory,
        myRecipes: myRecipes,
        sharedInventory: sharedInventory,
        recipeSuggestions: recipeSuggestions,
        successMessage: successMessage || '',
        errorMessage: errorMessage || '',
        appId: appId,
        canViewAnalytics: canViewAnalytics
      });
    } catch (err) {
      next(err);
    }
  });

  // "HD task 1" page shows advanced recommendations for chefs.
  app.get('/hd-task1-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const insights = await store.getSmartRecipeDashboardData({});
      const canViewAnalytics = String(user.role).toLowerCase() === 'admin';

      res.render('hd-task1-31477046.html', {
        appId: appId,
        userId: user.userId,
        username: user.fullname,
        email: sanitiseString(user.email),
        recommendations: (insights && insights.recommendations) || [],
        latestRecipes: (insights && insights.latestRecipes) || [],
        expiringSoon: (insights && insights.expiringSoon) || [],
        lowStock: (insights && insights.lowStock) || [],
        popularity: (insights && insights.popularity) || [],
        canViewAnalytics: canViewAnalytics,
        canManageRecipes: true
      });
    } catch (err) {
      next(err);
    }
  });

  // "HD task 2" page provides analytics reserved for admins.
  app.get('/hd-task2-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const query = req.query || {};

      const rawCuisine = sanitiseString(query.cuisine);
      const rawDifficulty = sanitiseString(query.difficulty);
      const rawMealType = sanitiseString(query.mealType);
      const searchTerm = sanitiseString(query.search);
      const chefName = sanitiseString(query.chef);

      // Only keep filter values that appear in our predefined lists.
      const selectedCuisine = CUISINE_TYPE_OPTIONS.indexOf(rawCuisine) !== -1 ? rawCuisine : '';
      const selectedDifficulty = DIFFICULTY_OPTIONS.indexOf(rawDifficulty) !== -1 ? rawDifficulty : '';
      const selectedMealType = MEAL_TYPE_OPTIONS.indexOf(rawMealType) !== -1 ? rawMealType : '';

      const maxPrepRaw = parseInt(query.maxPrep, 10);
      const maxPrepMinutes = Number.isFinite(maxPrepRaw) && maxPrepRaw > 0 ? maxPrepRaw : null;

      // Ask the store to build the analytics dashboard data set using the filters.
      const analytics = await store.getAdvancedAnalyticsDashboard({
        filterCuisine: selectedCuisine,
        filterDifficulty: selectedDifficulty,
        filterMealType: selectedMealType,
        maxPrepMinutes: maxPrepMinutes,
        searchTerm: searchTerm,
        chefName: chefName,
        minCoverage: 90
      });

      res.render('hd-task2-31477046.html', {
        appId: appId,
        userId: user.userId,
        username: user.fullname,
        email: sanitiseString(user.email),
        role: user.role,
        canViewAnalytics: true,
        canManageRecipes: false,
        cuisineOptions: CUISINE_TYPE_OPTIONS,
        difficultyOptions: DIFFICULTY_OPTIONS,
        mealTypeOptions: MEAL_TYPE_OPTIONS,
        performance: analytics.performance,
        difficultySummary: analytics.difficultySummary,
        topRecipes: analytics.topRecipes,
        ingredientUsage: analytics.ingredientUsage,
        chefInsights: analytics.chefInsights,
        seasonalTrends: analytics.seasonalTrends,
        costReports: analytics.costReports,
        recommendations: analytics.recommendations,
        filters: analytics.appliedFilters,
        filteredRecipes: analytics.filteredRecipes
      });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = registerDashboardRoutes;
