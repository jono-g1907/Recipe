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


// runs before any static files
app.get('/', function (req, res) {
  res.render('index.html', {
    username: 'Jonathan Gan',
    id: '31477046'
  });
});

// show add recipe form
app.get('/add-recipe', function (req, res) {
  res.render('add-recipe.html');
});

// recipes table page
app.get('/recipes-list', function (req, res) {
  const store = require('./store');
  const recipes = [];
  for (let i = 0; i < store.recipes.length; i++) {
    recipes.push(store.recipes[i].toJSON());
  }
  const msg = '';
  if (req.query.deleted) msg = 'Deleted recipe ' + req.query.deleted;
  res.render('recipes-list.html', { recipes: recipes, msg: msg });
});

// show delete recipe form
app.get('/delete-recipe', function (req, res) {
  var error = req.query.error || '';
  var lastId = req.query.lastId || '';
  res.render('delete-recipe.html', { error: error, lastId: lastId });
});

// handle delete recipe form POST
app.post('/delete-recipe', function (req, res) {
  var id = (req.body.recipeId || '').trim();
  if (!id) {
    // stay on form and show message
    return res.render('delete-recipe.html', { error: 'recipeId is required', lastId: '' });
  }

  var store = require('./store');
  var foundIndex = -1;
  for (var i = 0; i < store.recipes.length; i++) {
    if (store.recipes[i].recipeId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    // if not found, stay on form with error + keep what they typed
    return res.render('delete-recipe.html', { error: 'Recipe not found', lastId: id });
  }

  // delete and redirect to list with a success message
  store.recipes.splice(foundIndex, 1);
  return res.redirect(302, '/recipes-list?deleted=' + encodeURIComponent(id));
});


// handle the add recipe form POST, do simple parsing then validate
app.post('/add-recipe', function (req, res, next) {
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
    res.redirect(302, '/recipes-list');
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
