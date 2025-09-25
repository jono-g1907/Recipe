const InventoryItem = require('../models/InventoryItem');
const ValidationError = require('../errors/ValidationError');
const { ensureConnection } = require('./base');
const { findUserDocumentByUserId } = require('./users');

function escapeRegExp(value) {
  return String(value).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function buildInventoryQuery(filters) {
  const query = {};

  if (filters && filters.q) {
    const regex = new RegExp(escapeRegExp(filters.q), 'i');
    query.$or = [
      { ingredientName: regex },
      { inventoryId: regex }
    ];
  }

  if (filters && filters.category) {
    query.category = filters.category;
  }

  if (filters && filters.location) {
    query.location = filters.location;
  }

  if (filters && filters.unit) {
    query.unit = filters.unit;
  }

  if (filters && filters.userId) {
    query.userId = filters.userId;
  }

  if (filters && filters.expiringBy instanceof Date) {
    query.expirationDate = Object.assign({}, query.expirationDate, {
      $lte: filters.expiringBy
    });
  }

  if (filters && filters.lowStockBelow !== undefined) {
    query.quantity = Object.assign({}, query.quantity, {
      $lte: filters.lowStockBelow
    });
  }

  return query;
}

function buildInventorySort(sortKey) {
  const fallback = { createdDate: -1, inventoryId: 1 };
  if (!sortKey || typeof sortKey !== 'string') {
    return fallback;
  }

  const trimmed = sortKey.trim();
  if (!trimmed) {
    return fallback;
  }

  const allowed = ['createdDate', 'expirationDate', 'quantity', 'ingredientName'];
  let direction = 1;
  let field = trimmed;
  if (field.charAt(0) === '-') {
    direction = -1;
    field = field.substring(1);
  }

  if (allowed.indexOf(field) === -1) {
    return fallback;
  }

  const sort = {};
  sort[field] = direction;
  sort.inventoryId = 1;
  return sort;
}

function normalisePage(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function normaliseLimit(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 10;
  }
  return Math.min(parsed, 50);
}

async function listInventory(options) {
  const opts = options || {};
  await ensureConnection();

  const page = normalisePage(opts.page);
  const limit = normaliseLimit(opts.limit);
  const query = buildInventoryQuery(opts);
  const sort = buildInventorySort(opts.sort);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    InventoryItem.find(query).sort(sort).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getAllInventory() {
  const result = await listInventory({ page: 1, limit: 500, sort: '-createdDate' });
  return result.items;
}

async function getInventoryItemById(inventoryId) {
  await ensureConnection();
  return InventoryItem.findOne({ inventoryId }).lean();
}

async function createInventoryItem(data) {
  await ensureConnection();
  const payload = Object.assign({}, data || {});
  if (payload.inventoryId) {
    payload.inventoryId = String(payload.inventoryId).trim().toUpperCase();
  }

  const ownerDoc = await findUserDocumentByUserId(payload.userId);
  if (!ownerDoc) {
    throw new ValidationError(['A valid user is required to add inventory items.']);
  }

  payload.userId = ownerDoc.userId;
  payload.user = ownerDoc._id;

  const item = new InventoryItem(payload);
  const saved = await item.save();
  return saved.toObject();
}

async function updateInventoryItem(inventoryId, patch) {
  await ensureConnection();

  const normalisedId = inventoryId ? String(inventoryId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const update = Object.assign({}, patch || {});
  delete update.inventoryId;
  if (update.userId) {
    update.userId = String(update.userId).trim().toUpperCase();
    const ownerDoc = await findUserDocumentByUserId(update.userId);
    if (!ownerDoc) {
      throw new ValidationError(['Inventory items must belong to a valid user account.']);
    }
    update.user = ownerDoc._id;
    update.userId = ownerDoc.userId;
  }
  update.updatedAt = new Date();

  return InventoryItem.findOneAndUpdate({ inventoryId: normalisedId }, update, { new: true, runValidators: true }).lean();
}

async function deleteInventoryItem(inventoryId) {
  await ensureConnection();
  return InventoryItem.deleteOne({ inventoryId });
}

async function adjustInventoryQuantity(inventoryId, diff) {
  await ensureConnection();
  const doc = await InventoryItem.findOne({ inventoryId });
  if (!doc) {
    return null;
  }
  const newQuantity = doc.quantity + diff;
  if (newQuantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  doc.quantity = newQuantity;
  const saved = await doc.save();
  return saved.toObject();
}

async function setInventoryQuantity(inventoryId, amount) {
  await ensureConnection();
  const doc = await InventoryItem.findOne({ inventoryId });
  if (!doc) {
    return null;
  }
  if (amount < 0) {
    throw new Error('Quantity cannot be negative');
  }
  doc.quantity = amount;
  const saved = await doc.save();
  return saved.toObject();
}

async function findExpiringInventory(options) {
  const opts = options || {};
  return listInventory({
    page: opts.page,
    limit: opts.limit,
    expiringBy: opts.by,
    category: opts.category,
    location: opts.location,
    unit: opts.unit,
    userId: opts.userId,
    sort: 'expirationDate'
  });
}

async function findLowStockInventory(options) {
  const opts = options || {};
  await ensureConnection();
  const query = buildInventoryQuery({
    category: opts.category,
    location: opts.location,
    unit: opts.unit,
    userId: opts.userId,
    lowStockBelow: opts.threshold
  });
  return InventoryItem.find(query).sort({ quantity: 1, inventoryId: 1 }).lean();
}

async function calculateInventoryValue(groupBy) {
  await ensureConnection();
  const projectStage = {
    lineValue: {
      $multiply: [
        { $ifNull: ['$cost', 0] },
        { $ifNull: ['$quantity', 0] }
      ]
    }
  };

  if (groupBy) {
    projectStage.groupField = { $ifNull: ['$' + groupBy, 'Unspecified'] };
  }

  const pipeline = [
    { $project: projectStage }
  ];

  if (groupBy) {
    pipeline.push({
      $group: {
        _id: '$groupField',
        totalValue: { $sum: '$lineValue' },
        itemCount: { $sum: 1 }
      }
    });
    pipeline.push({ $sort: { _id: 1 } });
    const grouped = await InventoryItem.aggregate(pipeline);
    let total = 0;
    const breakdown = grouped.map(function (entry) {
      const value = entry.totalValue || 0;
      total += value;
      return {
        group: entry._id === null ? 'Unspecified' : entry._id,
        totalValue: value,
        itemCount: entry.itemCount || 0
      };
    });
    return { totalValue: total, breakdown };
  }

  pipeline.push({
    $group: {
      _id: null,
      totalValue: { $sum: '$lineValue' }
    }
  });

  const totals = await InventoryItem.aggregate(pipeline);
  const totalValue = totals.length && totals[0].totalValue ? totals[0].totalValue : 0;
  return { totalValue };
}

async function getSharedInventorySnapshot(limit) {
  const result = await listInventory({ page: 1, limit: limit || 5, sort: '-createdDate' });
  return result.items;
}

module.exports = {
  listInventory,
  getAllInventory,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  setInventoryQuantity,
  findExpiringInventory,
  findLowStockInventory,
  calculateInventoryValue,
  getSharedInventorySnapshot,
  buildInventoryQuery
};
