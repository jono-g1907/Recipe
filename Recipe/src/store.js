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

function normaliseUserId(value) {
  if (!value) {
    return '';
  }
  return String(value).trim().toUpperCase();
}

async function getSmartRecipeDashboardData(options) {
  const opts = options || {};
  const userId = normaliseUserId(opts.userId);

  await ensureConnection();

  const inventoryCollectionName = InventoryItem.collection.name;
  const recipeCollectionName = Recipe.collection.name;

  const inventoryMatchExpression = userId
    ? {
        $expr: {
          $and: [
            { $eq: ['$ingredientName', '$$ingredientName'] },
            { $eq: ['$userId', userId] }
          ]
        }
      }
    : {
        $expr: {
          $eq: ['$ingredientName', '$$ingredientName']
        }
      };

  const cookabilityPipeline = [
    {
      $addFields: {
        totalIngredients: { $size: { $ifNull: ['$ingredients', []] } }
      }
    },
    {
      $unwind: {
        path: '$ingredients',
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: inventoryCollectionName,
        let: { ingredientName: '$ingredients.ingredientName' },
        pipeline: [
          { $match: inventoryMatchExpression },
          {
            $project: {
              ingredientName: 1,
              quantity: 1,
              unit: 1,
              expirationDate: 1
            }
          }
        ],
        as: 'inventoryMatches'
      }
    },
    {
      $addFields: {
        hasInventory: { $gt: [{ $size: '$inventoryMatches' }, 0] }
      }
    },
    {
      $group: {
        _id: '$_id',
        recipeId: { $first: '$recipeId' },
        title: { $first: '$title' },
        chef: { $first: '$chef' },
        cuisineType: { $first: '$cuisineType' },
        createdDate: { $first: '$createdDate' },
        totalIngredients: { $first: '$totalIngredients' },
        matchedIngredients: {
          $push: {
            $cond: [{ $eq: ['$hasInventory', true] }, '$ingredients.ingredientName', null]
          }
        },
        missingIngredients: {
          $push: {
            $cond: [{ $eq: ['$hasInventory', true] }, null, '$ingredients.ingredientName']
          }
        }
      }
    },
    {
      $addFields: {
        matchedIngredients: {
          $filter: {
            input: '$matchedIngredients',
            as: 'item',
            cond: { $ne: ['$$item', null] }
          }
        },
        missingIngredients: {
          $filter: {
            input: '$missingIngredients',
            as: 'item',
            cond: { $ne: ['$$item', null] }
          }
        }
      }
    },
    {
      $addFields: {
        matchedCount: { $size: '$matchedIngredients' },
        missingCount: { $size: '$missingIngredients' },
        cookabilityScore: {
          $cond: [
            { $gt: ['$totalIngredients', 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [{ $size: '$matchedIngredients' }, '$totalIngredients']
                    },
                    100
                  ]
                },
                0
              ]
            },
            0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        recipeId: 1,
        title: 1,
        chef: 1,
        cuisineType: 1,
        createdDate: 1,
        totalIngredients: 1,
        matchedCount: 1,
        missingCount: 1,
        cookabilityScore: 1,
        matchedIngredients: 1,
        missingIngredients: 1
      }
    },
    {
      $sort: {
        cookabilityScore: -1,
        createdDate: -1
      }
    }
  ];

  const cookabilityResults = await Recipe.aggregate(cookabilityPipeline);

  const cookability = cookabilityResults.map(function (entry) {
    return {
      recipeId: entry.recipeId,
      title: entry.title,
      chef: entry.chef,
      cuisineType: entry.cuisineType,
      createdDate: entry.createdDate ? new Date(entry.createdDate) : null,
      totalIngredients: entry.totalIngredients || 0,
      matchedCount: entry.matchedCount || 0,
      missingCount: entry.missingCount || 0,
      cookabilityScore: entry.cookabilityScore || 0,
      matchedIngredients: Array.isArray(entry.matchedIngredients) ? entry.matchedIngredients : [],
      missingIngredients: Array.isArray(entry.missingIngredients) ? entry.missingIngredients : []
    };
  });

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const expiringMatch = {
    expirationDate: { $gte: now, $lte: soon }
  };
  if (userId) {
    expiringMatch.userId = userId;
  }

  const expiringPipeline = [
    { $match: expiringMatch },
    {
      $lookup: {
        from: recipeCollectionName,
        let: { ingredientName: '$ingredientName' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  '$$ingredientName',
                  {
                    $map: {
                      input: { $ifNull: ['$ingredients', []] },
                      as: 'ingredient',
                      in: '$$ingredient.ingredientName'
                    }
                  }
                ]
              }
            }
          },
          {
            $project: {
              title: 1,
              recipeId: 1
            }
          }
        ],
        as: 'recipeUsage'
      }
    },
    {
      $addFields: {
        recipeCount: { $size: '$recipeUsage' }
      }
    },
    {
      $project: {
        _id: 0,
        inventoryId: '$inventoryId',
        ingredientName: '$ingredientName',
        quantity: '$quantity',
        unit: '$unit',
        expirationDate: '$expirationDate',
        recipeCount: 1,
        recipeTitles: {
          $map: {
            input: '$recipeUsage',
            as: 'recipe',
            in: '$$recipe.title'
          }
        }
      }
    },
    { $sort: { expirationDate: 1 } },
    { $limit: 6 }
  ];

  const expiringSoonResults = await InventoryItem.aggregate(expiringPipeline);

  const expiringSoon = expiringSoonResults.map(function (entry) {
    const expirationDate = entry.expirationDate ? new Date(entry.expirationDate) : null;
    let daysUntil = null;
    if (expirationDate) {
      const diffMs = expirationDate.getTime() - now.getTime();
      daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        daysUntil = 0;
      }
    }
    return {
      inventoryId: entry.inventoryId,
      ingredientName: entry.ingredientName,
      quantity: entry.quantity,
      unit: entry.unit,
      expirationDate,
      daysUntil,
      recipeCount: entry.recipeCount || 0,
      recipeTitles: Array.isArray(entry.recipeTitles) ? entry.recipeTitles : []
    };
  });

  const lowStockMatch = { quantity: { $lte: 2 } };
  if (userId) {
    lowStockMatch.userId = userId;
  }

  const lowStockPipeline = [
    { $match: lowStockMatch },
    {
      $lookup: {
        from: recipeCollectionName,
        let: { ingredientName: '$ingredientName' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  '$$ingredientName',
                  {
                    $map: {
                      input: { $ifNull: ['$ingredients', []] },
                      as: 'ingredient',
                      in: '$$ingredient.ingredientName'
                    }
                  }
                ]
              }
            }
          },
          {
            $project: {
              title: 1,
              recipeId: 1
            }
          }
        ],
        as: 'recipesUsing'
      }
    },
    {
      $addFields: {
        usageCount: { $size: '$recipesUsing' }
      }
    },
    { $match: { usageCount: { $gt: 0 } } },
    {
      $project: {
        _id: 0,
        inventoryId: '$inventoryId',
        ingredientName: '$ingredientName',
        quantity: '$quantity',
        unit: '$unit',
        usageCount: 1,
        recipeTitles: {
          $map: {
            input: '$recipesUsing',
            as: 'recipe',
            in: '$$recipe.title'
          }
        }
      }
    },
    { $sort: { usageCount: -1, quantity: 1 } },
    { $limit: 6 }
  ];

  const lowStockResults = await InventoryItem.aggregate(lowStockPipeline);

  const lowStockSuggestions = lowStockResults.map(function (entry) {
    return {
      inventoryId: entry.inventoryId,
      ingredientName: entry.ingredientName,
      quantity: entry.quantity,
      unit: entry.unit,
      usageCount: entry.usageCount || 0,
      recipeTitles: Array.isArray(entry.recipeTitles) ? entry.recipeTitles : []
    };
  });

  const popularityPipeline = [
    {
      $addFields: {
        ingredientCount: { $size: { $ifNull: ['$ingredients', []] } }
      }
    },
    { $sort: { createdDate: -1 } },
    {
      $group: {
        _id: '$cuisineType',
        totalRecipes: { $sum: 1 },
        avgPrepTime: { $avg: '$prepTime' },
        avgIngredients: { $avg: '$ingredientCount' },
        topRecipe: { $first: '$title' }
      }
    },
    { $sort: { totalRecipes: -1, _id: 1 } }
  ];

  const popularityResults = await Recipe.aggregate(popularityPipeline);

  const popularityStats = popularityResults.map(function (entry) {
    return {
      cuisineType: entry._id || 'Unspecified',
      totalRecipes: entry.totalRecipes || 0,
      avgPrepTime: Math.round(entry.avgPrepTime || 0),
      avgIngredients: Math.round(entry.avgIngredients || 0),
      topRecipe: entry.topRecipe || 'N/A'
    };
  });

  const latestRecipes = cookability
    .slice()
    .sort(function (a, b) {
      const aTime = a.createdDate ? a.createdDate.getTime() : 0;
      const bTime = b.createdDate ? b.createdDate.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  const recommendations = cookability
    .slice()
    .sort(function (a, b) {
      if (b.cookabilityScore !== a.cookabilityScore) {
        return b.cookabilityScore - a.cookabilityScore;
      }
      const aTime = a.createdDate ? a.createdDate.getTime() : 0;
      const bTime = b.createdDate ? b.createdDate.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  return {
    cookability,
    latestRecipes,
    recommendations,
    expiringSoon,
    lowStock: lowStockSuggestions,
    popularity: popularityStats
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
  getSmartRecipeDashboardData
};
