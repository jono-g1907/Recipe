const { connectToDatabase } = require('./lib/db');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const InventoryItem = require('./models/InventoryItem');
const seed = require('./seed');

async function ensureConnection() {
  await connectToDatabase();
}

async function seedDatabase() {
  await ensureConnection();

  const userCount = await User.estimatedDocumentCount();
  if (userCount === 0) {
    await User.insertMany(seed.USERS);
  }

  const recipeCount = await Recipe.estimatedDocumentCount();
  if (recipeCount === 0) {
    await Recipe.insertMany(seed.RECIPE_SEED);
  }

  const inventoryCount = await InventoryItem.estimatedDocumentCount();
  if (inventoryCount === 0) {
    await InventoryItem.insertMany(seed.INVENTORY_SEED);
  }
}

async function getNextUserId() {
  await ensureConnection();
  const lastUser = await User.findOne().sort({ userId: -1 }).lean();
  if (!lastUser || !lastUser.userId) {
    return 'U-00001';
  }
  const parts = String(lastUser.userId).split('-');
  const number = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
  const nextNumber = Number.isFinite(number) ? number + 1 : 1;
  return 'U-' + String(nextNumber).padStart(5, '0');
}

async function getUserByEmail(email) {
  await ensureConnection();
  const normalised = (email || '').toLowerCase();
  return User.findOne({ email: normalised }).lean();
}

async function getUserByUserId(userId) {
  await ensureConnection();
  return User.findOne({ userId }).lean();
}

async function setUserLoginState(userId, state) {
  await ensureConnection();
  return User.findOneAndUpdate({ userId }, { isLoggedIn: state }, { new: true }).lean();
}

async function createUser(data) {
  await ensureConnection();
  const payload = Object.assign({}, data);
  if (!payload.userId) {
    payload.userId = await getNextUserId();
  }
  if (payload.email) {
    payload.email = String(payload.email).toLowerCase();
  }
  const user = new User(payload);
  const saved = await user.save();
  return saved.toObject();
}

async function getAllRecipes() {
  await ensureConnection();
  return Recipe.find(
    {},
    'recipeId userId title mealType cuisineType prepTime difficulty servings chef createdDate ingredients instructions'
  )
    .sort({ createdDate: -1, recipeId: 1 })
    .lean();
}

async function getRecipeByRecipeId(recipeId) {
  await ensureConnection();
  return Recipe.findOne({ recipeId }).lean();
}

async function getRecipeByTitleForUser(userId, title) {
  await ensureConnection();
  const normalisedUserId = (userId || '').trim().toUpperCase();
  const normalisedTitle = (title || '').trim();
  if (!normalisedUserId || !normalisedTitle) {
    return null;
  }
  return Recipe.findOne({ userId: normalisedUserId, title: normalisedTitle }).lean();
}

async function createRecipe(data) {
  await ensureConnection();
  const recipe = new Recipe(data);
  const saved = await recipe.save();
  return saved.toObject();
}

async function updateRecipe(recipeId, patch) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const update = Object.assign({}, patch || {});
  delete update.recipeId;
  if (update.userId) {
    update.userId = String(update.userId).trim().toUpperCase();
  }
  update.updatedAt = new Date();

  return Recipe.findOneAndUpdate({ recipeId: normalisedId }, update, { new: true, runValidators: true }).lean();
}

async function deleteRecipe(recipeId) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const deletedRecipe = await Recipe.findOneAndDelete({ recipeId: normalisedId }).lean();
  return deletedRecipe || null;
}

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
  const item = new InventoryItem(data);
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

async function getDashboardStats() {
  await ensureConnection();
  const [recipeCount, inventoryCount, userCount, cuisineInfo, inventoryValues] = await Promise.all([
    Recipe.countDocuments({}),
    InventoryItem.countDocuments({}),
    User.countDocuments({}),
    Recipe.distinct('cuisineType'),
    calculateInventoryValue()
  ]);

  const totalValue = inventoryValues && Number.isFinite(inventoryValues.totalValue)
    ? inventoryValues.totalValue
    : 0;

  return {
    recipeCount,
    inventoryCount,
    userCount,
    cuisineCount: cuisineInfo.length,
    inventoryValue: totalValue
  };
}

async function recommendRecipesFromInventory(options) {
  await ensureConnection();
  const opts = options || {};
  const recipeMatch = {};
  if (opts.userId) {
    recipeMatch.userId = String(opts.userId).trim().toUpperCase();
  }

  const inventoryPipelineMatch = {};
  if (opts.inventoryUserId) {
    inventoryPipelineMatch.userId = String(opts.inventoryUserId).trim().toUpperCase();
  }

  const pipeline = [];
  if (Object.keys(recipeMatch).length) {
    pipeline.push({ $match: recipeMatch });
  }

  pipeline.push({ $unwind: { path: '$ingredients', preserveNullAndEmptyArrays: false } });

  const lookupPipeline = [];
  if (Object.keys(inventoryPipelineMatch).length) {
    lookupPipeline.push({ $match: inventoryPipelineMatch });
  }
  lookupPipeline.push({
    $match: {
      $expr: {
        $eq: [
          { $toLower: '$ingredientName' },
          { $toLower: '$$ingredientName' }
        ]
      }
    }
  });
  lookupPipeline.push({
    $group: {
      _id: null,
      totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
      earliestExpiration: { $min: '$expirationDate' }
    }
  });

  pipeline.push({
    $lookup: {
      from: InventoryItem.collection.name,
      let: { ingredientName: '$ingredients.ingredientName' },
      pipeline: lookupPipeline,
      as: 'inventoryMatch'
    }
  });

  pipeline.push({ $unwind: { path: '$inventoryMatch', preserveNullAndEmptyArrays: true } });

  pipeline.push({
    $addFields: {
      ingredientMatch: {
        ingredientName: '$ingredients.ingredientName',
        requiredQuantity: { $ifNull: ['$ingredients.quantity', 0] },
        unit: '$ingredients.unit',
        availableQuantity: { $ifNull: ['$inventoryMatch.totalQuantity', 0] },
        earliestExpiration: '$inventoryMatch.earliestExpiration'
      }
    }
  });

  pipeline.push({
    $addFields: {
      ingredientMatch: {
        ingredientName: '$ingredientMatch.ingredientName',
        requiredQuantity: '$ingredientMatch.requiredQuantity',
        unit: '$ingredientMatch.unit',
        availableQuantity: '$ingredientMatch.availableQuantity',
        earliestExpiration: '$ingredientMatch.earliestExpiration',
        hasEnough: {
          $cond: [
            {
              $gte: [
                '$ingredientMatch.availableQuantity',
                '$ingredientMatch.requiredQuantity'
              ]
            },
            true,
            false
          ]
        },
        isAvailable: {
          $cond: [
            { $gt: ['$ingredientMatch.availableQuantity', 0] },
            true,
            false
          ]
        }
      }
    }
  });

  pipeline.push({
    $group: {
      _id: '$_id',
      recipeId: { $first: '$recipeId' },
      title: { $first: '$title' },
      userId: { $first: '$userId' },
      chef: { $first: '$chef' },
      mealType: { $first: '$mealType' },
      difficulty: { $first: '$difficulty' },
      servings: { $first: '$servings' },
      ingredientMatches: { $push: '$ingredientMatch' },
      totalIngredients: { $sum: 1 },
      availableCount: {
        $sum: {
          $cond: [
            { $eq: ['$ingredientMatch.isAvailable', true] },
            1,
            0
          ]
        }
      },
      fullyMatchedCount: {
        $sum: {
          $cond: [
            { $eq: ['$ingredientMatch.hasEnough', true] },
            1,
            0
          ]
        }
      }
    }
  });

  pipeline.push({
    $addFields: {
      cookabilityScore: {
        $cond: [
          { $lte: ['$totalIngredients', 0] },
          0,
          {
            $round: [
              {
                $multiply: [
                  { $divide: ['$fullyMatchedCount', '$totalIngredients'] },
                  100
                ]
              },
              0
            ]
          }
        ]
      },
      missingIngredients: {
        $filter: {
          input: '$ingredientMatches',
          as: 'match',
          cond: { $eq: ['$$match.hasEnough', false] }
        }
      }
    }
  });

  if (Number.isFinite(opts.minScore)) {
    pipeline.push({ $match: { cookabilityScore: { $gte: opts.minScore } } });
  }

  pipeline.push({ $sort: { cookabilityScore: -1, title: 1 } });

  if (Number.isFinite(opts.limit) && opts.limit > 0) {
    pipeline.push({ $limit: Math.min(opts.limit, 50) });
  }

  const results = await Recipe.aggregate(pipeline);
  return results.map(function (entry) {
    return Object.assign({}, entry, {
      ingredientMatches: entry.ingredientMatches || [],
      missingIngredients: entry.missingIngredients || []
    });
  });
}

async function getRecipeNutritionSummary(options) {
  await ensureConnection();
  const opts = options || {};
  const match = {};
  if (opts.userId) {
    match.userId = String(opts.userId).trim().toUpperCase();
  }

  const pipeline = [];
  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $addFields: {
      ingredientCount: { $size: { $ifNull: ['$ingredients', []] } }
    }
  });

  const ingredientUsagePipeline = [
    { $unwind: '$ingredients' },
    {
      $group: {
        _id: {
          ingredient: { $toLower: '$ingredients.ingredientName' },
          unit: '$ingredients.unit'
        },
        totalQuantity: { $sum: { $ifNull: ['$ingredients.quantity', 0] } },
        recipeIds: { $addToSet: '$recipeId' }
      }
    },
    {
      $project: {
        _id: 0,
        ingredient: '$_id.ingredient',
        unit: '$_id.unit',
        totalQuantity: 1,
        recipeCount: { $size: '$recipeIds' }
      }
    },
    { $sort: { recipeCount: -1, ingredient: 1 } }
  ];

  const topLimit = Number.isFinite(opts.topIngredientsLimit) && opts.topIngredientsLimit > 0
    ? Math.min(opts.topIngredientsLimit, 25)
    : 10;
  ingredientUsagePipeline.push({ $limit: topLimit });

  pipeline.push({
    $facet: {
      mealTypeSummary: [
        {
          $group: {
            _id: '$mealType',
            recipeCount: { $sum: 1 },
            averageIngredients: { $avg: '$ingredientCount' },
            averageServings: { $avg: '$servings' },
            averagePrepTime: { $avg: '$prepTime' }
          }
        },
        { $sort: { recipeCount: -1, _id: 1 } }
      ],
      difficultySummary: [
        {
          $group: {
            _id: '$difficulty',
            recipeCount: { $sum: 1 },
            averageIngredients: { $avg: '$ingredientCount' },
            averagePrepTime: { $avg: '$prepTime' },
            averageServings: { $avg: '$servings' }
          }
        },
        { $sort: { _id: 1 } }
      ],
      ingredientUsage: ingredientUsagePipeline,
      servingsSummary: [
        {
          $group: {
            _id: null,
            averageServings: { $avg: '$servings' },
            averagePrepTime: { $avg: '$prepTime' },
            averageIngredientCount: { $avg: '$ingredientCount' }
          }
        }
      ]
    }
  });

  const data = await Recipe.aggregate(pipeline);
  const summary = data && data.length ? data[0] : {};

  return {
    mealTypeSummary: summary.mealTypeSummary || [],
    difficultySummary: summary.difficultySummary || [],
    ingredientUsage: summary.ingredientUsage || [],
    servingsSummary: summary.servingsSummary && summary.servingsSummary.length
      ? summary.servingsSummary[0]
      : { averageServings: 0, averagePrepTime: 0, averageIngredientCount: 0 }
  };
}

async function getInventoryOptimisationSuggestions(options) {
  await ensureConnection();
  const opts = options || {};
  const match = {};
  if (opts.userId) {
    match.userId = String(opts.userId).trim().toUpperCase();
  }

  const lowStockThreshold = Number.isFinite(opts.lowStockThreshold) && opts.lowStockThreshold >= 0
    ? opts.lowStockThreshold
    : 3;
  const expiringSoonDays = Number.isFinite(opts.expiringSoonDays) && opts.expiringSoonDays >= 0
    ? opts.expiringSoonDays
    : 5;
  const now = new Date();
  const millisecondsInDay = 1000 * 60 * 60 * 24;

  const pipeline = [];
  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $lookup: {
      from: Recipe.collection.name,
      let: { inventoryIngredient: { $toLower: '$ingredientName' } },
      pipeline: [
        { $unwind: '$ingredients' },
        {
          $match: {
            $expr: {
              $eq: [
                { $toLower: '$ingredients.ingredientName' },
                '$$inventoryIngredient'
              ]
            }
          }
        },
        {
          $group: {
            _id: '$recipeId',
            title: { $first: '$title' }
          }
        },
        { $project: { _id: 0, recipeId: '$_id', title: 1 } }
      ],
      as: 'recipeUsage'
    }
  });

  pipeline.push({
    $addFields: {
      usageCount: { $size: { $ifNull: ['$recipeUsage', []] } },
      daysUntilExpiration: {
        $cond: [
          { $ifNull: ['$expirationDate', false] },
          {
            $round: [
              {
                $divide: [
                  { $subtract: ['$expirationDate', now] },
                  millisecondsInDay
                ]
              },
              0
            ]
          },
          null
        ]
      },
      isLowStock: {
        $cond: [
          { $lt: [{ $ifNull: ['$quantity', 0] }, lowStockThreshold] },
          true,
          false
        ]
      }
    }
  });

  pipeline.push({
    $addFields: {
      expiringSoon: {
        $cond: [
          {
            $and: [
              { $ne: ['$daysUntilExpiration', null] },
              { $lte: ['$daysUntilExpiration', expiringSoonDays] }
            ]
          },
          true,
          false
        ]
      }
    }
  });

  pipeline.push({
    $facet: {
      lowStock: [
        { $match: { isLowStock: true } },
        {
          $project: {
            _id: 0,
            inventoryId: 1,
            ingredientName: 1,
            quantity: 1,
            unit: 1,
            usageCount: 1,
            recipeUsage: 1
          }
        },
        { $sort: { usageCount: -1, quantity: 1 } }
      ],
      expiringSoon: [
        { $match: { expiringSoon: true } },
        {
          $project: {
            _id: 0,
            inventoryId: 1,
            ingredientName: 1,
            daysUntilExpiration: 1,
            expirationDate: 1,
            quantity: 1,
            unit: 1,
            usageCount: 1,
            recipeUsage: 1
          }
        },
        { $sort: { daysUntilExpiration: 1, ingredientName: 1 } }
      ],
      versatileIngredients: [
        { $match: { usageCount: { $gte: 2 } } },
        {
          $project: {
            _id: 0,
            inventoryId: 1,
            ingredientName: 1,
            quantity: 1,
            unit: 1,
            usageCount: 1
          }
        },
        { $sort: { usageCount: -1, ingredientName: 1 } }
      ]
    }
  });

  const reports = await InventoryItem.aggregate(pipeline);
  const summary = reports && reports.length ? reports[0] : {};
  return {
    lowStock: summary.lowStock || [],
    expiringSoon: summary.expiringSoon || [],
    versatileIngredients: summary.versatileIngredients || []
  };
}

module.exports = {
  seedDatabase,
  getNextUserId,
  getUserByEmail,
  getUserByUserId,
  setUserLoginState,
  createUser,
  getAllRecipes,
  getRecipeByRecipeId,
  getRecipeByTitleForUser,
  createRecipe,
  updateRecipe,
  deleteRecipe,
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
  getDashboardStats,
  recommendRecipesFromInventory,
  getRecipeNutritionSummary,
  getInventoryOptimisationSuggestions
};
