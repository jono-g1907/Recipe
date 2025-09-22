const path = require('path');
const express = require('express');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const apiRouter = require('./routes');

const app = express();
app.set('port', 8080);

// parse json bodies for api
app.use(express.json());

// parse urlencoded bodies for api
app.use(express.urlencoded({ extended: true }));

// serve bootstrap locally
app.use('/bootstrap', express.static(
  path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css')
));

// configure ejs to render html files
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// serve static files
app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));


// dashboard
app.get('/', function (req, res) {
  const store = require('./store');
  const totalRecipes = store.recipes.length;
  const totalInventory = store.inventory.length;

  const cuisines = [];
  for (let i = 0; i < store.recipes.length; i++) {
    const c = store.recipes[i].cuisineType;
    if (c && cuisines.indexOf(c) === -1) {
      cuisines.push(c);
    }
  }
  const cuisineCount = cuisines.length;

  let value = 0;
  for (let j = 0; j < store.inventory.length; j++) {
    const cost = Number(store.inventory[j].cost);
    if (!isNaN(cost)) {
      value = value + cost;
    }
  }
  
  res.render('index.html', {
    username: 'Jonathan Gan',
    id: '31477046',
    totalRecipes: totalRecipes,
    totalInventory: totalInventory,
    cuisineCount: cuisineCount,
    inventoryValue: value
  });
});

// show add recipe form
app.get('/add-recipe-31477046', function (req, res) {
  res.render('add-recipe-31477046.html');
});

// show add inventory form
app.get('/add-inventory-31477046', function (req, res){
  res.render('add-inventory-31477046.html');
});

// recipes table page
app.get('/recipes-list-31477046', function (req, res) {
  const store = require('./store');
  const recipes = [];
  for (let i = 0; i < store.recipes.length; i++) {
    recipes.push(store.recipes[i].toJSON());
  }
  let msg = '';
  if (req.query.deleted) msg = 'Deleted recipe ' + req.query.deleted;
  res.render('recipes-list-31477046.html', { recipes: recipes, msg: msg });
});

// show delete recipe form
app.get('/delete-recipe-31477046', function (req, res) {
  const error = req.query.error || '';
  const lastId = req.query.lastId || '';
  res.render('delete-recipe-31477046.html', { error: error, lastId: lastId });
});

// show delete inventory form
app.get('/delete-inventory-31477046', function (req, res) {
  const error = req.query.error || '';
  const lastId = req.query.lastId || '';
  res.render('delete-inventory-31477046.html', { error: error, lastId: lastId });
});

// handle delete inventory form POST
app.post('/delete-inventory-31477046', function (req, res) {
  const id = (req.body.inventoryId || '').trim();

  if (!id) {
    // stay on form and show message
    return res.render('delete-inventory-31477046.html', { error: 'inventoryId is required', lastId: '' });
  }

  const store = require('./store');

  // find item index
  var foundIndex = -1;
  for (var i = 0; i < store.inventory.length; i++) {
    if (store.inventory[i].inventoryId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    // not found, keep what they typed so they can try again
    return res.render('delete-inventory-31477046.html', { error: 'Inventory item not found', lastId: id });
  }

  // delete and redirect back to dashboard with a success message
  store.inventory.splice(foundIndex, 1);
  return res.redirect(302, '/inventory-dashboard-31477046?deleted=' + encodeURIComponent(id));
});


// inventory dashboard
app.get('/inventory-dashboard-31477046', function (req, res) {
  var store = require('./store');
  var constants = require('./lib/constants');
  var APP_ID = constants.APP_ID;

  // copy items out
  var rows = [];
  for (var i = 0; i < store.inventory.length; i++) {
    rows.push(store.inventory[i].toJSON());
  }

  // date helpers
  function parseDate(s) {
    if (!s) return null;
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function daysUntil(s) {
    var d = parseDate(s);
    if (!d) return null;
    var now = new Date();
    var ms = d.getTime() - now.getTime();
    var days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return days;
  }

  // daysLeft + status
  for (var j = 0; j < rows.length; j++) {
    var dd = daysUntil(rows[j].expirationDate);
    rows[j].daysLeft = dd;
    if (dd === null) {
      rows[j].expiryStatus = 'unknown';
    } else if (dd < 0) {
      rows[j].expiryStatus = 'expired';
    } else if (dd <= 3) {
      rows[j].expiryStatus = 'soon';
    } else {
      rows[j].expiryStatus = 'ok';
    }
  }

  // total value (sum of cost)
  var totalValue = 0;
  for (var k = 0; k < rows.length; k++) {
    var c = Number(rows[k].cost);
    if (Number.isFinite(c)) totalValue += c;
  }

  // grouping: location (default) or category
  var groupBy = req.query.group === 'category' ? 'category' : 'location';
  var groups = {};
  for (var m = 0; m < rows.length; m++) {
    var key = rows[m][groupBy] || 'Unspecified';
    if (!groups[key]) groups[key] = { items: [], value: 0 };
    groups[key].items.push(rows[m]);
    var cc = Number(rows[m].cost);
    if (Number.isFinite(cc)) groups[key].value += cc;
  }

  var msg = '';
  if (req.query.deleted) msg = 'Deleted inventory item ' + req.query.deleted;

  res.render('inventory-dashboard-31477046.html', {
    groupBy: groupBy,
    groups: groups,
    totalValue: totalValue,
    appId: APP_ID,
    msg: msg,
    itemCount: rows.length
  });
});


// handle delete recipe form POST
app.post('/delete-recipe-31477046', function (req, res) {
  const id = (req.body.recipeId || '').trim();
  if (!id) {
    // stay on form and show message
    return res.render('delete-recipe-31477046.html', { error: 'recipeId is required', lastId: '' });
  }

  const store = require('./store');
  let foundIndex = -1;
  for (var i = 0; i < store.recipes.length; i++) {
    if (store.recipes[i].recipeId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    // if not found, stay on form with error + keep what they typed
    return res.render('delete-recipe-31477046.html', { error: 'Recipe not found', lastId: id });
  }

  // delete and redirect to list with a success message
  store.recipes.splice(foundIndex, 1);
  return res.redirect(302, '/recipes-list-31477046?deleted=' + encodeURIComponent(id));
});


// handle the add recipe form POST, do simple parsing then validate
app.post('/add-recipe-31477046', function (req, res, next) {
  try {
    // pull simple fields
    const payload = {};
    payload.recipeId = (req.body.recipeId || '').trim();
    payload.title = (req.body.title || '').trim();
    payload.mealType = (req.body.mealType || '').trim();
    payload.cuisineType = (req.body.cuisineType || '').trim();
    payload.prepTime = Number((req.body.prepTime || '').trim());
    payload.difficulty = (req.body.difficulty || '').trim();
    payload.servings = Number((req.body.servings || '').trim());
    payload.chef = (req.body.chef || '').trim();
    payload.createdDate = (req.body.createdDate || '').trim();

    // parse ingredients entered as one per line: name | quantity | unit
    const ingText = req.body.ingredientsText || '';
    const ingLines = ingText.split('\n');
    const ingredients = [];
    for (let i = 0; i < ingLines.length; i++) {
      const line = ingLines[i].trim();
      if (!line) continue;
      const parts = line.split('|');
      const name = (parts[0] || '').trim();
      const quantity = Number((parts[1] || '').trim());
      const unit = (parts[2] || '').trim();
      ingredients.push({
        ingredientName: name,
        quantity: quantity,
        unit: unit
      });
    }
    payload.ingredients = ingredients;

    // parse instructions entered as one per line
    const insText = req.body.instructionsText || '';
    const insLines = insText.split('\n');
    const instructions = [];
    for (let i = 0; i < insLines.length; i++) {
      const line = insLines[i].trim();
      if (line) instructions.push(line);
    }
    payload.instructions = instructions;

    // create and store
    const Recipe = require('./models/Recipe');
    const ValidationError = require('./errors/ValidationError');
    const store = require('./store');

    const rec = new Recipe(payload);
    for (let j = 0; j < store.recipes.length; j++) {
      if (store.recipes[j].recipeId === rec.recipeId) {
        throw new ValidationError(['recipeId already exists']);
      }
    }

    store.recipes.push(rec);
    
    // redirect to the recipe list
    res.redirect(302, '/recipes-list-31477046');
  } catch (err) {
    return next(err);
  }
});

// handle add inventory form POST
app.post('/add-inventory-31477046', function (req, res, next) {
  try {
    const payload = {};
    payload.inventoryId = (req.body.inventoryId || '').trim();
    payload.userId = (req.body.userId || '').trim();
    payload.ingredientName = (req.body.ingredientName || '').trim();
    payload.quantity = Number(req.body.quantity);
    payload.unit = (req.body.unit || '').trim();
    payload.category = (req.body.category || '').trim();
    payload.purchaseDate = (req.body.purchaseDate || '').trim();
    payload.expirationDate = (req.body.expirationDate || '').trim();
    payload.location = (req.body.location || '').trim();
    payload.cost = Number(req.body.cost);
    payload.createdDate = (req.body.createdDate || '').trim();

    const InventoryItem = require('./models/InventoryItem');
    const ValidationError = require('./errors/ValidationError');
    const store = require('./store');

    // construct & validate
    const item = new InventoryItem(payload);

    // duplicate check by id
    for (let i = 0; i < store.inventory.length; i++) {
      if (store.inventory[i].inventoryId === item.inventoryId) {
        throw new ValidationError(['inventoryId already exists']);
      }
    }

    store.inventory.push(item);

    // redirect to list inventory items
    return res.redirect(302, '/inventory-dashboard-31477046');
  } catch (err) {
    
    return next(err);
  }
});


// allow plain html files in views (invalid.html, 404.html) BUT don't auto-serve index.html
app.use(express.static(path.join(__dirname, 'views'), { index: false }));

// mount api
app.use('/api', apiRouter);

// 404 for anything that didn't match above
app.use(notFound);

// central error handler
app.use(errorHandler);

// start server
app.listen(app.get('port'), function () {
  console.log('Server running at http://localhost:' + app.get('port') + '/');
  console.log('API base: http://localhost:' + app.get('port') + '/api');
});
