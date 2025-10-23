const express = require('express');
const constants = require('../lib/constants');
const store = require('../store');

const router = express.Router();
const APP_ID = constants.APP_ID;

router.get('/dashboard-stats-' + APP_ID, async function (req, res, next) {
  try {
    const stats = await store.getDashboardStats();
    return res.json({ success: true, stats: stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
