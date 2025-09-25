const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;
const store = require('../store');

const RECOMMEND_PATH = '/analytics/recipe-recommendations-' + APP_ID;
const NUTRITION_PATH = '/analytics/recipe-nutrition-' + APP_ID;
const OPTIMISATION_PATH = '/analytics/inventory-optimisation-' + APP_ID;

function parseNumber(value, defaultValue) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return defaultValue;
}

function parseUserId(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed || null;
}

router.get(RECOMMEND_PATH, async function (req, res, next) {
  try {
    const query = req.query || {};
    const options = {};

    const recipeUserId = parseUserId(query.userId);
    if (recipeUserId) {
      options.userId = recipeUserId;
    }

    const inventoryUserId = parseUserId(query.inventoryUserId);
    if (inventoryUserId) {
      options.inventoryUserId = inventoryUserId;
    }

    const minScore = parseNumber(query.minScore, null);
    if (minScore !== null) {
      options.minScore = minScore;
    }

    const limit = parseInt(query.limit, 10);
    if (Number.isFinite(limit) && limit > 0) {
      options.limit = limit;
    }

    const recommendations = await store.recommendRecipesFromInventory(options);
    return res.json({ recommendations });
  } catch (err) {
    return next(err);
  }
});

router.get(NUTRITION_PATH, async function (req, res, next) {
  try {
    const query = req.query || {};
    const options = {};

    const userId = parseUserId(query.userId);
    if (userId) {
      options.userId = userId;
    }

    const topLimit = parseInt(query.topIngredientsLimit, 10);
    if (Number.isFinite(topLimit) && topLimit > 0) {
      options.topIngredientsLimit = topLimit;
    }

    const summary = await store.getRecipeNutritionSummary(options);
    return res.json({ summary });
  } catch (err) {
    return next(err);
  }
});

router.get(OPTIMISATION_PATH, async function (req, res, next) {
  try {
    const query = req.query || {};
    const options = {};

    const userId = parseUserId(query.userId);
    if (userId) {
      options.userId = userId;
    }

    const threshold = parseNumber(query.lowStockThreshold, null);
    if (threshold !== null) {
      options.lowStockThreshold = threshold;
    }

    const expiringSoon = parseNumber(query.expiringSoonDays, null);
    if (expiringSoon !== null) {
      options.expiringSoonDays = expiringSoon;
    }

    const suggestions = await store.getInventoryOptimisationSuggestions(options);
    return res.json({ suggestions });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
