// Convert any supported date input into a YYYY-MM-DD string. Using a helper
// keeps date formatting consistent anywhere we show dates to the user.
function toIsoDate(value) {
  if (!value) return '';

  // Accept both Date instances and values that can be passed into the Date
  // constructor (like timestamps or ISO strings).
  const d = value instanceof Date ? value : new Date(value);

  // Guard against invalid dates, which report NaN for their time value.
  if (Number.isNaN(d.getTime())) return '';

  // The ISO format contains both date and time (e.g. 2024-01-01T12:00:00.000Z)
  // so split on "T" to keep only the date portion.
  return d.toISOString().split('T')[0];
}

module.exports = {
  toIsoDate
};
