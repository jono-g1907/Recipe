// Simple permission helpers that wrap the business rules around who can access
// different parts of the app. Keeping rules centralised prevents inconsistent
// checks across routes and controllers.
const ALLOWED_INVENTORY_ROLES = ['chef', 'manager', 'admin'];

function normaliseRole(value) {
  // Convert any incoming value to a lowercase string so comparisons are easy
  // and do not crash when `value` is null or undefined.
  return (value || '').toString().trim().toLowerCase();
}

function userCanAccessRecipes(user) {
  // Only chefs should have access to the recipe area.
  return normaliseRole(user && user.role) === 'chef';
}

function userCanViewRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    // If no specific recipe is requested we just check the general access rule.
    return true;
  }

  return true;
}

function userCanModifyRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    // Without a target recipe we can't determine ownership, so block the edit.
    return false;
  }

  // Only allow users to modify their own recipes.
  return recipe.userId === user.userId;
}

function userCanAccessInventory(user) {
  const role = normaliseRole(user && user.role);
  // The inventory area is shared by multiple roles, so check against the
  // allowed list.
  return ALLOWED_INVENTORY_ROLES.indexOf(role) !== -1;
}

module.exports = {
  userCanAccessRecipes,
  userCanViewRecipe,
  userCanModifyRecipe,
  userCanAccessInventory
};
