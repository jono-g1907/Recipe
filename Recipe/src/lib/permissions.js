const ALLOWED_INVENTORY_ROLES = ['chef', 'manager', 'admin'];

function normaliseRole(value) {
  return (value || '').toString().trim().toLowerCase();
}

function userCanAccessRecipes(user) {
  return normaliseRole(user && user.role) === 'chef';
}

function userCanViewRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    return true;
  }

  return true;
}

function userCanModifyRecipe(user, recipe) {
  if (!userCanAccessRecipes(user)) {
    return false;
  }

  if (!recipe) {
    return false;
  }

  return recipe.userId === user.userId;
}

function userCanAccessInventory(user) {
  const role = normaliseRole(user && user.role);
  return ALLOWED_INVENTORY_ROLES.indexOf(role) !== -1;
}

module.exports = {
  userCanAccessRecipes,
  userCanViewRecipe,
  userCanModifyRecipe,
  userCanAccessInventory
};
