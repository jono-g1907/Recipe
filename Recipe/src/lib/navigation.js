// helpers that construct navigation-related values like user IDs and return links 
// keeping the logic in one place avoids duplicating tricky edge cases
const constants = require('./constants');
const { sanitiseString } = require('./utils');

const APP_ID = constants.APP_ID;
const USER_ID_REGEX = /^U-\d{5}$/;

function normaliseUserId(value) {
  // always clean incoming values before touching them 
  // uppercasing keeps the format consistent with how IDs are stored
  const trimmed = sanitiseString(value).toUpperCase();
  return USER_ID_REGEX.test(trimmed) ? trimmed : '';
}

function extractUserIdFromReferer(header) {
  // some routes rely on the Referer header when no explicit userId is present
  const ref = sanitiseString(header);
  if (!ref) {
    return '';
  }
  try {
    // use the URL constructor so don't have to manually parse query strings
    const parsed = new URL(ref, 'http://localhost');
    return normaliseUserId(parsed.searchParams.get('userId'));
  } catch (err) {
    return '';
  }
}

function resolveUserId(req) {
  // requests are unpredictable, so check each possible location in a safe order
  // returning an empty string when missing keeps callers from crashing
  if (!req) {
    return '';
  }

  const fromQuery = normaliseUserId(req.query && req.query.userId);
  if (fromQuery) {
    return fromQuery;
  }

  const fromBody = normaliseUserId(req.body && req.body.userId);
  if (fromBody) {
    return fromBody;
  }

  const refererHeader = req.headers && (req.headers.referer || req.headers.referrer);
  return extractUserIdFromReferer(refererHeader);
}

function buildReturnLink(req) {
  // build a CTA that sends the user back to the most helpful screen based on whether we can identify them from the request
  const userId = resolveUserId(req);
  if (userId) {
    return {
      href: '/home-' + APP_ID + '?userId=' + encodeURIComponent(userId),
      text: 'Return to Home',
      userId: userId,
    };
  }

  // without a user ID we can't take them to a personalised page, so default to login screen
  return {
    href: '/login-' + APP_ID,
    text: 'Go to Login',
    userId: '',
  };
}

module.exports = {
  buildReturnLink: buildReturnLink,
  resolveUserId: resolveUserId,
};