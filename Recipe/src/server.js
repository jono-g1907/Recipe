const path = require('path');
const express = require('express');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const apiRouter = require('./routes');
const constants = require('./lib/constants');
const store = require('./store');

const app = express();
app.set('port', 8080);

// parse json bodies for api
app.use(express.json());
// also allow simple html forms if needed
app.use(express.urlencoded({ extended: true }));

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

// add recipe form 
app.get('/add-recipe', function (req, res) {
    res.render('add-recipe.html', { appId: constants.APP_ID });
  });
  
  // recipes table 
  app.get('/recipes', function (req, res) {
    // turn model instances into plain objects for rendering
    const records = [];
    for (let i = 0; i < store.recipes.length; i++) {
      records.push(store.recipes[i].toJSON());
    }
    res.render('recipes.html', { records: records, appId: constants.APP_ID });
  });
  

// allow plain html files in views but don't auto-serve index.html
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
