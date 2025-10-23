// traffic controller for all of the route modules 
// anything that starts with /src/routes comes through this router first and  forward the request to the specific routers
const express = require('express');

const router = express.Router();

const recipesRouter = require('./recipes');
const inventoryRouter = require('./inventory');
const authRouter = require('./auth');

router.use(authRouter);
router.use(recipesRouter);
router.use(inventoryRouter);

module.exports = router;