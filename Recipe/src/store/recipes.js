const Recipe = require('../models/Recipe');
const ValidationError = require('../errors/ValidationError');
const { ensureConnection, normaliseUserId } = require('./base');
const { findUserDocumentByUserId } = require('./users');


// fetch every recipe with objects that are safe to send to the client
async function getAllRecipes(options) {
  await ensureConnection();
  const opts = options || {};
  const query = {};

  if (opts.ownerId) {
    query.userId = opts.ownerId;
  }

  // only request the fields we actually show in the UI to keep the response small
  const projection = 'recipeId userId title mealType cuisineType prepTime difficulty servings chef createdDate ingredients instructions';
  let finder = Recipe.find(query, projection).sort({ createdDate: -1, recipeId: 1 });

  if (opts.includeChefInfo) {
    finder = finder.populate('user', 'userId fullname role');
  }

  if (Number.isFinite(opts.limit) && opts.limit > 0) {
    finder = finder.limit(opts.limit);
  }

  return finder.lean();
}


// look up a recipe via its public id
async function getRecipeByRecipeId(recipeId) {
  await ensureConnection();
  return Recipe.findOne({ recipeId }).lean();
}


// prevent duplicate recipes by checking whether a chef already has a recipe with the same title
async function getRecipeByTitleForUser(userId, title) {
  await ensureConnection();
  const normalisedUserId = (userId || '').trim().toUpperCase();
  const normalisedTitle = (title || '').trim();
  if (!normalisedUserId || !normalisedTitle) {
    return null;
  }
  return Recipe.findOne({ userId: normalisedUserId, title: normalisedTitle }).lean();
}


// wrapper that normalises the owner id before delegating to getAllRecipes
async function getRecipesByOwner(userId, options) {
  const opts = options || {};
  const ownerId = normaliseUserId(userId);
  if (!ownerId) {
    return [];
  }
  return getAllRecipes({ ownerId: ownerId, limit: opts.limit, includeChefInfo: opts.includeChefInfo });
}


// create a brand new recipe, linking it to an existing chef account
// throws if the provided user cannot be found
async function createRecipe(data) {
  await ensureConnection();
  const payload = Object.assign({}, data || {});
  // recipes must be linked to a valid chef so we look them up by id
  const ownerDoc = await findUserDocumentByUserId(payload.userId);

  if (!ownerDoc) {
    throw new ValidationError(['A valid chef account is required to create recipes.']);
  }

  payload.userId = ownerDoc.userId;
  payload.user = ownerDoc._id;

  if (payload.recipeId) {
    payload.recipeId = String(payload.recipeId).trim().toUpperCase();
  }

  const recipe = new Recipe(payload);
  const saved = await recipe.save();
  return saved.toObject();
}


// apply a partial update to a recipe
// ensure the requesting user owns the recipe and keep the owner relationship valid
async function updateRecipe(recipeId, patch, options) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  // grab the current document so we can validate ownership and merge data
  const existing = await Recipe.findOne({ recipeId: normalisedId }).lean();
  if (!existing) {
    return null;
  }

  const opts = options || {};
  const editorId = normaliseUserId(opts.userId);
  if (editorId && existing.userId !== editorId) {
    return null;
  }

  const update = Object.assign({}, patch || {});
  delete update.recipeId;

  if (update.userId) {
    update.userId = String(update.userId).trim().toUpperCase();
    if (editorId && update.userId !== editorId) {
      throw new ValidationError(['You cannot reassign another chef to this recipe.']);
    }
  }

  if (update.userId || !existing.user) {
    const targetUserId = update.userId || existing.userId;
    const ownerDoc = await findUserDocumentByUserId(targetUserId);
    if (!ownerDoc) {
      throw new ValidationError(['A valid chef account is required for this recipe.']);
    }
    update.user = ownerDoc._id;
    update.userId = ownerDoc.userId;
  }

  update.updatedAt = new Date();

  return Recipe.findOneAndUpdate({ recipeId: normalisedId }, update, { new: true, runValidators: true }).lean();
}


// delete a recipe by id
// if a user id is provided we only delete when the caller owns the record
async function deleteRecipe(recipeId, options) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const opts = options || {};
  const editorId = normaliseUserId(opts.userId);

  // only delete this exact recipe
  // when a user id is supplied we add it below
  const query = { recipeId: normalisedId };
  if (editorId) {
    query.userId = editorId;
  }

  const deletedRecipe = await Recipe.findOneAndDelete(query).lean();
  return deletedRecipe || null;
}

module.exports = {
  getAllRecipes,
  getRecipeByRecipeId,
  getRecipeByTitleForUser,
  getRecipesByOwner,
  createRecipe,
  updateRecipe,
  deleteRecipe
};