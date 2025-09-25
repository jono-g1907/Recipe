// Reuse helper functions so every form treats text and dates the same way
const { sanitiseString } = require('../lib/utils');
const {
  INVENTORY_ID_REGEX,
  USER_ID_REGEX,
  INGREDIENT_NAME_REGEX,
  UNIT_OPTIONS,
  INVENTORY_CATEGORY_OPTIONS,
  LOCATION_OPTIONS
} = require('../lib/validationConstants');
const { toIsoDate } = require('../lib/date');


// A template object that represents a completely blank inventory form.
// We copy this whenever we need to render an empty form so we do not mutate
// the original object by accident.
const EMPTY_INVENTORY_FORM_VALUES = {
  inventoryId: '',
  userId: '',
  ingredientName: '',
  quantity: '',
  unit: '',
  category: '',
  purchaseDate: '',
  expirationDate: '',
  location: '',
  cost: '',
  createdDate: ''
};

// Returns a cloned copy of the blank form so each caller gets an independent
// object. This prevents one caller from accidentally changing the defaults
// for everyone else.
function getEmptyInventoryFormValues() {
  return Object.assign({}, EMPTY_INVENTORY_FORM_VALUES);
}

// Convert the raw HTTP request body into a normalised inventory object.
// Every field is trimmed, converted to the right data type and given a
// sensible default so downstream code can rely on it.
function parseInventoryForm(body) {
  const item = {};
  item.inventoryId = (body.inventoryId || '').trim();

  // Clean user input to avoid leading/trailing whitespace and enforce the
  // uppercase convention used throughout the application.
  const userIdInput = sanitiseString(body && body.userId);
  item.userId = userIdInput ? userIdInput.toUpperCase() : '';

  item.ingredientName = (body.ingredientName || '').trim();
  item.quantity = Number(body.quantity);
  item.unit = (body.unit || '').trim().toLowerCase();
  item.category = (body.category || '').trim();

  // Dates are stored as actual Date objects so later validation can compare
  // them using getTime rather than working with strings.
  item.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
  item.expirationDate = body.expirationDate ? new Date(body.expirationDate) : new Date();
  item.location = (body.location || '').trim();
  item.cost = Number(body.cost);
  item.createdDate = body.createdDate ? new Date(body.createdDate) : new Date();
  return item;
}

// Validate a parsed inventory item and return a list of friendly error
// messages. Returning an array makes it easy for callers to display every
// problem to the user at once.
function collectInventoryErrors(item) {
  const errors = [];
  if (!item) {
    errors.push('Inventory details are required.');
    return errors;
  }

  // Each validation block follows the same pattern:
  // 1. Clean up the input.
  // 2. Check it exists.
  // 3. Validate the format or value range.
  const inventoryId = sanitiseString(item.inventoryId).toUpperCase();
  if (!inventoryId) {
    errors.push('Inventory ID is required.');
  } else if (!INVENTORY_ID_REGEX.test(inventoryId)) {
    errors.push('Inventory ID must follow the I-00000 format.');
  }

  const userId = sanitiseString(item.userId).toUpperCase();
  if (!userId || !USER_ID_REGEX.test(userId)) {
    errors.push('A valid user ID is required.');
  }

  const name = sanitiseString(item.ingredientName);
  if (!name) {
    errors.push('Ingredient name is required.');
  } else if (!INGREDIENT_NAME_REGEX.test(name)) {
    errors.push('Ingredient names must be 2-50 characters using letters, spaces, hyphens or apostrophes.');
  }

  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity)) {
    errors.push('Quantity must be a number.');
  } else if (quantity <= 0 || quantity > 9999) {
    errors.push('Quantity must be between 0.01 and 9999.');
  }

  const unit = sanitiseString(item.unit).toLowerCase();
  if (!unit || UNIT_OPTIONS.indexOf(unit) === -1) {
    errors.push('Select a valid unit.');
  }

  const category = sanitiseString(item.category);
  if (!category || INVENTORY_CATEGORY_OPTIONS.indexOf(category) === -1) {
    errors.push('Select a valid category.');
  }

  const location = sanitiseString(item.location);
  if (!location || LOCATION_OPTIONS.indexOf(location) === -1) {
    errors.push('Select a valid location.');
  }

  const cost = Number(item.cost);
  if (!Number.isFinite(cost)) {
    errors.push('Cost must be a number.');
  } else if (cost < 0.01 || cost > 999.99) {
    errors.push('Cost must be between 0.01 and 999.99.');
  } else {
    // Ensures we do not accept values like 9.999 which the UI cannot display
    // correctly when rounded to two decimal places.
    const cents = Math.round(cost * 100);
    // Guard against floating point rounding problems when checking for two decimal places.
    if (Math.abs(cost * 100 - cents) > 1e-6) {
      errors.push('Cost must have no more than two decimal places.');
    }
  }

  // Support both Date objects and strings by converting anything that's not already a Date.
  const purchaseDate = item.purchaseDate instanceof Date ? item.purchaseDate : new Date(item.purchaseDate);
  if (!(purchaseDate instanceof Date) || Number.isNaN(purchaseDate.getTime())) {
    errors.push('Purchase date must be a valid date.');
  } else if (purchaseDate.getTime() > Date.now()) {
    errors.push('Purchase date cannot be in the future.');
  }

  // Reuse the same "accept Date or string" logic for expiration checks.
  const expirationDate = item.expirationDate instanceof Date ? item.expirationDate : new Date(item.expirationDate);
  if (!(expirationDate instanceof Date) || Number.isNaN(expirationDate.getTime())) {
    errors.push('Expiration date must be a valid date.');
  } else if (!Number.isNaN(purchaseDate.getTime()) && expirationDate.getTime() <= purchaseDate.getTime()) {
    errors.push('Expiration date must be after the purchase date.');
  }

  // Created date also needs to become a Date object before validation.
  const createdDate = item.createdDate instanceof Date ? item.createdDate : new Date(item.createdDate);
  if (!(createdDate instanceof Date) || Number.isNaN(createdDate.getTime())) {
    errors.push('Created date must be a valid date.');
  } else if (createdDate.getTime() > Date.now()) {
    errors.push('Created date cannot be in the future.');
  }

  return errors;
}

// Prepare an inventory item for display in a form. This function ensures
// every field is a string or number that the template can render without
// additional checks.
function buildInventoryFormValuesFromItem(item) {
  const values = getEmptyInventoryFormValues();
  if (!item) {
    return values;
  }

  values.inventoryId = sanitiseString(item.inventoryId).toUpperCase();
  values.userId = sanitiseString(item.userId).toUpperCase();
  values.ingredientName = sanitiseString(item.ingredientName);

  const quantityNumber = Number(item.quantity);
  values.quantity = Number.isFinite(quantityNumber) ? quantityNumber : '';

  values.unit = sanitiseString(item.unit).toLowerCase();
  values.category = sanitiseString(item.category);
  values.location = sanitiseString(item.location);

  const costNumber = Number(item.cost);
  if (Number.isFinite(costNumber)) {
    // Round to cents and force two decimal places so the input shows a money-friendly value.
    values.cost = (Math.round(costNumber * 100) / 100).toFixed(2);
  } else {
    values.cost = '';
  }

  // Convert Date objects back into the YYYY-MM-DD format expected by
  // `<input type="date">` fields in the browser.
  values.purchaseDate = toIsoDate(item.purchaseDate);
  values.expirationDate = toIsoDate(item.expirationDate);
  values.createdDate = toIsoDate(item.createdDate);

  return values;
}

// Prepares inventory data with helper fields (like expiry status) for rendering templates.
function mapInventoryForView(item) {
  const now = new Date();
  const expiration = item.expirationDate instanceof Date ? item.expirationDate : new Date(item.expirationDate);
  let daysLeft = null;
  if (expiration && !Number.isNaN(expiration.getTime())) {
    // Convert the millisecond difference into whole days remaining until the item expires.
    const diff = expiration.getTime() - now.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  let expiryStatus = 'unknown';
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      expiryStatus = 'expired';
    } else if (daysLeft <= 3) {
      expiryStatus = 'soon';
    } else {
      expiryStatus = 'ok';
    }
  }

  const costNumber = Number(item.cost);

  return {
    inventoryId: item.inventoryId,
    userId: item.userId,
    ingredientName: item.ingredientName,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    purchaseDate: toIsoDate(item.purchaseDate),
    expirationDate: toIsoDate(item.expirationDate),
    location: item.location,
    cost: Number.isFinite(costNumber) ? costNumber : 0,
    createdDate: toIsoDate(item.createdDate),
    daysLeft: daysLeft,
    expiryStatus: expiryStatus
  };
}

module.exports = {
  UNIT_OPTIONS,
  INVENTORY_CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  getEmptyInventoryFormValues,
  parseInventoryForm,
  collectInventoryErrors,
  buildInventoryFormValuesFromItem,
  mapInventoryForView
};
