// trim a string, return '' for non-strings
function sanitiseString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
  
  // coerce to finite number or NaN
function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
}
  
  // copy of plain objects & arrays
function clone(value) {
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