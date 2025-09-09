const express = require('express');
const router = express.Router();
const recipesRouter = require('./recipes');
const inventoryRouter = require('./inventory');

router.use(recipesRouter);
router.use(inventoryRouter);

module.exports = router;