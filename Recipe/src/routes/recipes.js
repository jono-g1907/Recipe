// Routes that deal with recipe creation, listing, and management. The extra
// comments here are intended to help a newer engineer quickly recall how each
// helper fits into the bigger Express + permissions flow.
const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;
const store = require('../store');
const ValidationError = require('../errors/ValidationError');
const { userCanAccessRecipes, userCanModifyRecipe, userCanViewRecipe } = require('../lib/permissions');

// Route patterns. Centralising them ensures the APP_ID suffix stays in sync
// everywhere it is referenced.
const CREATE_PATH = '/add-recipe-' + APP_ID;
const LIST_PATH = '/recipes-list-' + APP_ID;
const GET_ONE_PATH = '/recipes/:recipeId-' + APP_ID;
const UPDATE_PATH = '/recipes/:recipeId/update-' + APP_ID;
const DELETE_PATH = '/recipes/:recipeId-' + APP_ID;

// Option lists that double as validation references and UI dropdown values.
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const CUISINE_TYPES = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const UNIT_OPTIONS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

// Pull the user identifier from any supported request location (query, body,
// or header) so that every endpoint can share the same auth logic.
function getUserIdFromRequest(req) {
  const queryId = req && req.query && req.query.userId;
  const bodyId = req && req.body && req.body.userId;
  const headerId = req && req.headers && req.headers['x-user-id'];
  const candidate = headerId || queryId || bodyId || '';
  return candidate ? String(candidate).trim().toUpperCase() : '';
}

// Validate that the user exists and is currently logged in before proceeding.
async function resolveApiUser(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return { status: 401, message: 'User authentication is required.' };
  }

  const user = await store.getUserByUserId(userId);
  if (!user || !user.isLoggedIn) {
    return { status: 401, message: 'Invalid or expired session. Please log in again.' };
  }

  return { user: user };
}

// Many data-layer errors come in different shapes. This helper converts them
// into our custom ValidationError so the error handler can show friendly text.
function normaliseError(err) {
  if (!err) return err;

  if (err instanceof ValidationError) {
    return err;
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = [];
    for (const key in err.errors) {
      if (Object.prototype.hasOwnProperty.call(err.errors, key)) {
        messages.push(err.errors[key].message);
      }
    }
    return new ValidationError(messages);
  }

  if (err.code === 11000) {
    const details = [];
    if (err.keyValue) {
      for (const key in err.keyValue) {
        if (Object.prototype.hasOwnProperty.call(err.keyValue, key)) {
          details.push(key + ' already exists');
        }
      }
    }
    if (!details.length) {
      details.push('Duplicate value not allowed');
    }
    return new ValidationError(details);
  }

  return err;
}

// Pick the canonical casing for dropdown-style strings (e.g. "lunch" →
// "Lunch") to keep comparisons strict and prevent duplicate values.
function normaliseOption(value, options) {
  if (!value) return value;
  const trimmed = String(value).trim();
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() === trimmed.toLowerCase()) {
      return options[i];
    }
  }
  return trimmed;
}

// Convert the incoming request body into the shapes our store layer expects –
// trimming strings, converting numbers, and normalising arrays.
function coerceRecipePayload(body) {
  const out = Object.assign({}, body);
  if (out.recipeId !== undefined) out.recipeId = String(out.recipeId).trim().toUpperCase();
  if (out.userId !== undefined) out.userId = String(out.userId).trim().toUpperCase();
  if (out.title !== undefined) out.title = String(out.title).trim();
  if (out.chef !== undefined) out.chef = String(out.chef).trim();
  if (out.mealType !== undefined) out.mealType = normaliseOption(out.mealType, MEAL_TYPES);
  if (out.cuisineType !== undefined) out.cuisineType = normaliseOption(out.cuisineType, CUISINE_TYPES);
  if (out.difficulty !== undefined) out.difficulty = normaliseOption(out.difficulty, DIFFICULTY_OPTIONS);
  if (out.prepTime !== undefined) out.prepTime = Number(out.prepTime);
  if (out.servings !== undefined) out.servings = Number(out.servings);
  if (out.createdDate !== undefined) {
    const parsedDate = new Date(out.createdDate);
    if (!isNaN(parsedDate.getTime())) {
      out.createdDate = parsedDate;
    } else {
      out.createdDate = new Date();
    }
  }
  if (Array.isArray(out.instructions)) {
    out.instructions = out.instructions.map(function (step) {
      return typeof step === 'string' ? step.trim() : '';
    }).filter(function (step) { return step; });
  }
  if (Array.isArray(out.ingredients)) {
    out.ingredients = out.ingredients.map(function (item) {
      const ingredientName = item && item.ingredientName ? String(item.ingredientName).trim() : '';
      const quantity = item && item.quantity !== undefined ? Number(item.quantity) : NaN;
      let unit = item && item.unit ? String(item.unit).trim().toLowerCase() : '';
      unit = normaliseOption(unit, UNIT_OPTIONS).toLowerCase();
      return {
        ingredientName: ingredientName,
        quantity: quantity,
        unit: unit
      };
    });
  }
  return out;
}

// Create a recipe
router.post(CREATE_PATH, async function (req, res, next) {
  try {
    // Step 1: confirm that the request is tied to a logged-in user.
    const resolution = await resolveApiUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    // Only chefs have access to recipe endpoints.
    if (!userCanAccessRecipes(activeUser)) {
      return res.status(403).json({ error: 'Recipes are restricted to chef accounts.' });
    }

    // Normalise request body values before persisting them.
    const payload = coerceRecipePayload(req.body || {});
    if (!payload.createdDate) {
      payload.createdDate = new Date();
    }
    payload.userId = activeUser.userId;

    // Prevent duplicate titles for the same user to reduce confusion.
    if (payload.title) {
      const existingTitle = await store.getRecipeByTitleForUser(activeUser.userId, payload.title);
      if (existingTitle) {
        throw new ValidationError(['You already have a recipe with this title.']);
      }
    }

    // Delegate to the data layer and send a 201 Created response.
    const recipe = await store.createRecipe(payload);
    return res.status(201).json({ recipe });
  } catch (err) {
    return next(normaliseError(err));
  }
});

// List recipes
router.get(LIST_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveApiUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    // Listing is also restricted to chef accounts; front-of-house staff should
    // not see recipes.
    if (!userCanAccessRecipes(activeUser)) {
      return res.status(403).json({ error: 'Recipes are available to chefs only.' });
    }

    // `scope=mine` lets the UI request only the recipes the current chef owns;
    // otherwise we include public/shared recipes.
    const scope = typeof req.query.scope === 'string' ? req.query.scope.trim().toLowerCase() : '';
    let recipes = [];
    if (scope === 'mine') {
      recipes = await store.getRecipesByOwner(activeUser.userId, { includeChefInfo: true });
    } else {
      recipes = await store.getAllRecipes({ includeChefInfo: true });
    }

    return res.json({ recipes, page: 1, total: recipes.length });
  } catch (err) {
    return next(err);
  }
});

// Get single recipe
router.get(GET_ONE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveApiUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    if (!userCanAccessRecipes(activeUser)) {
      return res.status(403).json({ error: 'Recipes are available to chefs only.' });
    }

    const recipe = await store.getRecipeByRecipeId(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    // Chefs can see their own recipes and any recipe the permissions module
    // marks as viewable (e.g. shared with them).
    if (!userCanViewRecipe(activeUser, recipe)) {
      return res.status(403).json({ error: 'You do not have permission to view this recipe.' });
    }
    return res.json({ recipe });
  } catch (err) {
    return next(err);
  }
});

// Update recipe (partial)
router.post(UPDATE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveApiUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    if (!userCanAccessRecipes(activeUser)) {
      return res.status(403).json({ error: 'Recipes are restricted to chef accounts.' });
    }

    const existing = await store.getRecipeByRecipeId(req.params.recipeId);
    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Only the original author is permitted to edit.
    if (!userCanModifyRecipe(activeUser, existing)) {
      return res.status(403).json({ error: 'You can only update recipes that you created.' });
    }

    const patch = coerceRecipePayload(req.body || {});
    patch.userId = activeUser.userId;
    const updated = await store.updateRecipe(req.params.recipeId, patch, { userId: activeUser.userId });
    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.json({ recipe: updated });
  } catch (err) {
    return next(normaliseError(err));
  }
});

// Delete recipe
router.delete(DELETE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveApiUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    if (!userCanAccessRecipes(activeUser)) {
      return res.status(403).json({ error: 'Recipes are restricted to chef accounts.' });
    }

    const existing = await store.getRecipeByRecipeId(req.params.recipeId);
    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (!userCanModifyRecipe(activeUser, existing)) {
      return res.status(403).json({ error: 'You can only delete recipes that you created.' });
    }

    // Return 204 No Content to signal a successful deletion with no body.
    const deleted = await store.deleteRecipe(req.params.recipeId, { userId: activeUser.userId });
    if (!deleted) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
