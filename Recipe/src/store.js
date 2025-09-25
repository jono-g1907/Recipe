const { connectToDatabase } = require('./lib/db');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const InventoryItem = require('./models/InventoryItem');
const seed = require('./seed');
const ValidationError = require('./errors/ValidationError');

async function ensureConnection() {
  await connectToDatabase();
}

async function findUserDocumentByUserId(userId) {
  const normalised = normaliseUserId(userId);
  if (!normalised) {
    return null;
  }

  await ensureConnection();
  return User.findOne({ userId: normalised });
}

async function seedDatabase() {
  await ensureConnection();

  const userCount = await User.estimatedDocumentCount();
  if (userCount === 0) {
    await User.insertMany(seed.USERS);
  }

  const userDocs = await User.find({}, { _id: 1, userId: 1 }).lean();
  const userMap = {};
  for (let i = 0; i < userDocs.length; i++) {
    const entry = userDocs[i];
    if (entry && entry.userId) {
      userMap[entry.userId] = entry._id;
    }
  }

  const recipeCount = await Recipe.estimatedDocumentCount();
  if (recipeCount === 0) {
    const recipeSeed = seed.RECIPE_SEED.map(function (recipe) {
      const ownerId = userMap[recipe.userId];
      return Object.assign({}, recipe, ownerId ? { user: ownerId } : {});
    });
    await Recipe.insertMany(recipeSeed);
  }

  const inventoryCount = await InventoryItem.estimatedDocumentCount();
  if (inventoryCount === 0) {
    const inventorySeed = seed.INVENTORY_SEED.map(function (item) {
      const ownerId = userMap[item.userId];
      return Object.assign({}, item, ownerId ? { user: ownerId } : {});
    });
    await InventoryItem.insertMany(inventorySeed);
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

async function getAllRecipes(options) {
  await ensureConnection();
  const opts = options || {};
  const query = {};

  if (opts.ownerId) {
    query.userId = opts.ownerId;
  }

  const projection = 'recipeId userId title mealType cuisineType prepTime difficulty servings chef createdDate ingredients instructions';
  let finder = Recipe.find(query, projection).sort({ createdDate: -1, recipeId: 1 });

  if (opts.includeChefInfo) {
    finder = finder.populate('user', 'userId fullname role');
  }

  if (Number.isFinite(opts.limit) && opts.limit > 0) {
    finder = finder.limit(opts.limit);
  }

  return finder.lean();
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

async function getRecipesByOwner(userId, options) {
  const opts = options || {};
  const ownerId = normaliseUserId(userId);
  if (!ownerId) {
    return [];
  }
  return getAllRecipes({ ownerId: ownerId, limit: opts.limit, includeChefInfo: opts.includeChefInfo });
}

async function createRecipe(data) {
  await ensureConnection();
  const payload = Object.assign({}, data || {});
  const ownerDoc = await findUserDocumentByUserId(payload.userId);

  if (!ownerDoc) {
    throw new ValidationError(['A valid chef account is required to create recipes.']);
  }

  payload.userId = ownerDoc.userId;
  payload.user = ownerDoc._id;

  if (payload.recipeId) {
    payload.recipeId = String(payload.recipeId).trim().toUpperCase();
  }

  const recipe = new Recipe(payload);
  const saved = await recipe.save();
  return saved.toObject();
}

async function updateRecipe(recipeId, patch, options) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const existing = await Recipe.findOne({ recipeId: normalisedId }).lean();
  if (!existing) {
    return null;
  }

  const opts = options || {};
  const editorId = normaliseUserId(opts.userId);
  if (editorId && existing.userId !== editorId) {
    return null;
  }

  const update = Object.assign({}, patch || {});
  delete update.recipeId;

  if (update.userId) {
    update.userId = String(update.userId).trim().toUpperCase();
    if (editorId && update.userId !== editorId) {
      throw new ValidationError(['You cannot reassign another chef to this recipe.']);
    }
  }

  if (update.userId || !existing.user) {
    const targetUserId = update.userId || existing.userId;
    const ownerDoc = await findUserDocumentByUserId(targetUserId);
    if (!ownerDoc) {
      throw new ValidationError(['A valid chef account is required for this recipe.']);
    }
    update.user = ownerDoc._id;
    update.userId = ownerDoc.userId;
  }

  update.updatedAt = new Date();

  return Recipe.findOneAndUpdate({ recipeId: normalisedId }, update, { new: true, runValidators: true }).lean();
}

async function deleteRecipe(recipeId, options) {
  await ensureConnection();

  const normalisedId = recipeId ? String(recipeId).trim().toUpperCase() : '';
  if (!normalisedId) {
    return null;
  }

  const opts = options || {};
  const editorId = normaliseUserId(opts.userId);

  const query = { recipeId: normalisedId };
  if (editorId) {
    query.userId = editorId;
  }

  const deletedRecipe = await Recipe.findOneAndDelete(query).lean();
  return deletedRecipe || null;
}

async function getSharedInventorySnapshot(limit) {
  const result = await listInventory({ page: 1, limit: limit || 5, sort: '-createdDate' });
  return result.items;
}

async function getInventoryBasedSuggestions(limit) {
  const insights = await getSmartRecipeDashboardData({});
  const items = (insights && Array.isArray(insights.recommendations)) ? insights.recommendations : [];
  if (!Number.isFinite(limit) || limit <= 0) {
    return items;
  }
  return items.slice(0, limit);
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

async function getAdvancedAnalyticsDashboard(options) {
  const opts = options || {};
  await ensureConnection();

  const inventoryCollectionName = InventoryItem.collection.name;

  const performancePipeline = [
    {
      $project: {
        cuisineType: 1,
        difficulty: 1,
        prepTime: 1,
        servings: 1,
        title: 1,
        chef: 1,
        createdDate: 1,
        ingredientCount: {
          $size: { $ifNull: ['$ingredients', []] }
        }
      }
    },
    {
      $facet: {
        byCuisine: [
          {
            $group: {
              _id: '$cuisineType',
              totalRecipes: { $sum: 1 },
              avgPrepTime: { $avg: '$prepTime' },
              avgServings: { $avg: '$servings' }
            }
          },
          { $sort: { totalRecipes: -1, _id: 1 } }
        ],
        difficultySpread: [
          {
            $group: {
              _id: '$difficulty',
              total: { $sum: 1 }
            }
          },
          { $sort: { total: -1, _id: 1 } }
        ],
        topRecipes: [
          { $sort: { servings: -1, ingredientCount: -1 } },
          {
            $project: {
              _id: 0,
              title: '$title',
              cuisineType: '$cuisineType',
              difficulty: '$difficulty',
              servings: '$servings',
              ingredientCount: '$ingredientCount',
              createdDate: '$createdDate',
              chef: '$chef'
            }
          },
          { $limit: 6 }
        ]
      }
    }
  ];

  const ingredientPipeline = [
    { $unwind: '$ingredients' },
    {
      $group: {
        _id: '$ingredients.ingredientName',
        usageCount: { $sum: 1 },
        avgQuantity: { $avg: '$ingredients.quantity' },
        units: { $addToSet: '$ingredients.unit' },
        recipes: { $addToSet: '$title' }
      }
    },
    {
      $lookup: {
        from: inventoryCollectionName,
        localField: '_id',
        foreignField: 'ingredientName',
        as: 'inventoryPricing'
      }
    },
    {
      $addFields: {
        averageCost: { $avg: '$inventoryPricing.cost' },
        inventoryCount: { $size: '$inventoryPricing' }
      }
    },
    { $sort: { usageCount: -1, _id: 1 } },
    { $limit: 8 }
  ];

  const chefPipeline = [
    {
      $group: {
        _id: { userId: '$userId', difficulty: '$difficulty' },
        chef: { $first: '$chef' },
        cuisine: { $first: '$cuisineType' },
        recipes: { $sum: 1 },
        avgPrep: { $avg: '$prepTime' }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        chef: { $first: '$chef' },
        totalRecipes: { $sum: '$recipes' },
        avgPrepTime: { $avg: '$avgPrep' },
        cuisinePreferences: { $addToSet: '$cuisine' },
        difficultyBreakdown: {
          $push: {
            difficulty: '$_id.difficulty',
            total: '$recipes'
          }
        }
      }
    },
    { $sort: { totalRecipes: -1, chef: 1 } }
  ];

  const seasonalPipeline = [
    {
      $project: {
        year: { $year: '$createdDate' },
        month: { $month: '$createdDate' },
        cuisineType: 1
      }
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        totalRecipes: { $sum: 1 },
        cuisines: { $addToSet: '$cuisineType' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  const costPipeline = [
    {
      $unwind: {
        path: '$ingredients',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: inventoryCollectionName,
        localField: 'ingredients.ingredientName',
        foreignField: 'ingredientName',
        as: 'pricing'
      }
    },
    {
      $addFields: {
        hasInventory: { $gt: [{ $size: '$pricing' }, 0] },
        estimatedIngredientCost: {
          $cond: [
            { $gt: [{ $size: '$pricing' }, 0] },
            {
              $multiply: [
                { $ifNull: ['$ingredients.quantity', 0] },
                {
                  $avg: {
                    $map: {
                      input: '$pricing',
                      as: 'item',
                      in: { $ifNull: ['$$item.cost', 0] }
                    }
                  }
                }
              ]
            },
            0
          ]
        }
      }
    },
    {
      $project: {
        recipeId: '$recipeId',
        title: '$title',
        cuisineType: '$cuisineType',
        difficulty: '$difficulty',
        estimatedIngredientCost: '$estimatedIngredientCost',
        hasInventory: '$hasInventory'
      }
    },
    {
      $group: {
        _id: '$recipeId',
        title: { $first: '$title' },
        cuisineType: { $first: '$cuisineType' },
        difficulty: { $first: '$difficulty' },
        totalCost: { $sum: '$estimatedIngredientCost' },
        matchedIngredients: {
          $sum: {
            $cond: ['$hasInventory', 1, 0]
          }
        },
        totalIngredients: { $sum: 1 }
      }
    },
    {
      $addFields: {
        coverage: {
          $cond: [
            { $gt: ['$totalIngredients', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$matchedIngredients', '$totalIngredients'] },
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
    { $sort: { totalCost: 1, title: 1 } }
  ];

  const [performanceData, ingredientResults, chefResults, seasonalResults, costResults] = await Promise.all([
    Recipe.aggregate(performancePipeline),
    Recipe.aggregate(ingredientPipeline),
    Recipe.aggregate(chefPipeline),
    Recipe.aggregate(seasonalPipeline),
    Recipe.aggregate(costPipeline)
  ]);

  const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
  const performanceDoc = performanceData && performanceData.length ? performanceData[0] : {};

  const cuisinePerformance = Array.isArray(performanceDoc.byCuisine)
    ? performanceDoc.byCuisine.map(function (entry) {
        return {
          cuisineType: entry._id || 'Unspecified',
          totalRecipes: entry.totalRecipes || 0,
          avgPrepTime: Math.round(entry.avgPrepTime || 0),
          avgServings: Math.round(entry.avgServings || 0)
        };
      })
    : [];

  const difficultySummary = Array.isArray(performanceDoc.difficultySpread)
    ? performanceDoc.difficultySpread
        .slice()
        .sort(function (a, b) {
          const orderA = difficultyOrder[a._id] || 99;
          const orderB = difficultyOrder[b._id] || 99;
          if (orderA === orderB) {
            return (b.total || 0) - (a.total || 0);
          }
          return orderA - orderB;
        })
        .map(function (entry) {
          return {
            difficulty: entry._id || 'Unknown',
            total: entry.total || 0
          };
        })
    : [];

  const topRecipes = Array.isArray(performanceDoc.topRecipes)
    ? performanceDoc.topRecipes.map(function (entry) {
        return {
          title: entry.title,
          cuisineType: entry.cuisineType,
          difficulty: entry.difficulty,
          servings: entry.servings || 0,
          ingredientCount: entry.ingredientCount || 0,
          chef: entry.chef || 'Unknown',
          createdDate: entry.createdDate ? new Date(entry.createdDate) : null
        };
      })
    : [];

  const ingredientUsage = ingredientResults.map(function (entry) {
    return {
      ingredientName: entry._id,
      usageCount: entry.usageCount || 0,
      avgQuantity: Math.round((entry.avgQuantity || 0) * 100) / 100,
      units: Array.isArray(entry.units) ? entry.units.join(', ') : '',
      recipeCount: Array.isArray(entry.recipes) ? entry.recipes.length : 0,
      recipes: Array.isArray(entry.recipes) ? entry.recipes : [],
      averageCost: Math.round((entry.averageCost || 0) * 100) / 100,
      inventoryCount: entry.inventoryCount || 0
    };
  });

  const chefInsights = chefResults.map(function (entry) {
    const difficulties = Array.isArray(entry.difficultyBreakdown)
      ? entry.difficultyBreakdown
          .slice()
          .sort(function (a, b) {
            const orderA = difficultyOrder[a.difficulty] || 99;
            const orderB = difficultyOrder[b.difficulty] || 99;
            return orderA - orderB;
          })
          .map(function (item) {
            return {
              difficulty: item.difficulty || 'Unknown',
              total: item.total || 0
            };
          })
      : [];

    return {
      userId: entry._id,
      chef: entry.chef || 'Unknown',
      totalRecipes: entry.totalRecipes || 0,
      avgPrepTime: Math.round(entry.avgPrepTime || 0),
      cuisinePreferences: Array.isArray(entry.cuisinePreferences)
        ? entry.cuisinePreferences.sort()
        : [],
      difficultyBreakdown: difficulties
    };
  });

  const seasonalTrends = seasonalResults.map(function (entry) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const monthIndex = entry._id && entry._id.month ? entry._id.month - 1 : 0;
    const label = monthNames[monthIndex] + ' ' + (entry._id && entry._id.year ? entry._id.year : '');
    return {
      label: label.trim(),
      totalRecipes: entry.totalRecipes || 0,
      cuisines: Array.isArray(entry.cuisines) ? entry.cuisines.sort() : []
    };
  });

  const costReports = costResults.map(function (entry) {
    return {
      recipeId: entry._id,
      title: entry.title,
      cuisineType: entry.cuisineType,
      difficulty: entry.difficulty,
      totalCost: Math.round((entry.totalCost || 0) * 100) / 100,
      coverage: entry.coverage || 0
    };
  });

  const coverageThreshold = Number.isFinite(opts.minCoverage) ? opts.minCoverage : 90;
  const smartData = await getSmartRecipeDashboardData({ userId: opts.inventoryUserId });
  const recommendations = Array.isArray(smartData && smartData.cookability)
    ? smartData.cookability
        .filter(function (item) {
          return (item.cookabilityScore || 0) >= coverageThreshold;
        })
        .slice(0, 6)
        .map(function (item) {
          return {
            title: item.title,
            cuisineType: item.cuisineType,
            cookabilityScore: item.cookabilityScore || 0,
            matchedCount: item.matchedCount || 0,
            totalIngredients: item.totalIngredients || 0,
            missingIngredients: Array.isArray(item.missingIngredients)
              ? item.missingIngredients
              : []
          };
        })
    : [];

  const appliedFilters = {
    cuisine: opts.filterCuisine || '',
    difficulty: opts.filterDifficulty || '',
    mealType: opts.filterMealType || '',
    maxPrep: Number.isFinite(opts.maxPrepMinutes) ? opts.maxPrepMinutes : '',
    search: opts.searchTerm || '',
    chef: opts.chefName || ''
  };

  const recipeQuery = {};
  if (appliedFilters.cuisine) {
    recipeQuery.cuisineType = appliedFilters.cuisine;
  }
  if (appliedFilters.difficulty) {
    recipeQuery.difficulty = appliedFilters.difficulty;
  }
  if (appliedFilters.mealType) {
    recipeQuery.mealType = appliedFilters.mealType;
  }
  if (Number.isFinite(opts.maxPrepMinutes) && opts.maxPrepMinutes > 0) {
    recipeQuery.prepTime = { $lte: opts.maxPrepMinutes };
  }
  if (appliedFilters.search) {
    recipeQuery.title = new RegExp(appliedFilters.search, 'i');
  }
  if (appliedFilters.chef) {
    recipeQuery.chef = new RegExp(appliedFilters.chef, 'i');
  }

  const filteredRecipes = await Recipe.find(recipeQuery, {
    recipeId: 1,
    title: 1,
    cuisineType: 1,
    difficulty: 1,
    prepTime: 1,
    mealType: 1,
    servings: 1,
    chef: 1,
    createdDate: 1
  })
    .sort({ createdDate: -1, title: 1 })
    .limit(20)
    .lean();

  const advancedResults = filteredRecipes.map(function (recipe) {
    return {
      recipeId: recipe.recipeId,
      title: recipe.title,
      cuisineType: recipe.cuisineType,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime || 0,
      mealType: recipe.mealType,
      servings: recipe.servings || 0,
      chef: recipe.chef || 'Unknown',
      createdDate: recipe.createdDate ? new Date(recipe.createdDate) : null
    };
  });

  return {
    performance: cuisinePerformance,
    difficultySummary: difficultySummary,
    topRecipes: topRecipes,
    ingredientUsage: ingredientUsage,
    chefInsights: chefInsights,
    seasonalTrends: seasonalTrends,
    costReports: costReports,
    recommendations: recommendations,
    appliedFilters: appliedFilters,
    filteredRecipes: advancedResults
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
  getRecipesByOwner,
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
  getSmartRecipeDashboardData,
  getAdvancedAnalyticsDashboard,
  getSharedInventorySnapshot,
  getInventoryBasedSuggestions
};
