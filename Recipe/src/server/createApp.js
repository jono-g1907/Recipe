// Node's built-in helper for working with file system paths in a safe way.
const path = require('path');
// Express is the web framework that powers the HTTP server.
const express = require('express');
// Application level constants (for example, the app id shared by the front end).
const constants = require('../lib/constants');
// The API router handles all JSON endpoints under the /api prefix.
const apiRouter = require('../routes');
// Middleware that responds with a 404 page when no route matches.
const notFound = require('../middleware/notFound');
// Middleware that catches errors thrown from routes and shows a friendly message.
const errorHandler = require('../middleware/error');
// Function that attaches all of the HTML page routes to the app instance.
const registerPageRoutes = require('./routes');

function createApp(dependencies) {
  // Allow dependency injection during testing, but fall back to the real store in production.
  const store = dependencies && dependencies.store ? dependencies.store : require('../store');
  const appId = constants.APP_ID;
  // Create the express application instance.
  const app = express();

  // Configure the port (used by "npm start") that the server should listen on.
  app.set('port', 8080);
  // Enable automatic parsing of JSON request bodies.
  app.use(express.json());
  // Enable parsing of form submissions (e.g. from HTML forms).
  app.use(express.urlencoded({ extended: true }));

  // Serve the Bootstrap CSS file from node_modules at a predictable URL.
  app.use(
    '/bootstrap',
    express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/css/bootstrap.min.css'))
  );

  // Serve the Bootstrap JS bundle when the browser requests it.
  app.get('/bootstrap.bundle.min.js', function (req, res) {
    res.sendFile(path.join(__dirname, '../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
  });

  // Configure Express to look for HTML templates in the "views" directory and render them with EJS.
  app.set('views', path.join(__dirname, '../views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

  // Serve static assets (images, stylesheets, and standalone HTML files).
  app.use(express.static(path.join(__dirname, '../images')));
  app.use(express.static(path.join(__dirname, '../css')));
  app.use(express.static(path.join(__dirname, '../views'), { index: false }));

  // Register all page routes (login, dashboard, etc.).
  registerPageRoutes(app, { store: store, appId: appId });

  // Register the JSON API routes under the /api namespace.
  app.use('/api', apiRouter);
  // Attach the 404 and error-handling middleware last so they catch unmatched routes or thrown errors.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
