const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;
const store = require('../store');
const ValidationError = require('../errors/ValidationError');

const CREATE_PATH = '/add-inventory-' + APP_ID;
const LIST_PATH = '/inventory-dashboard-' + APP_ID;
const GET_ONE_PATH = '/inventory-dashboard/:inventoryId-' + APP_ID;
const UPDATE_PATH = '/inventory-dashboard/:inventoryId/update-' + APP_ID;
const DELETE_PATH = '/inventory-dashboard/:inventoryId-' + APP_ID;

const CATEGORY_OPTIONS = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
const LOCATION_OPTIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];
const UNIT_OPTIONS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

function clientWantsHtml(req) {
  const a = req.headers && (req.headers['accept'] || '');
  return a.indexOf('text/html') !== -1;
}

function normaliseError(err) {
  if (!err) return err;

  if (err instanceof ValidationError) {
    return err;
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = [];
    for (const key in err.errors) {
      if (Object.prototype.hasOwnProperty.call(err.errors, key)) {
        messages.push(err.errors[key].message);
      }
    }
    return new ValidationError(messages);
  }

  if (err.code === 11000) {
    const details = [];
    if (err.keyValue) {
      for (const key in err.keyValue) {
        if (Object.prototype.hasOwnProperty.call(err.keyValue, key)) {
          details.push(key + ' already exists');
        }
      }
    }
    if (!details.length) {
      details.push('Duplicate value not allowed');
    }
    return new ValidationError(details);
  }

  if (err.message && err.message.indexOf('Quantity cannot be negative') !== -1) {
    return new ValidationError([err.message]);
  }

  return err;
}

function normaliseOption(value, options, toLower) {
  if (!value) return value;
  const trimmed = String(value).trim();
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() === trimmed.toLowerCase()) {
      return toLower ? options[i].toLowerCase() : options[i];
    }
  }
  return toLower ? trimmed.toLowerCase() : trimmed;
}

function coerceInventoryPayload(body) {
  const out = Object.assign({}, body);
  if (out.quantity !== undefined) out.quantity = Number(out.quantity);
  if (out.cost !== undefined) out.cost = Number(out.cost);
  if (out.purchaseDate !== undefined) out.purchaseDate = new Date(out.purchaseDate);
  if (out.expirationDate !== undefined) out.expirationDate = new Date(out.expirationDate);
  if (out.createdDate !== undefined) out.createdDate = new Date(out.createdDate);
  if (out.unit) out.unit = String(out.unit).trim().toLowerCase();
  if (out.ingredientName) out.ingredientName = String(out.ingredientName).trim();
  if (out.category) out.category = normaliseOption(out.category, CATEGORY_OPTIONS, false);
  if (out.location) out.location = normaliseOption(out.location, LOCATION_OPTIONS, false);
  return out;
}

router.post(CREATE_PATH, async function (req, res, next) {
  try {
    const payload = coerceInventoryPayload(req.body || {});
    if (!payload.createdDate) {
      payload.createdDate = new Date();
    }
    const item = await store.createInventoryItem(payload);
    return res.status(201).json({ item });
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.get(LIST_PATH, async function (req, res, next) {
  try {
    const items = await store.getAllInventory();
    return res.json({ items, page: 1, total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.get(GET_ONE_PATH, async function (req, res, next) {
  try {
    const item = await store.getInventoryItemById(req.params.inventoryId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.json({ item });
  } catch (err) {
    return next(err);
  }
});

router.post(UPDATE_PATH, async function (req, res, next) {
  try {
    const body = req.body || {};
    if (body.diff !== undefined || body.set !== undefined) {
      if (body.diff !== undefined && body.set !== undefined) {
        throw new ValidationError(['Provide either difference or set, not both']);
      }
      let updated;
      if (body.diff !== undefined) {
        const diff = Number(body.diff);
        if (!Number.isFinite(diff)) {
          throw new ValidationError(['Difference must be a number']);
        }
        updated = await store.adjustInventoryQuantity(req.params.inventoryId, diff);
      } else {
        const desired = Number(body.set);
        if (!Number.isFinite(desired)) {
          throw new ValidationError(['Set value must be a number']);
        }
        updated = await store.setInventoryQuantity(req.params.inventoryId, desired);
      }
      if (!updated) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      return res.json({ item: updated });
    }

    const patch = coerceInventoryPayload(body);
    const updated = await store.updateInventoryItem(req.params.inventoryId, patch);
    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.json({ item: updated });
  } catch (err) {
    const mapped = normaliseError(err);
    if (mapped instanceof ValidationError && clientWantsHtml(req)) {
      return res.redirect(302, '/invalid.html');
    }
    return next(mapped);
  }
});

router.delete(DELETE_PATH, async function (req, res, next) {
  try {
    const result = await store.deleteInventoryItem(req.params.inventoryId);
    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;