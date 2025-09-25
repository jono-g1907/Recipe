const { connectToDatabase } = require('../lib/db');

async function ensureConnection() {
  await connectToDatabase();
}

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
