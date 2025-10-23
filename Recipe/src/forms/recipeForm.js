// helpers keep the form logic consistent across the application
const { sanitiseString } = require('../lib/utils');
const {
  RECIPE_ID_REGEX,
  USER_ID_REGEX,
  RECIPE_TITLE_REGEX,
  CHEF_REGEX,
  INGREDIENT_NAME_REGEX,
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  UNIT_OPTIONS
} = require('../lib/validationConstants');
const { toIsoDate } = require('../lib/date');

// completely blank template for inventory form
// copy this whenever we need to render an empty form so we do not mutate the original object by accident
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

// give callers a fresh copy of the default form values
function getEmptyRecipeFormValues() {
  return Object.assign({}, EMPTY_RECIPE_FORM_VALUES);
}

// dropdowns should be treated case insensitively so users can submit values like dinner and still match the stored option Dinner
// When the value is not found we keep the user's text so validation can display a helpful message later
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

// prepare raw request data so it can be redisplayed in the form if validation fails
// keep everything as strings because that is what HTML form inputs expect 
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

// turn a stored recipe document into form valuew
// used when editing a recipe so the form shows the existing data
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
  
  // recipes store ingredients as structured objects, but the form uses a single textarea 
  // convert each ingredient into a pipe-delimited line so it can be re-parsed later
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

  // clean up each instruction step so the textarea shows one step per line
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

// check whether the recipe object is complete 
// returned array contains errors that can be displayed directly in the UI
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

  if (!(recipe.createdDate instanceof Date) || Number.isNaN(recipe.createdDate.getTime())) {
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

// convert a submitted form back into a recipe object 
// normalise each field into consistent format
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
  recipe.prepTime = prepInput ? Number(prepInput) : Number.NaN;
  recipe.difficulty = normaliseSelectValue(body && body.difficulty, DIFFICULTY_OPTIONS);
  const servingsInput = sanitiseString(body && body.servings);
  recipe.servings = servingsInput ? Number(servingsInput) : Number.NaN;
  recipe.chef = sanitiseString(body && body.chef);
  const createdInput = sanitiseString(body && body.createdDate);
  recipe.createdDate = createdInput ? new Date(createdInput) : new Date();

  // aach ingredient line uses the format name | quantity | unit
  const ingText = body && body.ingredientsText ? body.ingredientsText : '';
  const ingLines = ingText.split('\n');
  const ingredients = [];
  for (let i = 0; i < ingLines.length; i++) {
    const line = sanitiseString(ingLines[i]);
    if (!line) continue;
    // each line is expected to look like name | quantity | unit, so split the chunks around the pipes
    const parts = line.split('|');
    const name = sanitiseString(parts[0]);
    const quantityInput = sanitiseString(parts[1]);
    const quantity = quantityInput ? Number(quantityInput) : Number.NaN;
    const unit = sanitiseString(parts[2]).toLowerCase();
    ingredients.push({
      ingredientName: name,
      quantity: quantity,
      unit: unit
    });
  }
  recipe.ingredients = ingredients;

  const insText = body && body.instructionsText ? body.instructionsText : '';
  const insLines = insText.split('\n');
  const instructions = [];
  for (let j = 0; j < insLines.length; j++) {
    const line = sanitiseString(insLines[j]);
    if (line) instructions.push(line);
  }
  recipe.instructions = instructions;

  return recipe;
}

// convert a recipe object into plain values for the front-end templates
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

module.exports = {
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  UNIT_OPTIONS,
  RECIPE_ID_REGEX,
  RECIPE_TITLE_REGEX,
  INGREDIENT_NAME_REGEX,
  getEmptyRecipeFormValues,
  buildRecipeFormValuesFromBody,
  buildRecipeFormValuesFromRecipe,
  collectRecipeErrors,
  parseRecipeForm,
  mapRecipeForView
};