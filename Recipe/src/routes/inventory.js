const express = require('express');
const router = express.Router();

const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;

const InventoryItem = require('../models/InventoryItem');

const ValidationError = require('../errors/ValidationError');

const store = require('../store');

function clientWantsHtml(req) {
  const a = req.headers && (req.headers['accept'] || '');
  return a.indexOf('text/html') !== -1;
}

function findInventoryById(id) {
  const list = store.inventory;

  for (let i = 0; i < list.length; i++) {
    if (list[i].inventoryId === id) return list[i];
  }

  return null;
}

const INVENTORY_BASE = '/inventory-' + APP_ID;

// list inventory items
router.get(INVENTORY_BASE, function (req, res) {
  const items = [];
  for (let i = 0; i < store.inventory.length; i++) {
    items.push(store.inventory[i].toJSON());
  }
  return res.json({ items: items, page: 1, total: items.length });
});


// create inventory item
router.post(INVENTORY_BASE, function (req, res, next) {
  try {
    const body = req.body || {};
    const item = new InventoryItem(body);

    for (let j = 0; j < store.inventory.length; j++) {
      if (store.inventory[j].inventoryId === item.inventoryId) {
        throw new ValidationError(['inventoryId already exists']);
      }
    }

    store.inventory.push(item);
    return res.status(201).json({ item: item.toJSON() });
  } catch (err) {
    return next(err);
  }
});

// adjust quantity, html requests with bad data should be redirected to invalid page
router.patch('/inventory/:inventoryId/adjust-' + APP_ID, function (req, res, next) {
  try {
    const item = findInventoryById(req.params.inventoryId);
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }

    const payload = req.body || {};
    const hasDiff = payload.diff !== undefined;
    const hasSet = payload.set !== undefined;

    if (hasDiff && hasSet) {
      throw new ValidationError(['Provide either difference or set, not both']);
    }

    if (hasDiff) {
      item.adjustQuantity(payload.diff);
    } else if (hasSet) {
      const desired = Number(payload.set);
      if (!Number.isFinite(desired)) {
        throw new ValidationError(['set must be a finite number']);
      }

      const difference = desired - item.quantity;
      item.adjustQuantity(difference);
    } else {
      throw new ValidationError(['Missing difference or set']);
    }

    return res.json({ item: item.toJSON() });
  } catch (err) {
    if (clientWantsHtml(req)) {
      return res.redirect(302, '/invalid.html');
    }
    return next(err);
  }
});

// delete inventory item
router.delete('/inventory/:inventoryId-' + APP_ID, function (req, res) {
  var id = req.params.inventoryId;
  var list = store.inventory;
  for (var i = 0; i < list.length; i++) {
    if (list[i].inventoryId === id) {
      list.splice(i, 1);
      return res.status(204).send();
    }
  }
  return res.status(404).json({ error: 'Inventory item not found' });
});

module.exports = router;