const ValidationError = require('../errors/ValidationError');
const navigation = require('../lib/navigation');

/**
 * Check the request's Accept header to learn whether the client
 * explicitly asked for an HTML response instead of JSON.
 *
 * Beginners often forget that browsers and API clients can request
 * different formats. Here we read the `accept` header and look for
 * "text/html" so we can decide which kind of response to send back.
 */
function clientWantsHtml(req) {
  const a = req.headers && (req.headers['accept'] || '');
  return a.indexOf('text/html') !== -1;
}

/**
 * Pick the most helpful HTTP status code when we run into validation
 * errors from our models. We default to 422 (Unprocessable Entity),
 * but if any message mentions "required" we send 400 (Bad Request)
 * because the user simply left out a required field.
 */
function pickValidationStatus(err) {
  let status = 422;
  if (err && err.errors && err.errors.length) {
    for (let i = 0; i < err.errors.length; i++) {
      const msg = String(err.errors[i]).toLowerCase();
      if (msg.indexOf('required') !== -1) {
        status = 400;
        break;
      }
    }
  }
  return status;
}

/**
 * Express error-handling middleware receives any error thrown while
 * handling a request. We inspect the `err` object to figure out the
 * best response to send back to the client.
 */
function errorHandler(err, req, res, next) {
  // If the JSON body the client sent cannot be parsed, Express raises
  // a SyntaxError with a `body` property. We translate that into a
  // user-friendly 400 Bad Request response.
  if (err instanceof SyntaxError && err.hasOwnProperty('body')) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Our custom ValidationError is thrown by models when data fails
  // validation. We choose a status code and either render an HTML page
  // or send JSON depending on what the client asked for.
  if (err instanceof ValidationError) {
    const status = pickValidationStatus(err);
    if (clientWantsHtml(req)) {
      const link = navigation.buildReturnLink(req);
      const message = err.errors && err.errors.length
        ? err.errors.join(' ')
        : 'Validation failed. Please check the information and try again.';
      return res.status(status).render('invalid.html', {
        message: message,
        returnHref: link.href,
        returnText: link.text,
        userId: link.userId,
      });
    }
    return res.status(status).json({ error: 'Validation failed', details: err.errors });
  }

  // For any other kind of unexpected error we log it to the server so
  // developers can diagnose the problem later.
  console.error(err);

  // API clients expect JSON, so if the request was for an /api route we
  // return a generic 500 JSON response. Otherwise we render an HTML
  // error page that still includes a helpful "return" link.
  if (req.path && req.path.indexOf('/api') === 0) {
    return res.status(500).json({ error: 'Server error' });
  }
  const link = navigation.buildReturnLink(req);
  return res.status(500).render('invalid.html', {
    message: 'An unexpected error occurred. Please try again later.',
    returnHref: link.href,
    returnText: link.text,
    userId: link.userId,
  });
}

module.exports = errorHandler;
