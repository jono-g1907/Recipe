// This file acts as the "traffic controller" for all of the route modules in
// the application.  Anything that starts with `/src/routes` comes through this
// router first, and we forward the request to the feature-specific routers.
const express = require('express');

// Creating a new router instance keeps our route definitions isolated from the
// main Express app, which helps with organisation and testing.
const router = express.Router();

// Import the routers that know how to handle recipe- and inventory-related
// requests.
const recipesRouter = require('./recipes');
const inventoryRouter = require('./inventory');

// Plug the feature routers into this parent router. Express will look inside
// each router and match incoming requests to the first route that fits.
router.use(recipesRouter);
router.use(inventoryRouter);

// Exporting the router lets `src/server/server.js` (and any tests) mount it on
// the main Express application instance.
module.exports = router;
