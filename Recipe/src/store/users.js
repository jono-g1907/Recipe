// User store encapsulates auth/account related database operations.
const User = require('../models/User');
const { ensureConnection, normaliseUserId } = require('./base');

/**
 * Internal helper used by other store modules that need the full Mongo
 * document (not just the lean object) for population or validation.
 */
async function findUserDocumentByUserId(userId) {
  const normalised = normaliseUserId(userId);
  if (!normalised) {
    return null;
  }

  await ensureConnection();
  return User.findOne({ userId: normalised });
}

/**
 * Generates the next sequential user id in the `U-00001` format. Handy when
 * seeding or creating accounts manually.
 */
async function getNextUserId() {
  await ensureConnection();
  const lastUser = await User.findOne().sort({ userId: -1 }).lean();
  if (!lastUser || !lastUser.userId) {
    return 'U-00001';
  }
  const parts = String(lastUser.userId).split('-');
  const number = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
  const nextNumber = Number.isFinite(number) ? number + 1 : 1;
  return 'U-' + String(nextNumber).padStart(5, '0');
}

/**
 * Fetch a user via their email (normalised to lowercase for reliable matches).
 */
async function getUserByEmail(email) {
  await ensureConnection();
  const normalised = (email || '').toLowerCase();
  return User.findOne({ email: normalised }).lean();
}

/**
 * Fetch a user using their human-friendly id. Returns a lean object suitable
 * for templating.
 */
async function getUserByUserId(userId) {
  await ensureConnection();
  return User.findOne({ userId }).lean();
}

/**
 * Toggle the `isLoggedIn` flag. Helpful for demoing session changes in the UI.
 */
async function setUserLoginState(userId, state) {
  await ensureConnection();
  return User.findOneAndUpdate({ userId }, { isLoggedIn: state }, { new: true }).lean();
}

/**
 * Create a new user document, auto-assigning an id and lowercasing the email
 * so subsequent lookups behave predictably.
 */
async function createUser(data) {
  await ensureConnection();
  // Clone the incoming data so we never mutate the caller's object.
  const payload = Object.assign({}, data);
  if (!payload.userId) {
    payload.userId = await getNextUserId();
  }
  if (payload.email) {
    payload.email = String(payload.email).toLowerCase();
  }
  const user = new User(payload);
  const saved = await user.save();
  return saved.toObject();
}

module.exports = {
  findUserDocumentByUserId,
  getNextUserId,
  getUserByEmail,
  getUserByUserId,
  setUserLoginState,
  createUser
};
