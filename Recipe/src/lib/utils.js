// A grab bag of tiny utilities that reduce repetition elsewhere in the codebase.

// Trim a value if it's a string; otherwise return an empty string. This keeps
// downstream code from having to check for null or unexpected types.
function sanitiseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Convert anything to a number, but only return it if it's finite. Beginners
// often forget that Number(undefined) is NaN, so this helper keeps that logic
// in one place.
function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// Create a deep copy of plain objects, arrays, or Date instances so we can make
// safe modifications without mutating the original input.
function clone(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    const out = [];
    for (let i = 0; i < value.length; i++) out.push(clone(value[i]));
    return out;
  }
  if (value && typeof value === 'object') {
    const copy = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) copy[k] = clone(value[k]);
    }
    return copy;
  }
  return value;
}

module.exports = { sanitiseString: sanitiseString, toFiniteNumber: toFiniteNumber, clone: clone };
