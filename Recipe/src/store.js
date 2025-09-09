const Recipe = require('./models/Recipe');
const InventoryItem = require('./models/InventoryItem');
const seed = require('./seed');

const recipes = [];
const inventory = [];

for (let i = 0; i < seed.RECIPE_SEED.length; i++) {
  try { 
    recipes.push(new Recipe(seed.RECIPE_SEED[i])); 
  } catch (e) { 
    console.error('Bad recipe seed', i, e); 
  }
}

for (let i = 0; i < seed.INVENTORY_SEED.length; i++) {
  try { 
    inventory.push(new InventoryItem(seed.INVENTORY_SEED[i])); 
  } catch (e2) { 
    console.error('Bad inventory seed', i, e2); 
  }
}

module.exports = { recipes: recipes, inventory: inventory };