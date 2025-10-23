// convert supported date input into a YYYY-MM-DD string 
// using this keeps date formatting consistent anywhere we show dates to the user
function toIsoDate(value) {
  if (!value) return '';

  // accept both date instances and values that can be passed into the date constructor
  const d = value instanceof Date ? value : new Date(value);

  // guard against invalid dates, which report NaN for their time value
  if (Number.isNaN(d.getTime())) return '';

  // ISO format contains both date and time
  // so split on "T to keep only the date portion
  return d.toISOString().split('T')[0];
}

module.exports = {
  toIsoDate
};