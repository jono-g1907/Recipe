const utils = require('../lib/utils');
const sanitiseString = utils.sanitiseString;
const toFiniteNumber = utils.toFiniteNumber;
const clone = utils.clone;

const ValidationError = require('../errors/ValidationError');
const enums = require('../enums');
const Difficulty = enums.Difficulty;
const MealType = enums.MealType;

/**
 * @typedef {Object} Ingredient
 * @property {string} ingredientName
 * @property {number} quantity
 * @property {string} unit
 */

// ingredient validation
function validateIngredient(ing, pathPrefix) {
  pathPrefix = pathPrefix || 'ingredients'; // default pathPrefix (used in error messages) to ingredients
  let errors = []; 
  let name = sanitiseString(ing && ing.ingredientName);
  let quantity = toFiniteNumber(ing && ing.quantity);
  let unit = sanitiseString(ing && ing.unit);

  if (!name) errors.push(pathPrefix + '.ingredientName is required'); // non-empty ingredient name
    
  // quantity finite and positive
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push(pathPrefix + '.quantity must be a positive number');
  }
  if (!unit) errors.push(pathPrefix + '.unit is required')

  return errors;
}

// constructor that assigns and validates a create
function Recipe(data) { 
    this._assignAndValidate(data, false); 
}

// convenient way for new Recipe
Recipe.from = function (data) { 
    return new Recipe(data); 
};

// instance method for partial updates
Recipe.prototype.update = function (partial) { 
    this._assignAndValidate(partial, true); 
};

// plain object clone for serialisation
Recipe.prototype.toJSON = function () {
  return clone({
    recipeId: this.recipeId,
    title: this.title,
    ingredients: clone(this.ingredients),
    instructions: clone(this.instructions),
    mealType: this.mealType,
    cuisineType: this.cuisineType,
    prepTime: this.prepTime,
    difficulty: this.difficulty,
    servings: this.servings,
    chef: this.chef,
    createdDate: this.createdDate
  });
};

// assignment and validation
Recipe.prototype._assignAndValidate = function (patch, isPatch) {
  const prev = typeof this.toJSON === 'function' ? this.toJSON() : null; // if already exist, start from copy else start from null
  const next = prev ? clone(prev) : {}; // for updating on top of shallow copy

  // on create (!isPatch) every field is considered
  // on patch, only affected fields are considered
  if (!isPatch || patch.recipeId !== undefined) next.recipeId = sanitiseString(patch.recipeId);
  if (!isPatch || patch.title !== undefined) next.title = sanitiseString(patch.title);

  // map each ingredient to a sanitised object
  if (!isPatch || patch.ingredients !== undefined) {
    if (Array.isArray(patch.ingredients)) {
      const arr = [];
      for (let i = 0; i < patch.ingredients.length; i++) {
        const ing = patch.ingredients[i] || {};
        arr.push({
          ingredientName: sanitiseString(ing.ingredientName),
          quantity: toFiniteNumber(ing.quantity),
          unit: sanitiseString(ing.unit)
        });
      }
      next.ingredients = arr;
    } else {
      next.ingredients = undefined;
    }
  }

  // sanitise each step and drop false ones
  if (!isPatch || patch.instructions !== undefined) {
    if (Array.isArray(patch.instructions)) {
      const steps = [];
      for (let i = 0; i < patch.instructions.length; i++) {
        const s = sanitiseString(patch.instructions[i]);
        if (s) steps.push(s);
      }
      next.instructions = steps;
    } else {
      next.instructions = undefined;
    }
  }

  // all other basic fields
  if (!isPatch || patch.mealType !== undefined) next.mealType = sanitiseString(patch.mealType);
  if (!isPatch || patch.cuisineType !== undefined) next.cuisineType = sanitiseString(patch.cuisineType);
  if (!isPatch || patch.prepTime !== undefined) next.prepTime = toFiniteNumber(patch.prepTime);
  if (!isPatch || patch.difficulty !== undefined) next.difficulty = sanitiseString(patch.difficulty);
  if (!isPatch || patch.servings !== undefined) next.servings = toFiniteNumber(patch.servings);
  if (!isPatch || patch.chef !== undefined) next.chef = sanitiseString(patch.chef);

  // new date for creating recipe or update date
  if (!isPatch || patch.createdDate !== undefined) {
    let d = patch && patch.createdDate !== undefined ? new Date(patch.createdDate) : (prev ? prev.createdDate : null);
    if (!isPatch && patch.createdDate === undefined) d = new Date();
    if (!(d instanceof Date) || isNaN(d.getTime())) d = new Date();
    next.createdDate = d;
  }

  // collect validation errors for next state
  let errors = [];

  // validation checks for emptiness
  if (!next.recipeId) errors.push('recipeId is required');
  if (!next.title) errors.push('title is required');

  if (!isPatch || next.ingredients !== undefined) {
    if (!Array.isArray(next.ingredients) || next.ingredients.length === 0) {
      errors.push('ingredients must be a non-empty array');
    } else {
      // validate every ingredient
      for (let i = 0; i < next.ingredients.length; i++) {
        const more = validateIngredient(next.ingredients[i], 'ingredients[' + i + ']'); // prefix with index for more clear messages
        errors = errors.concat(more);
      }
    }
  }

  if (!isPatch || next.instructions !== undefined) {
    if (!Array.isArray(next.instructions) || next.instructions.length === 0) {
      errors.push('instructions must be a non-empty array of steps');
    }
  }

  if (!isPatch || next.mealType !== undefined) {
    const allowedMealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
    if (allowedMealTypes.indexOf(next.mealType) === -1) {
      errors.push('mealType must be one of: ' + allowedMealTypes.join(', '));
    }
  }

  if (!isPatch || next.prepTime !== undefined) {
    if (!Number.isFinite(next.prepTime) || next.prepTime <= 0) {
      errors.push('prepTime must be a positive number (minutes)');
    }
  }

  if (!isPatch || next.servings !== undefined) {
    if (!Number.isFinite(next.servings) || next.servings <= 0) {
      errors.push('servings must be a positive number');
    }
  }

  if (!isPatch || next.difficulty !== undefined) {
    const allowedDifficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
    if (allowedDifficulties.indexOf(next.difficulty) === -1) {
      errors.push('difficulty must be one of: ' + allowedDifficulties.join(', '));
    }
  }

  if (!isPatch || next.chef !== undefined) {
    if (!next.chef) errors.push('chef is required');
  }

  if (errors.length) throw new ValidationError(errors);

  for (const k in next) {
    this[k] = next[k];
  }
};

module.exports = Recipe;