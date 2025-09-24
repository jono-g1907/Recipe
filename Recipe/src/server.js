const path = require('path');
const express = require('express');
const constants = require('./lib/constants');
const enums = require('./enums');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const apiRouter = require('./routes');
const store = require('./store');
const seed = require('./seed');
const ValidationError = require('./errors/ValidationError');
const { sanitiseString } = require('./lib/utils');

const app = express();
app.set('port', 8080);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/bootstrap', express.static(
  path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css')
));

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));

const DEFAULT_USER_ID = seed.DEFAULT_USER_ID;
const APP_ID = constants.APP_ID;
const AUTHOR_NAME = constants.AUTHOR_NAME;

const ROLE_OPTIONS = ['admin', 'chef', 'manager'];
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
const NAME_REGEX = /^[A-Za-z\s\-']{2,100}$/;

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
      details.push('Duplicate value is not allowed');
    }
    return new ValidationError(details);
  }

  if (err.message && err.message.indexOf('Quantity cannot be negative') !== -1) {
    return new ValidationError([err.message]);
  }

  return err;
}

function parseRecipeForm(body) {
  const recipe = {};
  recipe.recipeId = (body.recipeId || '').trim();
  recipe.userId = (body.userId || DEFAULT_USER_ID).trim();
  recipe.title = (body.title || '').trim();
  recipe.mealType = (body.mealType || '').trim();
  recipe.cuisineType = (body.cuisineType || '').trim();
  recipe.prepTime = Number((body.prepTime || '').trim());
  recipe.difficulty = (body.difficulty || '').trim();
  recipe.servings = Number((body.servings || '').trim());
  recipe.chef = (body.chef || '').trim();
  recipe.createdDate = body.createdDate ? new Date(body.createdDate) : new Date();

  const ingText = body.ingredientsText || '';
  const ingLines = ingText.split('\n');
  const ingredients = [];
  for (let i = 0; i < ingLines.length; i++) {
    const line = ingLines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    const name = (parts[0] || '').trim();
    const quantity = Number((parts[1] || '').trim());
    const unit = (parts[2] || '').trim().toLowerCase();
    ingredients.push({
      ingredientName: name,
      quantity: quantity,
      unit: unit
    });
  }
  recipe.ingredients = ingredients;

  const insText = body.instructionsText || '';
  const insLines = insText.split('\n');
  const instructions = [];
  for (let j = 0; j < insLines.length; j++) {
    const line = insLines[j].trim();
    if (line) instructions.push(line);
  }
  recipe.instructions = instructions;

  return recipe;
}

function parseInventoryForm(body) {
  const item = {};
  item.inventoryId = (body.inventoryId || '').trim();
  item.userId = (body.userId || DEFAULT_USER_ID).trim();
  item.ingredientName = (body.ingredientName || '').trim();
  item.quantity = Number(body.quantity);
  item.unit = (body.unit || '').trim().toLowerCase();
  item.category = (body.category || '').trim();
  item.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
  item.expirationDate = body.expirationDate ? new Date(body.expirationDate) : new Date();
  item.location = (body.location || '').trim();
  item.cost = Number(body.cost);
  item.createdDate = body.createdDate ? new Date(body.createdDate) : new Date();
  return item;
}

function toIsoDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function mapRecipeForView(recipe) {
  return {
    recipeId: recipe.recipeId,
    userId: recipe.userId,
    title: recipe.title,
    mealType: recipe.mealType,
    cuisineType: recipe.cuisineType,
    prepTime: recipe.prepTime,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    chef: recipe.chef,
    createdDate: toIsoDate(recipe.createdDate),
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || []
  };
}

function mapInventoryForView(item) {
  const now = new Date();
  const expiration = item.expirationDate instanceof Date ? item.expirationDate : new Date(item.expirationDate);
  let daysLeft = null;
  if (expiration && !isNaN(expiration.getTime())) {
    const diff = expiration.getTime() - now.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  let expiryStatus = 'unknown';
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      expiryStatus = 'expired';
    } else if (daysLeft <= 3) {
      expiryStatus = 'soon';
    } else {
      expiryStatus = 'ok';
    }
  }

  const costNumber = Number(item.cost);

  return {
    inventoryId: item.inventoryId,
    userId: item.userId,
    ingredientName: item.ingredientName,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    purchaseDate: toIsoDate(item.purchaseDate),
    expirationDate: toIsoDate(item.expirationDate),
    location: item.location,
    cost: Number.isFinite(costNumber) ? costNumber : 0,
    createdDate: toIsoDate(item.createdDate),
    daysLeft: daysLeft,
    expiryStatus: expiryStatus
  };
}

function parseRegistrationForm(body) {
  const form = {};
  const emailInput = sanitiseString(body && body.email);
  form.email = emailInput ? emailInput.toLowerCase() : '';

  if (body && typeof body.password === 'string') {
    form.password = body.password;
  } else {
    form.password = '';
  }

  if (body && typeof body.confirmPassword === 'string') {
    form.confirmPassword = body.confirmPassword;
  } else {
    form.confirmPassword = '';
  }

  form.fullname = sanitiseString(body && body.fullname);
  const roleInput = sanitiseString(body && body.role);
  form.role = roleInput ? roleInput.toLowerCase() : '';
  form.phone = sanitiseString(body && body.phone);
  return form;
}

function stripPhoneFormatting(value) {
  return (value || '').replace(/[\s()-]/g, '');
}

function isAustralianPhoneNumber(value) {
  const cleaned = stripPhoneFormatting(value);
  if (!cleaned) {
    return false;
  }
  if (cleaned.indexOf('+') === 0) {
    if (cleaned.indexOf('+61') !== 0) {
      return false;
    }
    const rest = cleaned.slice(3);
    return rest.length === 9 && /^[2-478]\d{8}$/.test(rest);
  }
  if (cleaned.indexOf('0') === 0) {
    return cleaned.length === 10 && /^[2-478]\d{9}$/.test(cleaned);
  }
  return false;
}

function collectRegistrationErrors(form) {
  const errors = [];

  if (!form.email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.push('Enter a valid email address');
  }

  if (!form.password) {
    errors.push('Password is required');
  } else if (!PASSWORD_REGEX.test(form.password)) {
    errors.push('Password must be at least 8 characters with upper, lower, number and special character');
  }

  if (!form.confirmPassword) {
    errors.push('Confirm your password');
  } else if (form.password !== form.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!form.fullname) {
    errors.push('Full name is required');
  } else if (!NAME_REGEX.test(form.fullname)) {
    errors.push('Full name can only include letters, spaces, hyphens and apostrophes');
  }

  if (!form.role) {
    errors.push('Role is required');
  } else if (ROLE_OPTIONS.indexOf(form.role) === -1) {
    errors.push('Select a valid role');
  }

  if (!form.phone) {
    errors.push('Phone number is required');
  } else if (!isAustralianPhoneNumber(form.phone)) {
    errors.push('Enter a valid Australian phone number');
  }

  return errors;
}

function buildRegistrationValues(form) {
  return {
    email: form.email || '',
    fullname: form.fullname || '',
    role: form.role || '',
    phone: form.phone || ''
  };
}

function parseLoginForm(body) {
  const form = {};
  const emailInput = sanitiseString(body && body.email);
  form.email = emailInput ? emailInput.toLowerCase() : '';
  if (body && typeof body.password === 'string') {
    form.password = body.password;
  } else {
    form.password = '';
  }
  return form;
}

function collectLoginErrors(form) {
  const errors = [];
  if (!form.email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.push('Enter a valid email address');
  }
  if (!form.password) {
    errors.push('Password is required');
  }
  return errors;
}

function buildLoginRedirectUrl(message) {
  const text = message || 'Log in to access the dashboard.';
  return '/login-' + APP_ID + '?error=' + encodeURIComponent(text);
}

async function resolveActiveUser(req) {
  const queryUserId = sanitiseString(req.query && req.query.userId);
  if (!queryUserId) {
    return { error: 'Log in to access the dashboard.' };
  }

  const userId = queryUserId.toUpperCase();
  const user = await store.getUserByUserId(userId);

  if (!user) {
    return { error: 'Account not found. Please log in again.' };
  }

  if (!user.isLoggedIn) {
    return { error: 'Your session has ended. Please log in again.' };
  }

  return { user: user };
}

app.get('/', function (req, res) {
  res.redirect(302, '/login-' + APP_ID);
});

app.get('/home-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;

    const stats = await store.getDashboardStats();
    const successMessage = req.query && req.query.success === '1' ? 'Login successful. Use your User ID when submitting forms.' : sanitiseString(req.query && req.query.successMessage);
    const errorMessage = sanitiseString(req.query && req.query.errorMessage);

    res.render('index.html', {
      username: user.fullname,
      id: user.userId,
      totalRecipes: stats.recipeCount,
      totalInventory: stats.inventoryCount,
      cuisineCount: stats.cuisineCount,
      inventoryValue: Number(stats.inventoryValue || 0),
      successMessage: successMessage || '',
      errorMessage: errorMessage || '',
      appId: APP_ID
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
        error: 'Account not found. Please check your email or register.',
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;

    res.render('add-recipe-31477046.html', {
      defaultUserId: user.userId,
      userId: user.userId,
      mealTypes: Object.values(enums.MealType),
      cuisineTypes: Object.values(enums.CuisineType),
      difficulties: Object.values(enums.Difficulty),
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/add-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;

    res.render('add-inventory-31477046.html', {
      defaultUserId: user.userId,
      userId: user.userId,
      categories: Object.values(enums.InventoryCategory),
      locations: Object.values(enums.Location),
      units: Object.values(enums.Unit),
      appId: APP_ID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/recipes-list-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;
    const recipes = await store.getAllRecipes();
    const rows = recipes.map(mapRecipeForView);
    const deletedId = sanitiseString(req.query && req.query.deleted);
    const msg = deletedId ? 'Deleted recipe ' + deletedId : '';
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const id = (req.body.inventoryId || '').trim();
    const bodyUserId = sanitiseString(req.body && req.body.userId);
    const userId = bodyUserId ? bodyUserId.toUpperCase() : '';
    if (!id) {
      return res.render('delete-inventory-31477046.html', {
        error: 'inventoryId is required',
        lastId: '',
        userId: userId,
        appId: APP_ID
      });
    }
    const result = await store.deleteInventoryItem(id);
    if (!result || result.deletedCount === 0) {
      return res.render('delete-inventory-31477046.html', {
        error: 'Inventory item not found',
        lastId: id,
        userId: userId,
        appId: APP_ID
      });
    }
    const params = [];
    if (userId) {
      params.push('userId=' + encodeURIComponent(userId));
    }
    params.push('deleted=' + encodeURIComponent(id));
    const redirectTarget = '/inventory-dashboard-' + APP_ID + '?' + params.join('&');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(err);
  }
});

app.get('/inventory-dashboard-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const msg = deletedId ? 'Deleted inventory item ' + deletedId : '';

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
    const id = (req.body.recipeId || '').trim();
    const bodyUserId = sanitiseString(req.body && req.body.userId);
    const userId = bodyUserId ? bodyUserId.toUpperCase() : '';
    if (!id) {
      return res.render('delete-recipe-31477046.html', {
        error: 'recipeId is required',
        lastId: '',
        userId: userId,
        appId: APP_ID
      });
    }
    const result = await store.deleteRecipe(id);
    if (!result || result.deletedCount === 0) {
      return res.render('delete-recipe-31477046.html', {
        error: 'Recipe not found',
        lastId: id,
        userId: userId,
        appId: APP_ID
      });
    }
    const params = [];
    if (userId) {
      params.push('userId=' + encodeURIComponent(userId));
    }
    params.push('deleted=' + encodeURIComponent(id));
    const redirectTarget = '/recipes-list-' + APP_ID + '?' + params.join('&');
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(err);
  }
});

app.post('/add-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const payload = parseRecipeForm(req.body || {});
    const recipe = await store.createRecipe(payload);
    const redirectUserId = sanitiseString(payload.userId).toUpperCase();
    const params = [];
    if (redirectUserId) {
      params.push('userId=' + encodeURIComponent(redirectUserId));
    }
    const redirectTarget = '/recipes-list-' + APP_ID + (params.length ? '?' + params.join('&') : '');
    if (recipe && recipe.recipeId) {
      return res.redirect(302, redirectTarget);
    }
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(normaliseError(err));
  }
});

app.post('/add-inventory-' + APP_ID, async function (req, res, next) {
  try {
    const payload = parseInventoryForm(req.body || {});
    const item = await store.createInventoryItem(payload);
    const redirectUserId = sanitiseString(payload.userId).toUpperCase();
    const params = [];
    if (redirectUserId) {
      params.push('userId=' + encodeURIComponent(redirectUserId));
    }
    const redirectTarget = '/inventory-dashboard-' + APP_ID + (params.length ? '?' + params.join('&') : '');
    if (item && item.inventoryId) {
      return res.redirect(302, redirectTarget);
    }
    return res.redirect(302, redirectTarget);
  } catch (err) {
    next(normaliseError(err));
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
