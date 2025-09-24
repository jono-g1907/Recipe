const enums = require('../enums');

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

module.exports = {
  ROLE_OPTIONS,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  NAME_REGEX,
  RECIPE_ID_REGEX,
  INVENTORY_ID_REGEX,
  USER_ID_REGEX,
  RECIPE_TITLE_REGEX,
  CHEF_REGEX,
  INGREDIENT_NAME_REGEX,
  MEAL_TYPE_OPTIONS,
  CUISINE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  UNIT_OPTIONS,
  INVENTORY_CATEGORY_OPTIONS,
  LOCATION_OPTIONS
};
