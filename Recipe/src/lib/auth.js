// Helper functions that support authentication-related flows such as resolving
// the logged in user or building URLs to redirect users back to the login
// screen.
const { sanitiseString } = require('./utils');

function buildLoginRedirectUrl(appId, message) {
  // Provide a friendly default message if a specific error isn't supplied.
  const text = message || 'Log in to access the dashboard.';
  // Use encodeURIComponent so special characters don't break the query string.
  return '/login-' + appId + '?error=' + encodeURIComponent(text);
}

async function resolveActiveUser(req, store, options) {
  // Safely handle optional options objects without forcing callers to create
  // one ahead of time.
  const opts = options || {};
  // Extract the userId from either the query string or the request body. The
  // sanitise helper trims whitespace and guards against non-string values that
  // could otherwise trigger runtime errors for beginners.
  const queryUserId = sanitiseString(req.query && req.query.userId);
  const bodyUserId = sanitiseString(req.body && req.body.userId);
  const sourceId = queryUserId || bodyUserId;

  if (!sourceId) {
    // Callers typically surface the error message directly to the user, so keep
    // the wording friendly and actionable.
    return { error: 'Log in to access the dashboard.' };
  }

  // User IDs are stored uppercase in the database; normalise to avoid
  // accidental mismatches.
  const userId = sourceId.toUpperCase();
  const user = await store.getUserByUserId(userId);

  if (!user) {
    return { error: 'Account not found. Please log in again.' };
  }

  if (!user.isLoggedIn) {
    // Even if the account exists we still require an active session to guard
    // against people bookmarking private URLs.
    return { error: 'Your session has ended. Please log in again.' };
  }

  if (Array.isArray(opts.allowedRoles) && opts.allowedRoles.length) {
    // Normalise both the user's role and the allowed roles so the comparison
    // is case-insensitive and resilient to unexpected values.
    const role = (user.role || '').toString().toLowerCase();
    const allowed = opts.allowedRoles.some(function (allowedRole) {
      return (allowedRole || '').toString().toLowerCase() === role;
    });

    if (!allowed) {
      return { error: 'You are not allowed to access this page.' };
    }
  }

  // By this point all checks have passed, so expose the user object to the
  // caller. Wrapping it in an object keeps the return shape consistent with
  // earlier error branches.
  return { user: user };
}

module.exports = {
  buildLoginRedirectUrl,
  resolveActiveUser
};
