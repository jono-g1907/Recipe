const ValidationError = require('../../errors/ValidationError');
const normaliseError = require('../../lib/normaliseError');
const { buildLoginRedirectUrl, resolveActiveUser } = require('../../lib/auth');
const {
  getEmptyRecipeFormValues,
  buildRecipeFormValuesFromBody,
  buildRecipeFormValuesFromRecipe,
  collectRecipeErrors,
  parseRecipeForm,
  mapRecipeForView
} = require('../../forms/recipeForm');
const {
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  RECIPE_ID_REGEX,
  RECIPE_TITLE_REGEX
} = require('../../lib/validationConstants');
const { sanitiseString } = require('../../lib/utils');

function renderRecipeForm(res, user, values, errorMessage, status, appId) {
  const safeValues = values || getEmptyRecipeFormValues();
  const statusCode = status || 200;
  return res.status(statusCode).render('add-recipe-31477046.html', {
    error: errorMessage || '',
    values: safeValues,
    defaultUserId: user ? user.userId : '',
    userId: user ? user.userId : '',
    mealTypes: MEAL_TYPE_OPTIONS,
    cuisineTypes: CUISINE_TYPE_OPTIONS,
    difficulties: DIFFICULTY_OPTIONS,
    appId: appId || ''
  });
}

function renderRecipeEditForm(res, user, recipes, selectedId, values, errorMessage, successMessage, status, appId) {
  const safeValues = values || getEmptyRecipeFormValues();
  const statusCode = status || 200;
  return res.status(statusCode).render('edit-recipe-31477046.html', {
    error: errorMessage || '',
    success: successMessage || '',
    values: safeValues,
    recipes: Array.isArray(recipes) ? recipes : [],
    selectedRecipeId: selectedId || '',
    defaultUserId: user ? user.userId : '',
    userId: user ? user.userId : '',
    mealTypes: MEAL_TYPE_OPTIONS,
    cuisineTypes: CUISINE_TYPE_OPTIONS,
    difficulties: DIFFICULTY_OPTIONS,
    appId: appId || ''
  });
}

function registerRecipeRoutes(app, dependencies) {
  const store = dependencies.store;
  const appId = dependencies.appId;

  function renderAddForm(res, user, values, errorMessage, status) {
    return renderRecipeForm(res, user, values, errorMessage, status, appId);
  }

  function renderEditForm(res, user, recipes, selectedId, values, errorMessage, successMessage, status) {
    return renderRecipeEditForm(res, user, recipes, selectedId, values, errorMessage, successMessage, status, appId);
  }

  app.get('/add-recipe-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      return renderAddForm(res, user, getEmptyRecipeFormValues(), '', 200);
    } catch (err) {
      next(err);
    }
  });

  app.get('/edit-recipe-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const myRecipes = await store.getRecipesByOwner(user.userId);

      const queryId = sanitiseString(req.query && req.query.recipeId);
      const requestedId = queryId ? queryId.toUpperCase() : '';
      let selectedRecipe = null;
      for (let i = 0; i < myRecipes.length; i++) {
        if (myRecipes[i] && myRecipes[i].recipeId === requestedId) {
          selectedRecipe = myRecipes[i];
          break;
        }
      }

      let errorMessage = sanitiseString(req.query && req.query.error);
      if (!myRecipes.length) {
        errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'You have no recipes to edit yet. Add a recipe first.';
      } else if (requestedId && !selectedRecipe) {
        errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'Recipe ' + requestedId + ' was not found. Showing your first recipe.';
      }

      if (!selectedRecipe && myRecipes.length) {
        selectedRecipe = myRecipes[0];
      }

      const values = selectedRecipe ? buildRecipeFormValuesFromRecipe(selectedRecipe) : getEmptyRecipeFormValues();
      const successMessage = sanitiseString(req.query && req.query.success) || '';
      const selectedId = selectedRecipe ? selectedRecipe.recipeId : '';

      return renderEditForm(res, user, myRecipes, selectedId, values, errorMessage || '', successMessage, 200);
    } catch (err) {
      next(err);
    }
  });

  app.get('/recipes-list-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const recipes = await store.getAllRecipes({ includeChefInfo: true });
      const rows = recipes.map(mapRecipeForView);
      const deletedId = sanitiseString(req.query && req.query.deleted);
      const deletedTitle = sanitiseString(req.query && req.query.deletedTitle);
      const updatedId = sanitiseString(req.query && req.query.updated);
      const updatedTitle = sanitiseString(req.query && req.query.updatedTitle);
      const notices = [];
      if (updatedId) {
        let text = 'Updated recipe ' + updatedId;
        if (updatedTitle) {
          text += ' (' + updatedTitle + ')';
        }
        notices.push(text);
      }
      if (deletedId) {
        let text = 'Deleted recipe ' + deletedId;
        if (deletedTitle) {
          text += ' (' + deletedTitle + ')';
        }
        notices.push(text);
      }
      const msg = notices.join(' ');
      res.render('recipes-list-31477046.html', {
        recipes: rows,
        msg: msg,
        userId: user.userId,
        appId: appId
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/delete-recipe-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const error = sanitiseString(req.query && req.query.error);
      const lastId = sanitiseString(req.query && req.query.lastId);
      res.render('delete-recipe-31477046.html', {
        error: error || '',
        lastId: lastId || '',
        userId: user.userId,
        appId: appId
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/delete-recipe-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.render('delete-recipe-31477046.html', {
          error: result.error || 'You must be logged in to delete recipes.',
          lastId: '',
          userId: '',
          appId: appId
        });
      }

      const activeUser = result.user;
      const rawId = sanitiseString(req.body && req.body.recipeId);
      const id = rawId ? rawId.toUpperCase() : '';
      if (!id) {
        return res.render('delete-recipe-31477046.html', {
          error: 'recipeId is required',
          lastId: '',
          userId: activeUser.userId,
          appId: appId
        });
      }
      const deletedRecipe = await store.deleteRecipe(id, { userId: activeUser.userId });
      if (!deletedRecipe) {
        return res.render('delete-recipe-31477046.html', {
          error: 'Recipe not found',
          lastId: rawId,
          userId: activeUser.userId,
          appId: appId
        });
      }
      const params = [];
      params.push('userId=' + encodeURIComponent(activeUser.userId));
      params.push('deleted=' + encodeURIComponent(deletedRecipe.recipeId));
      if (deletedRecipe.title) {
        params.push('deletedTitle=' + encodeURIComponent(deletedRecipe.title));
      }
      const redirectTarget = '/recipes-list-' + appId + '?' + params.join('&');
      return res.redirect(302, redirectTarget);
    } catch (err) {
      next(err);
    }
  });

  app.post('/edit-recipe-' + appId, async function (req, res, next) {
    let activeUser = null;
    let recipeOptions = [];
    let formValues = null;
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      activeUser = result.user;
      recipeOptions = await store.getRecipesByOwner(activeUser.userId);

      formValues = buildRecipeFormValuesFromBody(req.body || {});
      const payload = parseRecipeForm(req.body || {});
      payload.userId = activeUser.userId;
      payload.recipeId = payload.recipeId ? payload.recipeId.toUpperCase() : '';

      if (!payload.recipeId) {
        return renderEditForm(res, activeUser, recipeOptions, '', formValues, 'Select a recipe to update.', '', 400);
      }

      const existingRecipe = await store.getRecipeByRecipeId(payload.recipeId);
      if (!existingRecipe || existingRecipe.userId !== activeUser.userId) {
        return renderEditForm(res, activeUser, recipeOptions, payload.recipeId, formValues, 'Recipe ' + payload.recipeId + ' was not found for your account.', '', 404);
      }

      const validationErrors = collectRecipeErrors(payload);

      if (payload.title && RECIPE_TITLE_REGEX.test(payload.title)) {
        const duplicateTitle = await store.getRecipeByTitleForUser(payload.userId, payload.title);
        if (duplicateTitle && duplicateTitle.recipeId !== existingRecipe.recipeId) {
          validationErrors.push('You already have a recipe with this title.');
        }
      }

      if (validationErrors.length) {
        return renderEditForm(res, activeUser, recipeOptions, existingRecipe.recipeId, formValues, validationErrors.join(' '), '', 400);
      }

      const patch = {
        title: payload.title,
        chef: payload.chef,
        mealType: payload.mealType,
        cuisineType: payload.cuisineType,
        prepTime: payload.prepTime,
        difficulty: payload.difficulty,
        servings: payload.servings,
        createdDate: payload.createdDate,
        ingredients: payload.ingredients,
        instructions: payload.instructions,
        userId: existingRecipe.userId
      };

      const updatedRecipe = await store.updateRecipe(existingRecipe.recipeId, patch, { userId: activeUser.userId });
      if (!updatedRecipe) {
        return renderEditForm(res, activeUser, recipeOptions, existingRecipe.recipeId, formValues, 'Recipe could not be updated. Try again.', '', 500);
      }

      const params = [];
      params.push('userId=' + encodeURIComponent(activeUser.userId));
      params.push('recipeId=' + encodeURIComponent(updatedRecipe.recipeId));
      let successMessage = 'Updated recipe ' + updatedRecipe.recipeId + '.';
      if (updatedRecipe.title) {
        successMessage = 'Updated recipe ' + updatedRecipe.recipeId + ' (' + updatedRecipe.title + ').';
      }
      params.push('success=' + encodeURIComponent(successMessage));

      return res.redirect(302, '/edit-recipe-' + appId + '?' + params.join('&'));
    } catch (err) {
      const normalised = normaliseError(err);
      if (normalised instanceof ValidationError) {
        if (!formValues) {
          formValues = buildRecipeFormValuesFromBody(req.body || {});
        }
        const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to update recipe.';
        const selectedId = formValues && formValues.recipeId ? formValues.recipeId : '';
        return renderEditForm(res, activeUser, recipeOptions, selectedId, formValues, message, '', 400);
      }
      next(normalised);
    }
  });

  app.post('/add-recipe-' + appId, async function (req, res, next) {
    let activeUser = null;
    let formValues = null;
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      activeUser = result.user;
      formValues = buildRecipeFormValuesFromBody(req.body || {});

      const payload = parseRecipeForm(req.body || {});
      payload.userId = activeUser.userId;

      const validationErrors = collectRecipeErrors(payload);
      const duplicateErrors = [];

      if (payload.recipeId && RECIPE_ID_REGEX.test(payload.recipeId)) {
        const existingId = await store.getRecipeByRecipeId(payload.recipeId);
        if (existingId) {
          duplicateErrors.push('Recipe ID already exists. Use a different ID.');
        }
      }

      if (payload.userId && payload.title && RECIPE_TITLE_REGEX.test(payload.title)) {
        const existingTitle = await store.getRecipeByTitleForUser(payload.userId, payload.title);
        if (existingTitle) {
          duplicateErrors.push('You already have a recipe with this title.');
        }
      }

      const errors = validationErrors.concat(duplicateErrors);
      if (errors.length) {
        return renderAddForm(res, activeUser, formValues, errors.join(' '), 400);
      }

      await store.createRecipe(payload);
      const redirectUserId = activeUser.userId;
      const params = [];
      if (redirectUserId) {
        params.push('userId=' + encodeURIComponent(redirectUserId));
      }
      const redirectTarget = '/recipes-list-' + appId + (params.length ? '?' + params.join('&') : '');
      return res.redirect(302, redirectTarget);
    } catch (err) {
      const normalised = normaliseError(err);
      if (normalised instanceof ValidationError) {
        if (!formValues) {
          formValues = buildRecipeFormValuesFromBody(req.body || {});
        }
        const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to add recipe.';
        return renderAddForm(res, activeUser, formValues, message, 400);
      }
      next(normalised);
    }
  });
}

module.exports = registerRecipeRoutes;
