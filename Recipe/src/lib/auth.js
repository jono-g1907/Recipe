// helpers to support authentication-related flows like resolving
// the logged in user or building URLs to redirect users back to the login screen
const { sanitiseString } = require('./utils');

function buildLoginRedirectUrl(appId, message) {
  // provide a default message if a specific error isn't supplied
  const text = message || 'Log in to access the dashboard.';
  // use encodeURIComponent so special characters don't break the query string
  return '/login-' + appId + '?error=' + encodeURIComponent(text);
}

async function resolveActiveUser(req, store, options) {
  // safely handle optional options objects without forcing callers to create one ahead of time
  const opts = options || {};
  // extract the userId from either the query string or the request body
  // trim whitespace and guard against non-string values that could trigger runtime errors
  const queryUserId = sanitiseString(req.query && req.query.userId);
  const bodyUserId = sanitiseString(req.body && req.body.userId);
  const sourceId = queryUserId || bodyUserId;

  if (!sourceId) {
    // error messages are sent directly to the user, so keep wording simple
    return { error: 'Log in to access the dashboard.' };
  }

  // user IDs are stored uppercase in the database so normalise to avoid accidental mismatches
  const userId = sourceId.toUpperCase();
  const user = await store.getUserByUserId(userId);

  if (!user) {
    return { error: 'Account not found. Please log in again.' };
  }

  if (!user.isLoggedIn) {
    // even if the account exists we still require an active session to guard against people bookmarking private URLs
    return { error: 'Your session has ended. Please log in again.' };
  }

  if (Array.isArray(opts.allowedRoles) && opts.allowedRoles.length) {
    // normalise both the user's role and the allowed roles so the comparison is case-insensitive 
    const role = (user.role || '').toString().toLowerCase();
    const allowed = opts.allowedRoles.some(function (allowedRole) {
      return (allowedRole || '').toString().toLowerCase() === role;
    });

    if (!allowed) {
      return { error: 'You are not allowed to access this page.' };
    }
  }
  
  return { user: user };
}

module.exports = {
  buildLoginRedirectUrl,
  resolveActiveUser
};