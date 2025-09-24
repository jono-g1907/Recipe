const { sanitiseString } = require('./utils');

function buildLoginRedirectUrl(appId, message) {
  const text = message || 'Log in to access the dashboard.';
  return '/login-' + appId + '?error=' + encodeURIComponent(text);
}

async function resolveActiveUser(req, store) {
  const queryUserId = sanitiseString(req.query && req.query.userId);
  const bodyUserId = sanitiseString(req.body && req.body.userId);
  const sourceId = queryUserId || bodyUserId;

  if (!sourceId) {
    return { error: 'Log in to access the dashboard.' };
  }

  const userId = sourceId.toUpperCase();
  const user = await store.getUserByUserId(userId);

  if (!user) {
    return { error: 'Account not found. Please log in again.' };
  }

  if (!user.isLoggedIn) {
    return { error: 'Your session has ended. Please log in again.' };
  }

  return { user: user };
}

module.exports = {
  buildLoginRedirectUrl,
  resolveActiveUser
};
