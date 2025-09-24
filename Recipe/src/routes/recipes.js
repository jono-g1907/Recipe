const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;
const store = require('../store');
const ValidationError = require('../errors/ValidationError');

const CREATE_PATH = '/add-recipe-' + APP_ID;
const LIST_PATH = '/recipes-list-' + APP_ID;
const GET_ONE_PATH = '/recipes/:recipeId-' + APP_ID;
const UPDATE_PATH = '/recipes/:recipeId/update-' + APP_ID;
const DELETE_PATH = '/recipes/:recipeId-' + APP_ID;

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const CUISINE_TYPES = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const UNIT_OPTIONS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

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

function coerceRecipePayload(body) {
  const out = Object.assign({}, body);
  if (out.recipeId !== undefined) out.recipeId = String(out.recipeId).trim();
  if (out.userId !== undefined) out.userId = String(out.userId).trim();
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
    const payload = coerceRecipePayload(req.body || {});
    if (!payload.createdDate) {
      payload.createdDate = new Date();
    }
    const recipe = await store.createRecipe(payload);
    return res.status(201).json({ recipe });
  } catch (err) {
    return next(normaliseError(err));
  }
});

// List recipes
router.get(LIST_PATH, async function (req, res, next) {
  try {
    const recipes = await store.getAllRecipes();
    return res.json({ recipes, page: 1, total: recipes.length });
  } catch (err) {
    return next(err);
  }
});

// Get single recipe
router.get(GET_ONE_PATH, async function (req, res, next) {
  try {
    const recipe = await store.getRecipeByRecipeId(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.json({ recipe });
  } catch (err) {
    return next(err);
  }
});

// Update recipe (partial)
router.post(UPDATE_PATH, async function (req, res, next) {
  try {
    const patch = coerceRecipePayload(req.body || {});
    const updated = await store.updateRecipe(req.params.recipeId, patch);
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
    const result = await store.deleteRecipe(req.params.recipeId);
    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;