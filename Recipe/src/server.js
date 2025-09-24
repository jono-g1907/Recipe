const path = require('path');
const express = require('express');
const constants = require('./lib/constants');
const enums = require('./enums');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const apiRouter = require('./routes');
const store = require('./store');
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

const APP_ID = constants.APP_ID;
const AUTHOR_NAME = constants.AUTHOR_NAME;

const ROLE_OPTIONS = ['admin', 'chef', 'manager'];
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
const NAME_REGEX = /^[A-Za-z\s\-']{2,100}$/;
const RECIPE_ID_REGEX = /^R-\d{5}$/;
const INVENTORY_ID_REGEX = /^I-\d{5}$/;
const USER_ID_REGEX = /^U-\d{5}$/;
const RECIPE_TITLE_REGEX = /^[A-Za-z0-9\s'\-\(\)]{3,100}$/;
const CHEF_REGEX = /^[A-Za-z\s'\-]{2,50}$/;
const INGREDIENT_NAME_REGEX = /^[A-Za-z\s'\-]{2,50}$/;

const MEAL_TYPE_OPTIONS = Object.values(enums.MealType);
const CUISINE_TYPE_OPTIONS = Object.values(enums.CuisineType);
const DIFFICULTY_OPTIONS = Object.values(enums.Difficulty);
const UNIT_OPTIONS = Object.values(enums.Unit);
const INVENTORY_CATEGORY_OPTIONS = Object.values(enums.InventoryCategory);
const LOCATION_OPTIONS = Object.values(enums.Location);

const EMPTY_RECIPE_FORM_VALUES = {
  recipeId: '',
  title: '',
  chef: '',
  mealType: '',
  cuisineType: '',
  difficulty: '',
  prepTime: '',
  servings: '',
  createdDate: '',
  ingredientsText: '',
  instructionsText: ''
};

function getEmptyRecipeFormValues() {
  return Object.assign({}, EMPTY_RECIPE_FORM_VALUES);
}

const EMPTY_INVENTORY_FORM_VALUES = {
  inventoryId: '',
  userId: '',
  ingredientName: '',
  quantity: '',
  unit: '',
  category: '',
  purchaseDate: '',
  expirationDate: '',
  location: '',
  cost: '',
  createdDate: ''
};

function getEmptyInventoryFormValues() {
  return Object.assign({}, EMPTY_INVENTORY_FORM_VALUES);
}

function normaliseSelectValue(value, options) {
  const trimmed = sanitiseString(value);
  if (!trimmed) {
    return '';
  }
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() === trimmed.toLowerCase()) {
      return options[i];
    }
  }
  return trimmed;
}

function buildRecipeFormValuesFromBody(body) {
  const values = getEmptyRecipeFormValues();
  if (!body) {
    return values;
  }
  values.recipeId = sanitiseString(body.recipeId).toUpperCase();
  values.title = sanitiseString(body.title);
  values.chef = sanitiseString(body.chef);
  values.mealType = normaliseSelectValue(body.mealType, MEAL_TYPE_OPTIONS);
  values.cuisineType = normaliseSelectValue(body.cuisineType, CUISINE_TYPE_OPTIONS);
  values.difficulty = normaliseSelectValue(body.difficulty, DIFFICULTY_OPTIONS);
  values.prepTime = sanitiseString(body.prepTime);
  values.servings = sanitiseString(body.servings);
  values.createdDate = sanitiseString(body.createdDate);
  values.ingredientsText = body.ingredientsText ? String(body.ingredientsText).replace(/\r\n/g, '\n') : '';
  values.instructionsText = body.instructionsText ? String(body.instructionsText).replace(/\r\n/g, '\n') : '';
  return values;
}

function buildRecipeFormValuesFromRecipe(recipe) {
  const values = getEmptyRecipeFormValues();
  if (!recipe) {
    return values;
  }

  values.recipeId = sanitiseString(recipe.recipeId).toUpperCase();
  values.title = sanitiseString(recipe.title);
  values.chef = sanitiseString(recipe.chef);
  values.mealType = sanitiseString(recipe.mealType);
  values.cuisineType = sanitiseString(recipe.cuisineType);
  values.difficulty = sanitiseString(recipe.difficulty);

  const prepTimeNumber = Number(recipe.prepTime);
  values.prepTime = Number.isFinite(prepTimeNumber) ? prepTimeNumber : '';

  const servingsNumber = Number(recipe.servings);
  values.servings = Number.isFinite(servingsNumber) ? servingsNumber : '';

  values.createdDate = toIsoDate(recipe.createdDate);

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const ingredientLines = [];
  for (let i = 0; i < ingredients.length; i++) {
    const entry = ingredients[i] || {};
    const name = sanitiseString(entry.ingredientName);
    const quantity = entry.quantity !== undefined && entry.quantity !== null ? String(entry.quantity) : '';
    const unit = sanitiseString(entry.unit);
    if (name || quantity || unit) {
      ingredientLines.push((name || '') + ' | ' + (quantity || '') + ' | ' + (unit || ''));
    }
  }
  values.ingredientsText = ingredientLines.join('\n');

  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const instructionLines = [];
  for (let j = 0; j < instructions.length; j++) {
    const step = sanitiseString(instructions[j]);
    if (step) {
      instructionLines.push(step);
    }
  }
  values.instructionsText = instructionLines.join('\n');

  return values;
}

function collectRecipeErrors(recipe) {
  const errors = [];

  if (!recipe.recipeId) {
    errors.push('Recipe ID is required.');
  } else if (!RECIPE_ID_REGEX.test(recipe.recipeId)) {
    errors.push('Recipe ID must follow the R-00000 format.');
  }

  if (!recipe.userId || !USER_ID_REGEX.test(recipe.userId)) {
    errors.push('A valid user ID is required.');
  }

  if (!recipe.title) {
    errors.push('Recipe title is required.');
  } else if (!RECIPE_TITLE_REGEX.test(recipe.title)) {
    errors.push('Recipe title must be 3-100 characters and can include letters, numbers, spaces, hyphens, apostrophes and parentheses.');
  }

  if (!recipe.chef) {
    errors.push('Chef name is required.');
  } else if (!CHEF_REGEX.test(recipe.chef)) {
    errors.push('Chef name must be 2-50 letters and can include spaces, hyphens and apostrophes.');
  }

  if (!recipe.mealType) {
    errors.push('Meal type is required.');
  } else if (MEAL_TYPE_OPTIONS.indexOf(recipe.mealType) === -1) {
    errors.push('Select a valid meal type.');
  }

  if (!recipe.cuisineType) {
    errors.push('Cuisine type is required.');
  } else if (CUISINE_TYPE_OPTIONS.indexOf(recipe.cuisineType) === -1) {
    errors.push('Select a valid cuisine type.');
  }

  if (!recipe.difficulty) {
    errors.push('Difficulty is required.');
  } else if (DIFFICULTY_OPTIONS.indexOf(recipe.difficulty) === -1) {
    errors.push('Select a valid difficulty option.');
  }

  if (!Number.isFinite(recipe.prepTime)) {
    errors.push('Preparation time must be a number.');
  } else if (!Number.isInteger(recipe.prepTime)) {
    errors.push('Preparation time must be a whole number of minutes.');
  } else if (recipe.prepTime < 1 || recipe.prepTime > 480) {
    errors.push('Preparation time must be between 1 and 480 minutes.');
  }

  if (!Number.isFinite(recipe.servings)) {
    errors.push('Servings must be a number.');
  } else if (!Number.isInteger(recipe.servings)) {
    errors.push('Servings must be a whole number.');
  } else if (recipe.servings < 1 || recipe.servings > 20) {
    errors.push('Servings must be between 1 and 20.');
  }

  if (!(recipe.createdDate instanceof Date) || isNaN(recipe.createdDate.getTime())) {
    errors.push('Created date must be a valid date.');
  } else {
    const now = new Date();
    if (recipe.createdDate.getTime() > now.getTime()) {
      errors.push('Created date cannot be in the future.');
    }
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (!ingredients.length) {
    errors.push('Add at least one ingredient.');
  } else if (ingredients.length > 20) {
    errors.push('You can list up to 20 ingredients.');
  } else {
    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i] || {};
      const name = sanitiseString(item.ingredientName);
      if (!name) {
        errors.push('Each ingredient needs a name.');
        break;
      }
      if (!INGREDIENT_NAME_REGEX.test(name)) {
        errors.push('Ingredient names can only use letters, spaces, hyphens and apostrophes (2-50 characters).');
        break;
      }
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity)) {
        errors.push('Ingredient quantities must be numbers.');
        break;
      }
      if (quantity <= 0 || quantity > 9999) {
        errors.push('Ingredient quantities must be between 0.01 and 9999.');
        break;
      }
      const unit = sanitiseString(item.unit).toLowerCase();
      if (UNIT_OPTIONS.indexOf(unit) === -1) {
        errors.push('Each ingredient must use one of the allowed units.');
        break;
      }
    }
  }

  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  if (!instructions.length) {
    errors.push('Provide at least one instruction step.');
  } else if (instructions.length > 15) {
    errors.push('Instructions can include up to 15 steps.');
  } else {
    for (let j = 0; j < instructions.length; j++) {
      const step = sanitiseString(instructions[j]);
      if (step.length < 10 || step.length > 500) {
        errors.push('Each instruction step must be between 10 and 500 characters.');
        break;
      }
    }
  }

  return errors;
}

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
  const recipeIdInput = sanitiseString(body && body.recipeId);
  recipe.recipeId = recipeIdInput ? recipeIdInput.toUpperCase() : '';
  const userIdInput = sanitiseString(body && body.userId);
  recipe.userId = userIdInput ? userIdInput.toUpperCase() : '';
  recipe.title = sanitiseString(body && body.title);
  recipe.mealType = normaliseSelectValue(body && body.mealType, MEAL_TYPE_OPTIONS);
  recipe.cuisineType = normaliseSelectValue(body && body.cuisineType, CUISINE_TYPE_OPTIONS);
  const prepInput = sanitiseString(body && body.prepTime);
  recipe.prepTime = prepInput ? Number(prepInput) : NaN;
  recipe.difficulty = normaliseSelectValue(body && body.difficulty, DIFFICULTY_OPTIONS);
  const servingsInput = sanitiseString(body && body.servings);
  recipe.servings = servingsInput ? Number(servingsInput) : NaN;
  recipe.chef = sanitiseString(body && body.chef);
  const createdInput = sanitiseString(body && body.createdDate);
  recipe.createdDate = createdInput ? new Date(createdInput) : new Date();

  const ingText = body.ingredientsText || '';
  const ingLines = ingText.split('\n');
  const ingredients = [];
  for (let i = 0; i < ingLines.length; i++) {
    const line = sanitiseString(ingLines[i]);
    if (!line) continue;
    const parts = line.split('|');
    const name = sanitiseString(parts[0]);
    const quantityInput = sanitiseString(parts[1]);
    const quantity = quantityInput ? Number(quantityInput) : NaN;
    const unit = sanitiseString(parts[2]).toLowerCase();
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
    const line = sanitiseString(insLines[j]);
    if (line) instructions.push(line);
  }
  recipe.instructions = instructions;

  return recipe;
}

function parseInventoryForm(body) {
  const item = {};
  item.inventoryId = (body.inventoryId || '').trim();
  const userIdInput = sanitiseString(body && body.userId);
  item.userId = userIdInput ? userIdInput.toUpperCase() : '';
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

function collectInventoryErrors(item) {
  const errors = [];
  if (!item) {
    errors.push('Inventory details are required.');
    return errors;
  }

  const inventoryId = sanitiseString(item.inventoryId).toUpperCase();
  if (!inventoryId) {
    errors.push('Inventory ID is required.');
  } else if (!INVENTORY_ID_REGEX.test(inventoryId)) {
    errors.push('Inventory ID must follow the I-00000 format.');
  }

  const userId = sanitiseString(item.userId).toUpperCase();
  if (!userId || !USER_ID_REGEX.test(userId)) {
    errors.push('A valid user ID is required.');
  }

  const name = sanitiseString(item.ingredientName);
  if (!name) {
    errors.push('Ingredient name is required.');
  } else if (!INGREDIENT_NAME_REGEX.test(name)) {
    errors.push('Ingredient names must be 2-50 characters using letters, spaces, hyphens or apostrophes.');
  }

  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity)) {
    errors.push('Quantity must be a number.');
  } else if (quantity <= 0 || quantity > 9999) {
    errors.push('Quantity must be between 0.01 and 9999.');
  }

  const unit = sanitiseString(item.unit).toLowerCase();
  if (!unit || UNIT_OPTIONS.indexOf(unit) === -1) {
    errors.push('Select a valid unit.');
  }

  const category = sanitiseString(item.category);
  if (!category || INVENTORY_CATEGORY_OPTIONS.indexOf(category) === -1) {
    errors.push('Select a valid category.');
  }

  const location = sanitiseString(item.location);
  if (!location || LOCATION_OPTIONS.indexOf(location) === -1) {
    errors.push('Select a valid location.');
  }

  const cost = Number(item.cost);
  if (!Number.isFinite(cost)) {
    errors.push('Cost must be a number.');
  } else if (cost < 0.01 || cost > 999.99) {
    errors.push('Cost must be between 0.01 and 999.99.');
  } else {
    const cents = Math.round(cost * 100);
    if (Math.abs(cost * 100 - cents) > 1e-6) {
      errors.push('Cost must have no more than two decimal places.');
    }
  }

  const purchaseDate = item.purchaseDate instanceof Date ? item.purchaseDate : new Date(item.purchaseDate);
  if (!(purchaseDate instanceof Date) || isNaN(purchaseDate.getTime())) {
    errors.push('Purchase date must be a valid date.');
  } else if (purchaseDate.getTime() > Date.now()) {
    errors.push('Purchase date cannot be in the future.');
  }

  const expirationDate = item.expirationDate instanceof Date ? item.expirationDate : new Date(item.expirationDate);
  if (!(expirationDate instanceof Date) || isNaN(expirationDate.getTime())) {
    errors.push('Expiration date must be a valid date.');
  } else if (!isNaN(purchaseDate.getTime()) && expirationDate.getTime() <= purchaseDate.getTime()) {
    errors.push('Expiration date must be after the purchase date.');
  }

  const createdDate = item.createdDate instanceof Date ? item.createdDate : new Date(item.createdDate);
  if (!(createdDate instanceof Date) || isNaN(createdDate.getTime())) {
    errors.push('Created date must be a valid date.');
  } else if (createdDate.getTime() > Date.now()) {
    errors.push('Created date cannot be in the future.');
  }

  return errors;
}

function buildInventoryFormValuesFromItem(item) {
  const values = getEmptyInventoryFormValues();
  if (!item) {
    return values;
  }

  values.inventoryId = sanitiseString(item.inventoryId).toUpperCase();
  values.userId = sanitiseString(item.userId).toUpperCase();
  values.ingredientName = sanitiseString(item.ingredientName);

  const quantityNumber = Number(item.quantity);
  values.quantity = Number.isFinite(quantityNumber) ? quantityNumber : '';

  values.unit = sanitiseString(item.unit).toLowerCase();
  values.category = sanitiseString(item.category);
  values.location = sanitiseString(item.location);

  const costNumber = Number(item.cost);
  if (Number.isFinite(costNumber)) {
    values.cost = (Math.round(costNumber * 100) / 100).toFixed(2);
  } else {
    values.cost = '';
  }

  values.purchaseDate = toIsoDate(item.purchaseDate);
  values.expirationDate = toIsoDate(item.expirationDate);
  values.createdDate = toIsoDate(item.createdDate);

  return values;
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
  const bodyUserId = sanitiseString(req.body && req.body.userId);
  const sourceId = queryUserId || bodyUserId;

  if (!sourceId) {
    return { error: 'Log in to access the dashboard.' };
  }

  const userId = sourceId.toUpperCase();
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
    const successMessage = req.query && req.query.success === '1' ? 'Login successful. Your account details are now loaded for new submissions.' : sanitiseString(req.query && req.query.successMessage);
    const errorMessage = sanitiseString(req.query && req.query.errorMessage);

    res.render('index.html', {
      username: user.fullname,
      email: sanitiseString(user.email),
      id: user.userId,
      totalRecipes: stats.recipeCount,
      totalInventory: stats.inventoryCount,
      userCount: stats.userCount,
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
    return renderRecipeForm(res, user, getEmptyRecipeFormValues(), '', 200);
  } catch (err) {
    next(err);
  }
});

app.get('/edit-recipe-' + APP_ID, async function (req, res, next) {
  try {
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;
    const allRecipes = await store.getAllRecipes();
    const myRecipes = allRecipes.filter(function (recipe) {
      return recipe && recipe.userId === user.userId;
    });

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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;
    const listResult = await store.listInventory({ userId: user.userId, page: 1, limit: 500, sort: '-createdDate' });
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
      errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'You have no inventory items to edit yet. Add an item first.';
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    const user = result.user;
    const recipes = await store.getAllRecipes();
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
    const rawId = sanitiseString(req.body && req.body.recipeId);
    const id = rawId ? rawId.toUpperCase() : '';
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
    const deletedRecipe = await store.deleteRecipe(id);
    if (!deletedRecipe) {
      return res.render('delete-recipe-31477046.html', {
        error: 'Recipe not found',
        lastId: rawId,
        userId: userId,
        appId: APP_ID
      });
    }
    const params = [];
    if (userId) {
      params.push('userId=' + encodeURIComponent(userId));
    }
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    activeUser = result.user;
    const allRecipes = await store.getAllRecipes();
    recipeOptions = allRecipes.filter(function (recipe) {
      return recipe && recipe.userId === activeUser.userId;
    });

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

    const updatedRecipe = await store.updateRecipe(existingRecipe.recipeId, patch);
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
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
    const result = await resolveActiveUser(req);
    if (!result.user) {
      return res.redirect(302, buildLoginRedirectUrl(result.error));
    }

    activeUser = result.user;
    const listResult = await store.listInventory({ userId: activeUser.userId, page: 1, limit: 500, sort: '-createdDate' });
    inventoryOptions = Array.isArray(listResult.items) ? listResult.items : [];

    const payload = parseInventoryForm(req.body || {});
    payload.userId = activeUser.userId;
    payload.inventoryId = payload.inventoryId ? payload.inventoryId.toUpperCase() : '';
    formValues = buildInventoryFormValuesFromItem(payload);

    if (!payload.inventoryId) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, '', formValues, 'Select an inventory item to update.', '', 400);
    }

    const existingItem = await store.getInventoryItemById(payload.inventoryId);
    if (!existingItem || existingItem.userId !== activeUser.userId) {
      return renderInventoryEditForm(res, activeUser, inventoryOptions, payload.inventoryId, formValues, 'Inventory item ' + payload.inventoryId + ' was not found for your account.', '', 404);
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