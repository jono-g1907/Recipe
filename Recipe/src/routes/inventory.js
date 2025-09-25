const express = require('express');
const router = express.Router();
const constants = require('../lib/constants');
const APP_ID = constants.APP_ID;
const store = require('../store');
const ValidationError = require('../errors/ValidationError');
const navigation = require('../lib/navigation');
const { userCanAccessInventory } = require('../lib/permissions');

const CREATE_PATH = '/add-inventory-' + APP_ID;
const LIST_PATH = '/inventory-dashboard-' + APP_ID;
const GET_ONE_PATH = '/inventory-dashboard/:inventoryId-' + APP_ID;
const UPDATE_PATH = '/inventory-dashboard/:inventoryId/update-' + APP_ID;
const DELETE_PATH = '/inventory-dashboard/:inventoryId-' + APP_ID;
const EXPIRING_PATH = '/inventory/expiring-' + APP_ID;
const LOW_STOCK_PATH = '/inventory/low-stock-' + APP_ID;
const VALUE_PATH = '/inventory/value-' + APP_ID;

const CATEGORY_OPTIONS = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
const LOCATION_OPTIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];
const UNIT_OPTIONS = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

function getUserIdFromRequest(req) {
  const queryId = req && req.query && req.query.userId;
  const bodyId = req && req.body && req.body.userId;
  const headerId = req && req.headers && req.headers['x-user-id'];
  const candidate = headerId || queryId || bodyId || '';
  return candidate ? String(candidate).trim().toUpperCase() : '';
}

async function resolveInventoryUser(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return { status: 401, message: 'User authentication is required.' };
  }

  const user = await store.getUserByUserId(userId);
  if (!user || !user.isLoggedIn) {
    return { status: 401, message: 'Invalid or expired session. Please log in again.' };
  }

  if (!userCanAccessInventory(user)) {
    return { status: 403, message: 'Inventory is restricted to authorised staff.' };
  }

  return { user: user };
}

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

function parseNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d;
}

function parseListQuery(query) {
  const q = query || {};
  const filters = { page: 1, limit: 10 };

  const page = parseInt(q.page, 10);
  if (Number.isFinite(page) && page > 0) {
    filters.page = page;
  }

  const limit = parseInt(q.limit, 10);
  if (Number.isFinite(limit) && limit > 0) {
    filters.limit = Math.min(limit, 50);
  }

  const search = typeof q.q === 'string' ? q.q.trim() : '';
  if (search) {
    filters.q = search;
  }

  const category = normaliseOption(q.category, CATEGORY_OPTIONS, false);
  if (category && CATEGORY_OPTIONS.indexOf(category) !== -1) {
    filters.category = category;
  }

  const location = normaliseOption(q.location, LOCATION_OPTIONS, false);
  if (location && LOCATION_OPTIONS.indexOf(location) !== -1) {
    filters.location = location;
  }

  const unit = normaliseOption(q.unit, UNIT_OPTIONS, true);
  if (unit && UNIT_OPTIONS.indexOf(unit) !== -1) {
    filters.unit = unit;
  }

  const userId = typeof q.userId === 'string' ? q.userId.trim().toUpperCase() : '';
  if (userId) {
    filters.userId = userId;
  }

  const expiring = parseDate(q.expiringBy);
  if (expiring) {
    filters.expiringBy = expiring;
  }

  const lowStock = parseNumber(q.lowStockBelow);
  if (lowStock !== null) {
    filters.lowStockBelow = lowStock;
  }

  const sort = typeof q.sort === 'string' ? q.sort.trim() : '';
  if (sort) {
    filters.sort = sort;
  }

  return filters;
}

function toIsoString(value) {
  if (!value) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

function getDaysUntilExpiration(value) {
  if (!value) {
    return null;
  }
  const expiration = value instanceof Date ? value : new Date(value);
  if (isNaN(expiration.getTime())) {
    return null;
  }
  const now = new Date();
  const diff = expiration.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(daysLeft) {
  if (daysLeft === null) {
    return 'unknown';
  }
  if (daysLeft < 0) {
    return 'expired';
  }
  if (daysLeft <= 3) {
    return 'soon';
  }
  return 'ok';
}

function roundCurrency(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

function formatInventoryForResponse(item) {
  if (!item) {
    return item;
  }

  const quantity = Number(item.quantity);
  const cost = Number(item.cost);
  const daysLeft = getDaysUntilExpiration(item.expirationDate);
  const value = Number.isFinite(quantity) && Number.isFinite(cost)
    ? roundCurrency(quantity * cost)
    : null;

  return {
    inventoryId: item.inventoryId,
    userId: item.userId,
    ingredientName: item.ingredientName,
    quantity: Number.isFinite(quantity) ? quantity : null,
    unit: item.unit,
    category: item.category,
    purchaseDate: toIsoString(item.purchaseDate),
    expirationDate: toIsoString(item.expirationDate),
    location: item.location,
    cost: Number.isFinite(cost) ? roundCurrency(cost) : null,
    createdDate: toIsoString(item.createdDate),
    updatedAt: toIsoString(item.updatedAt),
    daysUntilExpiration: daysLeft,
    expirationStatus: getExpiryStatus(daysLeft),
    inventoryValue: value
  };
}


router.post(CREATE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }

    const activeUser = resolution.user;
    const payload = coerceInventoryPayload(req.body || {});
    if (!payload.createdDate) {
      payload.createdDate = new Date();
    }
    payload.userId = activeUser.userId;
    const item = await store.createInventoryItem(payload);
    return res.status(201).json({ item: formatInventoryForResponse(item) });
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.get(LIST_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
    const filters = parseListQuery(req.query);
    const result = await store.listInventory(filters);
    const items = result.items.map(formatInventoryForResponse);
    return res.json({ items, page: result.page, total: result.total, limit: result.limit });
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.get(GET_ONE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
    const item = await store.getInventoryItemById(req.params.inventoryId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.json({ item: formatInventoryForResponse(item) });
  } catch (err) {
    return next(err);
  }
});

router.get(EXPIRING_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
    const byDate = parseDate(req.query && req.query.by);
    if (!byDate) {
      throw new ValidationError(['Query parameter "by" must be a valid ISO date (YYYY-MM-DD).']);
    }

    const filters = parseListQuery(req.query);
    const result = await store.findExpiringInventory({
      by: byDate,
      page: filters.page,
      limit: filters.limit,
      category: filters.category,
      location: filters.location,
      unit: filters.unit,
      userId: filters.userId
    });

    return res.json({
      by: byDate.toISOString(),
      items: result.items.map(formatInventoryForResponse),
      page: result.page,
      total: result.total,
      limit: result.limit
    });
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.get(LOW_STOCK_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
    const threshold = parseNumber(req.query && req.query.threshold);
    if (threshold === null) {
      throw new ValidationError(['Query parameter "threshold" must be a number.']);
    }
    if (threshold < 0) {
      throw new ValidationError(['Threshold must be zero or greater.']);
    }

    const filters = parseListQuery(req.query);
    const items = await store.findLowStockInventory({
      threshold: threshold,
      category: filters.category,
      location: filters.location,
      unit: filters.unit,
      userId: filters.userId
    });

    return res.json({
      threshold: threshold,
      items: items.map(formatInventoryForResponse)
    });
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.get(VALUE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
    const query = req.query || {};
    const rawGroup = typeof query.groupBy === 'string'
      ? query.groupBy.trim().toLowerCase()
      : '';
    let groupBy = null;
    if (rawGroup === 'category' || rawGroup === 'location') {
      groupBy = rawGroup;
    }

    const result = await store.calculateInventoryValue(groupBy);
    const totalValue = result && Number.isFinite(result.totalValue)
      ? result.totalValue
      : 0;
    const response = {
      totalValue: roundCurrency(totalValue)
    };

    if (groupBy && Array.isArray(result.breakdown)) {
      response.groupBy = groupBy;
      response.breakdown = result.breakdown.map(function (entry) {
        const entryValue = entry && Number.isFinite(entry.totalValue) ? entry.totalValue : 0;
        return {
          group: entry.group,
          totalValue: roundCurrency(entryValue),
          itemCount: entry.itemCount
        };
      });
    }

    return res.json(response);
  } catch (err) {
    return next(normaliseError(err));
  }
});

router.post(UPDATE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
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
      return res.json({ item: formatInventoryForResponse(updated) });
    }

    const patch = coerceInventoryPayload(body);
    delete patch.userId;
    const updated = await store.updateInventoryItem(req.params.inventoryId, patch);
    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.json({ item: formatInventoryForResponse(updated) });
  } catch (err) {
    const mapped = normaliseError(err);
    if (mapped instanceof ValidationError && clientWantsHtml(req)) {
      const link = navigation.buildReturnLink(req);
      const message = mapped.errors && mapped.errors.length
        ? mapped.errors.join(' ')
        : 'There was a problem with the submitted data.';
      return res.status(400).render('invalid.html', {
        message: message,
        returnHref: link.href,
        returnText: link.text,
        userId: link.userId,
      });
    }
    return next(mapped);
  }
});

router.delete(DELETE_PATH, async function (req, res, next) {
  try {
    const resolution = await resolveInventoryUser(req);
    if (!resolution.user) {
      return res.status(resolution.status || 401).json({ error: resolution.message });
    }
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
