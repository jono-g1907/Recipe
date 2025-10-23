// simple permission helpers to wrap the business rules around who can access different parts of the app
// keeping rules centralised prevents inconsistent checks across routes and controllers
const ALLOWED_INVENTORY_ROLES = ['chef', 'manager', 'admin'];

function normaliseRole(value) {
  // convert any incoming value to a lowercase string so comparisons are easy and do not crash when null or undefined
  return (value || '').toString().trim().toLowerCase();
}

function userCanAccessRecipes(user) {
  // only chefs have access to the recipe area
  return normaliseRole(user && user.role) === 'chef';
}

function userCanViewRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    // if no specific recipe is requested we just check the general access rule
    return true;
  }

  return true;
}

function userCanModifyRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    // without a target recipe we can't determine ownership, so block the edit
    return false;
  }

  // only allow users to modify their own recipes
  return recipe.userId === user.userId;
}

function userCanAccessInventory(user) {
  const role = normaliseRole(user && user.role);
  // the inventory area is shared by all roles
  return ALLOWED_INVENTORY_ROLES.indexOf(role) !== -1;
}

module.exports = {
  userCanAccessRecipes,
  userCanViewRecipe,
  userCanModifyRecipe,
  userCanAccessInventory
};