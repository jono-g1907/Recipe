const { connectToDatabase } = require('../lib/db');

/**
 * Helper that guarantees we have an active Mongo connection before running
 * any queries. We centralise this in one place so every store module can just
 * call `await ensureConnection()` and not worry about the connection state.
 */
async function ensureConnection() {
  await connectToDatabase();
}

/**
 * Many collections store a `userId` string (e.g. `U-00042`). To avoid bugs
 * caused by casing or stray whitespace we normalise every user id by trimming
 * and upper-casing it. Returning an empty string gives the caller a simple
 * "falsy" value to check when no id was supplied.
 */
function normaliseUserId(value) {
  if (!value) {
    return '';
  }
  return String(value).trim().toUpperCase();
}

module.exports = {
  ensureConnection,
  normaliseUserId
};
