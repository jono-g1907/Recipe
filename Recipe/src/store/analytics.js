const User = require('../models/User');
const Recipe = require('../models/Recipe');
const InventoryItem = require('../models/InventoryItem');
const { ensureConnection, normaliseUserId } = require('./base');
const { calculateInventoryValue } = require('./inventory');

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

async function getInventoryBasedSuggestions(limit) {
  const insights = await getSmartRecipeDashboardData({});
  const items = (insights && Array.isArray(insights.recommendations)) ? insights.recommendations : [];
  if (!Number.isFinite(limit) || limit <= 0) {
    return items;
  }
  return items.slice(0, limit);
}

module.exports = {
  getDashboardStats,
  getSmartRecipeDashboardData,
  getAdvancedAnalyticsDashboard,
  getInventoryBasedSuggestions
};
