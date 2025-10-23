// utilities that reduce repetition

// trim a value if it's a string, otherwise return an empty string
// this keeps from having to check for null or unexpected types
function sanitiseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// convert anything to a number, but only return it if it's finite
function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// create a deep copy of plain objects, arrays or dates so we can make safe modifications without mutating the original input
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