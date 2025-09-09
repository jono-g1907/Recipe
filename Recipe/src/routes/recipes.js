const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID; // e.g. 31477046
const Recipe = require('../models/Recipe');
const ValidationError = require('../errors/ValidationError');
const store = require('../store');

// helper
function findRecipeById(id) {
  const list = store.recipes;

  for (let i = 0; i < list.length; i++) {
    if (list[i].recipeId === id) return list[i];
  }

  return null;
}

// base path including id
const RECIPES_BASE = '/recipes-' + APP_ID;

// list all recipes
router.get(RECIPES_BASE, function (req, res) {
    const items = [];
    for (let i = 0; i < store.recipes.length; i++) {
      items.push(store.recipes[i].toJSON());
    }
    return res.json({ items: items, page: 1, total: items.length });
});


// create a recipe
router.post(RECIPES_BASE, function (req, res, next) {
  try {
    const body = req.body || {};
    const rec = new Recipe(body);

    // duplicate id check
    for (let j = 0; j < store.recipes.length; j++) {
      if (store.recipes[j].recipeId === rec.recipeId) {
        throw new ValidationError(['recipeId already exists']);
      }
    }

    store.recipes.push(rec);
    return res.status(201).json({ recipe: rec.toJSON() });
  } catch (err) {
    return next(err);
  }
});

// get one recipe
router.get('/recipes/:recipeId-' + APP_ID, function (req, res) {
  const rec = findRecipeById(req.params.recipeId);

  if (!rec) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  return res.json({ recipe: rec.toJSON() });
});

// partial update
router.patch('/recipes/:recipeId-' + APP_ID, function (req, res, next) {
  try {
    const rec = findRecipeById(req.params.recipeId);

    if (!rec) {
        return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const patch = req.body || {};
    rec.update(patch);
    return res.json({ recipe: rec.toJSON() });
  } catch (err) {
    return next(err);
  }
});

// delete a recipe
router.delete('/recipes/:recipeId-' + APP_ID, function (req, res) {
    const id = req.params.recipeId;
    const list = store.recipes;
    let idx = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i].recipeId === id) { idx = i; break; }
    }
    if (idx === -1) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    list.splice(idx, 1);
    return res.status(204).end();
  });

module.exports = router;