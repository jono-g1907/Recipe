let utils = require('../lib/utils');
let sanitiseString = utils.sanitiseString;
let toFiniteNumber = utils.toFiniteNumber;
let clone = utils.clone;

let ValidationError = require('../errors/ValidationError');
let enums = require('../enums');
let Location = enums.Location;

// constructor for assigning and validating a create
function InventoryItem(data) { 
  this._assignAndValidate(data, false); 
}

// plain object clone for serialisation
InventoryItem.prototype.toJSON = function () {
  return clone({
    inventoryId: this.inventoryId,
    userId: this.userId,
    ingredientName: this.ingredientName,
    quantity: this.quantity,
    unit: this.unit,
    category: this.category,
    purchaseDate: this.purchaseDate,
    expirationDate: this.expirationDate,
    location: this.location,
    cost: this.cost,
    createdDate: this.createdDate
  });
};

// partial updates
InventoryItem.prototype.update = function (partial) { 
  this._assignAndValidate(partial, true); 
};

// adjust quantity by a difference
InventoryItem.prototype.adjustQuantity = function (diff) {
  const next = toFiniteNumber(diff);
  if (!Number.isFinite(next)) {
    throw new ValidationError(['difference must be a valid number']);
  }

  const newQuantity = this.quantity + next;

  if (newQuantity < 0) {
    throw new ValidationError(['quantity cannot be negative']);
  }

  this.quantity = newQuantity;
  return this.quantity;
};

// set quantity directly 
InventoryItem.prototype.setQuantity = function (quantity) {
  const n = toFiniteNumber(quantity);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError(['quantity cannot be negative']);
  }

  this.quantity = n;
  return this.quantity;
};

// check if item is expiring within x days from now
InventoryItem.prototype.isExpiringSoon = function (x) {
  const d = toFiniteNumber(x);
  
  if (!Number.isFinite(d) || d < 0) {
    return false;
  }

  const now = new Date();
  const soon = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  return this.expirationDate <= soon;
};

// check if current stock is below a threshold
InventoryItem.prototype.isLowStock = function (threshold) {
  const t = toFiniteNumber(threshold);

  if (!Number.isFinite(t) || t < 0) {
    return false;
  }

  return this.quantity < t;
};

// assignment and validation
InventoryItem.prototype._assignAndValidate = function (patch, isPatch) {
  const prev = typeof this.toJSON === 'function' ? this.toJSON() : null; // if already exist, start from copy else start from null
  const next = prev ? clone(prev) : {}; // for updating on top of shallow copy

  // on create (!isPatch) every field is considered
  // on patch, only affected fields are considered
  if (!isPatch || patch.inventoryId !== undefined) next.inventoryId = sanitiseString(patch.inventoryId);
  if (!isPatch || patch.userId !== undefined) next.userId = sanitiseString(patch.userId);
  if (!isPatch || patch.ingredientName !== undefined) next.ingredientName = sanitiseString(patch.ingredientName);
  if (!isPatch || patch.quantity !== undefined) next.quantity = toFiniteNumber(patch.quantity);
  if (!isPatch || patch.unit !== undefined) next.unit = sanitiseString(patch.unit);
  if (!isPatch || patch.category !== undefined) next.category = sanitiseString(patch.category || '');

  // date fields, coerce strings and numbers to dates
  // default to now if false, to new Date() on NaN
  if (!isPatch || patch.purchaseDate !== undefined) {
    let d1 = new Date(patch.purchaseDate !== undefined ? patch.purchaseDate : (prev ? prev.purchaseDate : Date.now()));

    if (!(d1 instanceof Date) || isNaN(d1.getTime())) {
      d1 = new Date();
    }

    next.purchaseDate = d1;
  }

  if (!isPatch || patch.expirationDate !== undefined) {
    let d2 = new Date(patch.expirationDate !== undefined ? patch.expirationDate : (prev ? prev.expirationDate : Date.now()));

    if (!(d2 instanceof Date) || isNaN(d2.getTime())) {
      d2 = new Date();
    }

    next.expirationDate = d2;
  }

  if (!isPatch || patch.createdDate !== undefined) {
    let d3 = new Date(patch.createdDate !== undefined ? patch.createdDate : (prev ? prev.createdDate : Date.now()));

    if (!(d3 instanceof Date) || isNaN(d3.getTime())) {
      d3 = new Date();
    }

    next.createdDate = d3;
  }

  if (!isPatch || patch.location !== undefined) next.location = sanitiseString(patch.location);
  if (!isPatch || patch.cost !== undefined) next.cost = toFiniteNumber(patch.cost);

  // collect validation errors for next state
  let errors = [];
  if (!next.inventoryId) errors.push('inventoryId is required');
  if (!next.userId) errors.push('userId is required');
  if (!next.ingredientName) errors.push('ingredientName is required');
  
  if (!Number.isFinite(next.quantity) || next.quantity < 0) errors.push('quantity must be a non-negative number');
  if (!next.unit) errors.push('unit is required');

  // enum check for location
  if (!isPatch || next.location !== undefined) {
    const allowed = [Location.PANTRY, Location.FRIDGE, Location.FREEZER];
    if (allowed.indexOf(next.location) === -1) errors.push('location must be one of: ' + allowed.join(', '));
  }

  if (!isPatch || next.cost !== undefined) {
    if (!Number.isFinite(next.cost) || next.cost < 0) errors.push('cost must be a non-negative number');
  }

  if (next.expirationDate < next.purchaseDate) errors.push('expirationDate cannot be before purchaseDate');

  if (errors.length) throw new ValidationError(errors);

  for (const k in next) {
    this[k] = next[k];
  }
};

module.exports = InventoryItem;