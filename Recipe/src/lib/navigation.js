const constants = require('./constants');
const { sanitiseString } = require('./utils');

const APP_ID = constants.APP_ID;
const USER_ID_REGEX = /^U-\d{5}$/;

function normaliseUserId(value) {
  const trimmed = sanitiseString(value).toUpperCase();
  return USER_ID_REGEX.test(trimmed) ? trimmed : '';
}

function extractUserIdFromReferer(header) {
  const ref = sanitiseString(header);
  if (!ref) {
    return '';
  }
  try {
    const parsed = new URL(ref, 'http://localhost');
    return normaliseUserId(parsed.searchParams.get('userId'));
  } catch (err) {
    return '';
  }
}

function resolveUserId(req) {
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
  const userId = resolveUserId(req);
  if (userId) {
    return {
      href: '/home-' + APP_ID + '?userId=' + encodeURIComponent(userId),
      text: 'Return to Home',
      userId: userId,
    };
  }

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
