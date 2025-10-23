const ValidationError = require('../../errors/ValidationError');
// converts low-level errors into an easier to handle object
const normaliseError = require('../../lib/normaliseError');
// authentication helpers to check roles and redirect unauthenticated users
const { buildLoginRedirectUrl, resolveActiveUser } = require('../../lib/auth');
// shared form helpers keep the parsing and validation logic consistent across routes
const {
  getEmptyInventoryFormValues,
  parseInventoryForm,
  collectInventoryErrors,
  buildInventoryFormValuesFromItem,
  mapInventoryForView
} = require('../../forms/inventoryForm');
// enums of allowed dropdown values used for validation and rendering
const {
  INVENTORY_CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  UNIT_OPTIONS
} = require('../../lib/validationConstants');
// sanitise user text before placing it back into HTML
const { sanitiseString } = require('../../lib/utils');

function renderInventoryEditForm(res, user, items, selectedId, values, errorMessage, successMessage, status, appId) {
  // make sure template receives a full set of form values plus the latest status info
  const safeValues = values || getEmptyInventoryFormValues();
  const statusCode = status || 200;
  return res.status(statusCode).render('edit-inventory-31477046.html', {
    error: errorMessage || '',
    success: successMessage || '',
    values: safeValues,
    items: Array.isArray(items) ? items : [],
    selectedInventoryId: selectedId || '',
    categories: INVENTORY_CATEGORY_OPTIONS,
    locations: LOCATION_OPTIONS,
    units: UNIT_OPTIONS,
    userId: user ? user.userId : '',
    defaultUserId: user ? user.userId : '',
    appId: appId || ''
  });
}

function registerInventoryRoutes(app, dependencies) {
  const store = dependencies.store;
  const appId = dependencies.appId;

  function renderEdit(res, user, items, selectedId, values, errorMessage, successMessage, status) {
    // wrap the helper so the appId is automatically included every time we render
    return renderInventoryEditForm(res, user, items, selectedId, values, errorMessage, successMessage, status, appId);
  }

  // simple form for adding a new inventory item
  app.get('/add-inventory-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;

      res.render('add-inventory-31477046.html', {
        defaultUserId: user.userId,
        userId: user.userId,
        categories: INVENTORY_CATEGORY_OPTIONS,
        locations: LOCATION_OPTIONS,
        units: UNIT_OPTIONS,
        appId: appId
      });
    } catch (err) {
      next(err);
    }
  });

  // allow users to pick an existing item and edit its details
  app.get('/edit-inventory-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const listResult = await store.listInventory({ page: 1, limit: 500, sort: '-createdDate' });
      const items = Array.isArray(listResult.items) ? listResult.items : [];

      // try to find the inventory item requested in the query string
      const queryId = sanitiseString(req.query && req.query.inventoryId);
      const requestedId = queryId ? queryId.toUpperCase() : '';
      let selectedItem = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i] && items[i].inventoryId === requestedId) {
          selectedItem = items[i];
          break;
        }
      }

      let errorMessage = sanitiseString(req.query && req.query.error);
      if (!items.length) {
        errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'There are no inventory items to edit yet. Add an item first.';
      } else if (requestedId && !selectedItem) {
        errorMessage = (errorMessage ? errorMessage + ' ' : '') + 'Inventory item ' + requestedId + ' was not found. Showing your first item.';
      }

      if (!selectedItem && items.length) {
        selectedItem = items[0];
      }

      // fill the form with the selected inventory item
      const values = selectedItem ? buildInventoryFormValuesFromItem(selectedItem) : getEmptyInventoryFormValues();
      const successMessage = sanitiseString(req.query && req.query.success) || '';
      const selectedId = selectedItem ? selectedItem.inventoryId : '';

      return renderEdit(res, user, items, selectedId, values, errorMessage || '', successMessage, 200);
    } catch (err) {
      next(err);
    }
  });

  // small confirmation form before removing an item completely
  app.get('/delete-inventory-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const error = sanitiseString(req.query && req.query.error);
      const lastId = sanitiseString(req.query && req.query.lastId);
      res.render('delete-inventory-31477046.html', {
        error: error || '',
        lastId: lastId || '',
        userId: user.userId,
        appId: appId
      });
    } catch (err) {
      next(err);
    }
  });

  // perform the deletion once the user confirms
  app.post('/delete-inventory-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.render('delete-inventory-31477046.html', {
          error: result.error || 'You must be logged in to delete inventory items.',
          lastId: '',
          userId: '',
          appId: appId
        });
      }

      const activeUser = result.user;
      const idInput = (req.body.inventoryId || '').trim().toUpperCase();
      if (!idInput) {
        // without an ID we do not know which record to delete
        return res.render('delete-inventory-31477046.html', {
          error: 'inventoryId is required',
          lastId: '',
          userId: activeUser.userId,
          appId: appId
        });
      }

      const deletion = await store.deleteInventoryItem(idInput);
      if (!deletion || deletion.deletedCount === 0) {
        return res.render('delete-inventory-31477046.html', {
          error: 'Inventory item not found',
          lastId: idInput,
          userId: activeUser.userId,
          appId: appId
        });
      }

      const params = [];
      // pass context to the dashboard so it can display a status message
      params.push('userId=' + encodeURIComponent(activeUser.userId));
      params.push('deleted=' + encodeURIComponent(idInput));
      const redirectTarget = '/inventory-dashboard-' + appId + '?' + params.join('&');
      return res.redirect(302, redirectTarget);
    } catch (err) {
      next(err);
    }
  });

  // show a grouped inventory overview with optional success messages
  app.get('/inventory-dashboard-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const user = result.user;
      const items = await store.getAllInventory();
      const rows = items.map(mapInventoryForView);

      const groupBy = req.query.group === 'category' ? 'category' : 'location';
      const groups = {};
      // build a dictionary keyed by either location or category so the template can group rows
      for (let i = 0; i < rows.length; i++) {
        const key = rows[i][groupBy] || 'Unspecified';
        if (!groups[key]) {
          groups[key] = { items: [], value: 0 };
        }
        groups[key].items.push(rows[i]);
        if (Number.isFinite(rows[i].cost)) {
          groups[key].value += rows[i].cost;
        }
      }

      let totalValue = 0;
      // calculate the combined cost of every inventory item
      for (let j = 0; j < rows.length; j++) {
        if (Number.isFinite(rows[j].cost)) {
          totalValue += rows[j].cost;
        }
      }

      const deletedId = sanitiseString(req.query && req.query.deleted);
      const updatedId = sanitiseString(req.query && req.query.updated);
      const updatedName = sanitiseString(req.query && req.query.updatedName);
      const notices = [];
      // build a list of status strings that summarise recent actions
      if (updatedId) {
        let text = 'Updated inventory item ' + updatedId;
        if (updatedName) {
          text += ' (' + updatedName + ')';
        }
        notices.push(text);
      }
      if (deletedId) {
        notices.push('Deleted inventory item ' + deletedId);
      }
      const msg = notices.join(' ');

      res.render('inventory-dashboard-31477046.html', {
        groupBy: groupBy,
        groups: groups,
        totalValue: totalValue,
        appId: appId,
        msg: msg,
        itemCount: rows.length,
        userId: user.userId
      });
    } catch (err) {
      next(err);
    }
  });

  // update an existing inventory item
  app.post('/edit-inventory-' + appId, async function (req, res, next) {
    let activeUser = null;
    let inventoryOptions = [];
    let formValues = null;
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      activeUser = result.user;
      const listResult = await store.listInventory({ page: 1, limit: 500, sort: '-createdDate' });
      inventoryOptions = Array.isArray(listResult.items) ? listResult.items : [];

      const payload = parseInventoryForm(req.body || {});
      payload.userId = activeUser.userId;
      payload.inventoryId = payload.inventoryId ? payload.inventoryId.toUpperCase() : '';
      formValues = buildInventoryFormValuesFromItem(payload);

      if (!payload.inventoryId) {
        // force the user to pick which inventory item they want to update
        return renderEdit(res, activeUser, inventoryOptions, '', formValues, 'Select an inventory item to update.', '', 400);
      }

      const existingItem = await store.getInventoryItemById(payload.inventoryId);
      if (!existingItem) {
        return renderEdit(res, activeUser, inventoryOptions, payload.inventoryId, formValues, 'Inventory item ' + payload.inventoryId + ' was not found.', '', 404);
      }

      const validationErrors = collectInventoryErrors(payload);
      if (validationErrors.length) {
        return renderEdit(res, activeUser, inventoryOptions, existingItem.inventoryId, formValues, validationErrors.join(' '), '', 400);
      }

      const patch = {
        // only expose the fields we allow the user to modify
        ingredientName: payload.ingredientName,
        quantity: payload.quantity,
        unit: payload.unit,
        category: payload.category,
        purchaseDate: payload.purchaseDate,
        expirationDate: payload.expirationDate,
        location: payload.location,
        cost: payload.cost,
        createdDate: payload.createdDate,
        userId: existingItem.userId
      };

      const updatedItem = await store.updateInventoryItem(existingItem.inventoryId, patch);
      if (!updatedItem) {
        return renderEdit(res, activeUser, inventoryOptions, existingItem.inventoryId, formValues, 'Inventory item could not be updated. Try again.', '', 500);
      }

      const params = [];
      params.push('userId=' + encodeURIComponent(activeUser.userId));
      params.push('inventoryId=' + encodeURIComponent(updatedItem.inventoryId));
      let successMessage = 'Updated inventory item ' + updatedItem.inventoryId + '.';
      if (updatedItem.ingredientName) {
        successMessage = 'Updated inventory item ' + updatedItem.inventoryId + ' (' + updatedItem.ingredientName + ').';
      }
      params.push('success=' + encodeURIComponent(successMessage));

      return res.redirect(302, '/edit-inventory-' + appId + '?' + params.join('&'));
    } catch (err) {
      const normalised = normaliseError(err);
      if (normalised instanceof ValidationError) {
        if (!formValues) {
          const fallback = parseInventoryForm(req.body || {});
          if (activeUser) {
            fallback.userId = activeUser.userId;
          }
          fallback.inventoryId = fallback.inventoryId ? fallback.inventoryId.toUpperCase() : '';
          formValues = buildInventoryFormValuesFromItem(fallback);
        }
        const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Unable to update inventory item.';
        const selectedId = formValues && formValues.inventoryId ? formValues.inventoryId : '';
        // re-render the form with the captured values and validation feedback
        return renderEdit(res, activeUser, inventoryOptions, selectedId, formValues, message, '', 400);
      }
      next(normalised);
    }
  });

  // insert a new inventory record
  app.post('/add-inventory-' + appId, async function (req, res, next) {
    try {
      const result = await resolveActiveUser(req, store, { allowedRoles: ['chef', 'manager', 'admin'] });
      if (!result.user) {
        return res.redirect(302, buildLoginRedirectUrl(appId, result.error));
      }

      const payload = parseInventoryForm(req.body || {});
      payload.userId = result.user.userId;

      // persist to the data store then head back to the dashboard
      await store.createInventoryItem(payload);
      const redirectUserId = result.user.userId;
      const params = [];
      if (redirectUserId) {
        params.push('userId=' + encodeURIComponent(redirectUserId));
      }
      const redirectTarget = '/inventory-dashboard-' + appId + (params.length ? '?' + params.join('&') : '');
      return res.redirect(302, redirectTarget);
    } catch (err) {
      next(normaliseError(err));
    }
  });
}

module.exports = registerInventoryRoutes;
