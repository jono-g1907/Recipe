const path = require('path');
const express = require('express');
const constants = require('./lib/constants');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const apiRouter = require('./routes');
const store = require('./store');
const ValidationError = require('./errors/ValidationError');
const normaliseError = require('./lib/normaliseError');
const { buildLoginRedirectUrl, resolveActiveUser } = require('./lib/auth');
const {
  getEmptyRecipeFormValues,
  buildRecipeFormValuesFromBody,
  buildRecipeFormValuesFromRecipe,
  collectRecipeErrors,
  parseRecipeForm,
  mapRecipeForView
} = require('./forms/recipeForm');
const {
  getEmptyInventoryFormValues,
  parseInventoryForm,
  collectInventoryErrors,
  buildInventoryFormValuesFromItem,
  mapInventoryForView
} = require('./forms/inventoryForm');
const {
  parseRegistrationForm,
  collectRegistrationErrors,
  buildRegistrationValues,
  parseLoginForm,
  collectLoginErrors
} = require('./forms/userForm');
const {
  ROLE_OPTIONS,
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  UNIT_OPTIONS,
  INVENTORY_CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  RECIPE_ID_REGEX,
  RECIPE_TITLE_REGEX
} = require('./lib/validationConstants');
const { sanitiseString } = require('./lib/utils');
const { userCanAccessRecipes, userCanAccessInventory } = require('./lib/permissions');

const app = express();
app.set('port', 8080);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/bootstrap', express.static(
  path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css')
));

app.get('/bootstrap.bundle.min.js', function (req, res) {
  res.sendFile(path.join(__dirname, '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
});

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));

const APP_ID = constants.APP_ID;

function renderRecipeForm(res, user, values, errorMessage, status) {
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
    appId: APP_ID
  });
}

function renderRecipeEditForm(res, user, recipes, selectedId, values, errorMessage, successMessage, status) {
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
    appId: APP_ID
  });
}

function renderInventoryEditForm(res, user, items, selectedId, values, errorMessage, successMessage, status) {
  const safeValues = values || getEmptyInventoryFormValues();
  const statusCode = status || 200;
  return res.status(statusCode).render('edit-inventory-31477046.html', {
    error: errorMessage || '',
    success: successMessage || '',
    values: safeValues,
    items: Array.isArray(items) ? items : [],
    selectedInventoryId: selectedId || '',
    categories: INVENTORY_CATEGORY_OPTIONS,
    locations: LOCATION_OPTIONS,
    units: UNIT_OPTIONS,
    userId: user ? user.userId : '',
    defaultUserId: user ? user.userId : '',
    appId: APP_ID
  });
}

app.get('/', function (req, res) {
  res.redirect(302, '/login-' + APP_ID);
});

app.get('/home-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;

    const stats = await store.getDashboardStats();
    const successMessage = req.query && req.query.success === '1' ? 'Login successful. Your account details are now loaded for new submissions.' : sanitiseString(req.query && req.query.successMessage);
    const errorMessage = sanitiseString(req.query && req.query.errorMessage);

    const canManageRecipes = userCanAccessRecipes(user);
    const canManageInventory = userCanAccessInventory(user);

    let myRecipes = [];
    let recipeSuggestions = [];
    if (canManageRecipes) {
      const [mine, suggestions] = await Promise.all([
        store.getRecipesByOwner(user.userId, { limit: 5 }),
        store.getInventoryBasedSuggestions(3)
      ]);
      myRecipes = mine;
      recipeSuggestions = suggestions;
    }

    let sharedInventory = [];
    if (canManageInventory) {
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
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/hd-task1-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    const insights = await store.getSmartRecipeDashboardData({});

    res.render('hd-task1-31477046.html', {
      appId: APP_ID,
      userId: user.userId,
      username: user.fullname,
      email: sanitiseString(user.email),
      recommendations: (insights && insights.recommendations) || [],
      latestRecipes: (insights && insights.latestRecipes) || [],
      expiringSoon: (insights && insights.expiringSoon) || [],
      lowStock: (insights && insights.lowStock) || [],
      popularity: (insights && insights.popularity) || []
    });
  } catch (err) {
    next(err);
  }
});

app.get('/register-' + APP_ID, function (req, res) {
  const values = { email: '', fullname: '', role: 'chef', phone: '' };
  res.render('register-31477046.html', {
    error: '',
    values: values,
    roles: ROLE_OPTIONS
  });
});

app.post('/register-' + APP_ID, async function (req, res, next) {
  try {
    const form = parseRegistrationForm(req.body || {});
    const errors = collectRegistrationErrors(form);

    if (!errors.length) {
      const existing = await store.getUserByEmail(form.email);
      if (existing) {
        errors.push('That email address is already registered');
      }
    }

    if (errors.length) {
      const values = buildRegistrationValues(form);
      return res.status(400).render('register-31477046.html', {
        error: errors.join(' '),
        values: values,
        roles: ROLE_OPTIONS
      });
    }

    await store.createUser({
      email: form.email,
      password: form.password,
      fullname: form.fullname,
      role: form.role,
      phone: form.phone
    });

    return res.redirect(302, '/login-' + APP_ID + '?registered=' + encodeURIComponent(form.email));
  } catch (err) {
    const normalised = normaliseError(err);
    if (normalised instanceof ValidationError) {
      const retryForm = parseRegistrationForm(req.body || {});
      const values = buildRegistrationValues(retryForm);
      const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Registration failed';
      return res.status(400).render('register-31477046.html', {
        error: message,
        values: values,
        roles: ROLE_OPTIONS
      });
    }
    next(err);
  }
});

app.get('/login-' + APP_ID, function (req, res) {
  const registered = sanitiseString(req.query && req.query.registered);
  const infoMessage = registered ? 'Registration successful. You can now log in with ' + registered : sanitiseString(req.query && req.query.message);
  const successMessage = registered ? '' : sanitiseString(req.query && req.query.success);
  const errorMessage = sanitiseString(req.query && req.query.error);
  const emailValue = registered || sanitiseString(req.query && req.query.email) || '';

  res.render('login-31477046.html', {
    message: infoMessage || '',
    error: errorMessage || '',
    success: successMessage || '',
    email: emailValue
  });
});

app.post('/login-' + APP_ID, async function (req, res, next) {
  try {
    const form = parseLoginForm(req.body || {});
    const errors = collectLoginErrors(form);

    if (errors.length) {
      return res.status(400).render('login-31477046.html', {
        message: '',
        error: errors.join(' '),
        success: '',
        email: form.email
      });
    }

    const user = await store.getUserByEmail(form.email);

    if (!user) {
      return res.status(404).render('login-31477046.html', {
        message: '',
        error: 'Account not found.',
        success: '',
        email: form.email
      });
    }

    if (user.password !== form.password) {
      return res.status(401).render('login-31477046.html', {
        message: '',
        error: 'Invalid credentials. Please try again.',
        success: '',
        email: form.email
      });
    }

    const updated = await store.setUserLoginState(user.userId, true);
    const activeUser = updated || user;

    return res.redirect(302, '/home-' + APP_ID + '?userId=' + encodeURIComponent(activeUser.userId) + '&success=1');
  } catch (err) {
    next(err);
  }
});

app.post('/logout-' + APP_ID, async function (req, res, next) {
  try {
    const idInput = sanitiseString(req.body && req.body.userId);
    const userId = idInput ? idInput.toUpperCase() : '';

    if (!userId) {
      return res.redirect(302, '/login-' + APP_ID + '?error=' + encodeURIComponent('User identifier is required to log out.'));
    }

    const user = await store.getUserByUserId(userId);

    if (!user) {
      return res.redirect(302, '/login-' + APP_ID + '?error=' + encodeURIComponent('Account not found for the supplied ID.'));
    }

    await store.setUserLoginState(userId, false);

    return res.redirect(302, '/login-' + APP_ID + '?success=' + encodeURIComponent('You have been logged out.') + '&email=' + encodeURIComponent(user.email));
  } catch (err) {
    next(err);
  }
});

app.get('/add-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    return renderRecipeForm(res, user, getEmptyRecipeFormValues(), '', 200);
  } catch (err) {
    next(err);
  }
});

app.get('/edit-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
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

    return renderRecipeEditForm(res, user, myRecipes, selectedId, values, errorMessage || '', successMessage, 200);
  } catch (err) {
    next(err);
  }
});

app.get('/add-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;

    res.render('add-inventory-31477046.html', {
      defaultUserId: user.userId,
      userId: user.userId,
      categories: INVENTORY_CATEGORY_OPTIONS,
      locations: LOCATION_OPTIONS,
      units: UNIT_OPTIONS,
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/edit-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    const listResult = await store.listInventory({ page: 1, limit: 500, sort: '-createdDate' });
    const items = Array.isArray(listResult.items) ? listResult.items : [];

    const queryId = sanitiseString(req.query && req.query.inventoryId);
    const requestedId = queryId ? queryId.toUpperCase() : '';
    let selectedItem = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i] && items[i].inventoryId === requestedId) {
        selectedItem = items[i];
        break;
      }
    }

    let errorMessage = sanitiseString(req.query && req.query.error);
    if (!items.length) {
      errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'There are no inventory items to edit yet. Add an item first.';
    } else if (requestedId && !selectedItem) {
      errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'Inventory item ' + requestedId + ' was not found. Showing your first item.';
    }

    if (!selectedItem && items.length) {
      selectedItem = items[0];
    }

    const values = selectedItem ? buildInventoryFormValuesFromItem(selectedItem) : getEmptyInventoryFormValues();
    const successMessage = sanitiseString(req.query && req.query.success) || '';
    const selectedId = selectedItem ? selectedItem.inventoryId : '';

    return renderInventoryEditForm(res, user, items, selectedId, values, errorMessage || '', successMessage, 200);
  } catch (err) {
    next(err);
  }
});

app.get('/recipes-list-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
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
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/delete-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    const error = sanitiseString(req.query && req.query.error);
    const lastId = sanitiseString(req.query && req.query.lastId);
    res.render('delete-recipe-31477046.html', {
      error: error || '',
      lastId: lastId || '',
      userId: user.userId,
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/delete-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    const error = sanitiseString(req.query && req.query.error);
    const lastId = sanitiseString(req.query && req.query.lastId);
    res.render('delete-inventory-31477046.html', {
      error: error || '',
      lastId: lastId || '',
      userId: user.userId,
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.post('/delete-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.render('delete-inventory-31477046.html', {
        error: result.error || 'You must be logged in to delete inventory items.',
        lastId: '',
        userId: '',
        appId: APP_ID
      });
    }

    const activeUser = result.user;
    const idInput = (req.body.inventoryId || '').trim().toUpperCase();
    if (!idInput) {
      return res.render('delete-inventory-31477046.html', {
        error: 'inventoryId is required',
        lastId: '',
        userId: activeUser.userId,
        appId: APP_ID
      });
    }

    const deletion = await store.deleteInventoryItem(idInput);
    if (!deletion || deletion.deletedCount === 0) {
      return res.render('delete-inventory-31477046.html', {
        error: 'Inventory item not found',
        lastId: idInput,
        userId: activeUser.userId,
        appId: APP_ID
      });
    }

    const params = [];
    params.push('userId=' + encodeURIComponent(activeUser.userId));
    params.push('deleted=' + encodeURIComponent(idInput));
    const redirectTarget = '/inventory-dashboard-' + APP_ID + '?' + params.join('&');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(err);
  }
});

app.get('/inventory-dashboard-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const user = result.user;
    const items = await store.getAllInventory();
    const rows = items.map(mapInventoryForView);

    const groupBy = req.query.group === 'category' ? 'category' : 'location';
    const groups = {};
    for (let i = 0; i < rows.length; i++) {
      const key = rows[i][groupBy] || 'Unspecified';
      if (!groups[key]) {
        groups[key] = { items: [], value: 0 };
      }
      groups[key].items.push(rows[i]);
      if (Number.isFinite(rows[i].cost)) {
        groups[key].value += rows[i].cost;
      }
    }

    let totalValue = 0;
    for (let j = 0; j < rows.length; j++) {
      if (Number.isFinite(rows[j].cost)) {
        totalValue += rows[j].cost;
      }
    }

    const deletedId = sanitiseString(req.query && req.query.deleted);
    const updatedId = sanitiseString(req.query && req.query.updated);
    const updatedName = sanitiseString(req.query && req.query.updatedName);
    const notices = [];
    if (updatedId) {
      let text = 'Updated inventory item ' + updatedId;
      if (updatedName) {
        text += ' (' + updatedName + ')';
      }
      notices.push(text);
    }
    if (deletedId) {
      notices.push('Deleted inventory item ' + deletedId);
    }
    const msg = notices.join(' ');

    res.render('inventory-dashboard-31477046.html', {
      groupBy: groupBy,
      groups: groups,
      totalValue: totalValue,
      appId: APP_ID,
      msg: msg,
      itemCount: rows.length,
      userId: user.userId
    });
  } catch (err) {
    next(err);
  }
});

app.post('/delete-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.render('delete-recipe-31477046.html', {
        error: result.error || 'You must be logged in to delete recipes.',
        lastId: '',
        userId: '',
        appId: APP_ID
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
        appId: APP_ID
      });
    }
    const deletedRecipe = await store.deleteRecipe(id, { userId: activeUser.userId });
    if (!deletedRecipe) {
      return res.render('delete-recipe-31477046.html', {
        error: 'Recipe not found',
        lastId: rawId,
        userId: activeUser.userId,
        appId: APP_ID
      });
    }
    const params = [];
    params.push('userId=' + encodeURIComponent(activeUser.userId));
    params.push('deleted=' + encodeURIComponent(deletedRecipe.recipeId));
    if (deletedRecipe.title) {
      params.push('deletedTitle=' + encodeURIComponent(deletedRecipe.title));
    }
    const redirectTarget = '/recipes-list-' + APP_ID + '?' + params.join('&');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(err);
  }
});

app.post('/edit-recipe-' + APP_ID, async function (req, res, next) {
  let activeUser = null;
  let recipeOptions = [];
  let formValues = null;
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    activeUser = result.user;
    recipeOptions = await store.getRecipesByOwner(activeUser.userId);

    formValues = buildRecipeFormValuesFromBody(req.body || {});
    const payload = parseRecipeForm(req.body || {});
    payload.userId = activeUser.userId;
    payload.recipeId = payload.recipeId ? payload.recipeId.toUpperCase() : '';

    if (!payload.recipeId) {
      return renderRecipeEditForm(res, activeUser, recipeOptions, '', formValues, 'Select a recipe to update.', '', 400);
    }

    const existingRecipe = await store.getRecipeByRecipeId(payload.recipeId);
    if (!existingRecipe || existingRecipe.userId !== activeUser.userId) {
      return renderRecipeEditForm(res, activeUser, recipeOptions, payload.recipeId, formValues, 'Recipe ' + payload.recipeId + ' was not found for your account.', '', 404);
    }

    const validationErrors = collectRecipeErrors(payload);

    if (payload.title && RECIPE_TITLE_REGEX.test(payload.title)) {
      const duplicateTitle = await store.getRecipeByTitleForUser(payload.userId, payload.title);
      if (duplicateTitle && duplicateTitle.recipeId !== existingRecipe.recipeId) {
        validationErrors.push('You already have a recipe with this title.');
      }
    }

    if (validationErrors.length) {
      return renderRecipeEditForm(res, activeUser, recipeOptions, existingRecipe.recipeId, formValues, validationErrors.join(' '), '', 400);
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
      return renderRecipeEditForm(res, activeUser, recipeOptions, existingRecipe.recipeId, formValues, 'Recipe could not be updated. Try again.', '', 500);
    }

    const params = [];
    params.push('userId=' + encodeURIComponent(activeUser.userId));
    params.push('recipeId=' + encodeURIComponent(updatedRecipe.recipeId));
    let successMessage = 'Updated recipe ' + updatedRecipe.recipeId + '.';
    if (updatedRecipe.title) {
      successMessage = 'Updated recipe ' + updatedRecipe.recipeId + ' (' + updatedRecipe.title + ').';
    }
    params.push('success=' + encodeURIComponent(successMessage));

    return res.redirect(302, '/edit-recipe-' + APP_ID + '?' + params.join('&'));
  } catch (err) {
    const normalised = normaliseError(err);
    if (normalised instanceof ValidationError) {
      if (!formValues) {
        formValues = buildRecipeFormValuesFromBody(req.body || {});
      }
      const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to update recipe.';
      const selectedId = formValues && formValues.recipeId ? formValues.recipeId : '';
      return renderRecipeEditForm(res, activeUser, recipeOptions, selectedId, formValues, message, '', 400);
    }
    next(normalised);
  }
});

app.post('/add-recipe-' + APP_ID, async function (req, res, next) {
  let activeUser = null;
  let formValues = null;
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
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
      return renderRecipeForm(res, activeUser, formValues, errors.join(' '), 400);
    }

    await store.createRecipe(payload);
    const redirectUserId = activeUser.userId;
    const params = [];
    if (redirectUserId) {
      params.push('userId=' + encodeURIComponent(redirectUserId));
    }
    const redirectTarget = '/recipes-list-' + APP_ID + (params.length ? '?' + params.join('&') : '');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    const normalised = normaliseError(err);
    if (normalised instanceof ValidationError) {
      if (!formValues) {
        formValues = buildRecipeFormValuesFromBody(req.body || {});
      }
      const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to add recipe.';
      return renderRecipeForm(res, activeUser, formValues, message, 400);
    }
    next(normalised);
  }
});

app.post('/add-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    const payload = parseInventoryForm(req.body || {});
    payload.userId = result.user.userId;

    await store.createInventoryItem(payload);
    const redirectUserId = result.user.userId;
    const params = [];
    if (redirectUserId) {
      params.push('userId=' + encodeURIComponent(redirectUserId));
    }
    const redirectTarget = '/inventory-dashboard-' + APP_ID + (params.length ? '?' + params.join('&') : '');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(normaliseError(err));
  }
});

app.post('/edit-inventory-' + APP_ID, async function (req, res, next) {
  let activeUser = null;
  let inventoryOptions = [];
  let formValues = null;
  try {
    const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(APP_ID, result.error));
    }

    activeUser = result.user;
    const listResult = await store.listInventory({ page: 1, limit: 500, sort: '-createdDate' });
    inventoryOptions = Array.isArray(listResult.items) ? listResult.items : [];

    const payload = parseInventoryForm(req.body || {});
    payload.userId = activeUser.userId;
    payload.inventoryId = payload.inventoryId ? payload.inventoryId.toUpperCase() : '';
    formValues = buildInventoryFormValuesFromItem(payload);

    if (!payload.inventoryId) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, '', formValues, 'Select an inventory item to update.', '', 400);
    }

    const existingItem = await store.getInventoryItemById(payload.inventoryId);
    if (!existingItem) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, payload.inventoryId, formValues, 'Inventory item ' + payload.inventoryId + ' was not found.', '', 404);
    }

    const validationErrors = collectInventoryErrors(payload);
    if (validationErrors.length) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, existingItem.inventoryId, formValues, validationErrors.join(' '), '', 400);
    }

    const patch = {
      ingredientName: payload.ingredientName,
      quantity: payload.quantity,
      unit: payload.unit,
      category: payload.category,
      purchaseDate: payload.purchaseDate,
      expirationDate: payload.expirationDate,
      location: payload.location,
      cost: payload.cost,
      createdDate: payload.createdDate,
      userId: existingItem.userId
    };

    const updatedItem = await store.updateInventoryItem(existingItem.inventoryId, patch);
    if (!updatedItem) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, existingItem.inventoryId, formValues, 'Inventory item could not be updated. Try again.', '', 500);
    }

    const params = [];
    params.push('userId=' + encodeURIComponent(activeUser.userId));
    params.push('inventoryId=' + encodeURIComponent(updatedItem.inventoryId));
    let successMessage = 'Updated inventory item ' + updatedItem.inventoryId + '.';
    if (updatedItem.ingredientName) {
      successMessage = 'Updated inventory item ' + updatedItem.inventoryId + ' (' + updatedItem.ingredientName + ').';
    }
    params.push('success=' + encodeURIComponent(successMessage));

    return res.redirect(302, '/edit-inventory-' + APP_ID + '?' + params.join('&'));
  } catch (err) {
    const normalised = normaliseError(err);
    if (normalised instanceof ValidationError) {
      if (!formValues) {
        const fallback = parseInventoryForm(req.body || {});
        if (activeUser) {
          fallback.userId = activeUser.userId;
        }
        fallback.inventoryId = fallback.inventoryId ? fallback.inventoryId.toUpperCase() : '';
        formValues = buildInventoryFormValuesFromItem(fallback);
      }
      const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to update inventory item.';
      const selectedId = formValues && formValues.inventoryId ? formValues.inventoryId : '';
      return renderInventoryEditForm(res, activeUser, inventoryOptions, selectedId, formValues, message, '', 400);
    }
    next(normalised);
  }
});

app.use(express.static(path.join(__dirname, 'views'), { index: false }));
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

store.seedDatabase().then(function () {
  app.listen(app.get('port'), function () {
    console.log('Server running at http://localhost:' + app.get('port') + '/');
    console.log('API base: http://localhost:' + app.get('port') + '/api');
  });
}).catch(function (err) {
  console.error('Failed to start server', err);
  process.exit(1);
});