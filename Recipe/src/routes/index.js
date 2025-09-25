const express = require('express');
const router = express.Router();
const recipesRouter = require('./recipes');
const inventoryRouter = require('./inventory');
const analyticsRouter = require('./analytics');

router.use(recipesRouter);
router.use(inventoryRouter);
router.use(analyticsRouter);

module.exports = router;