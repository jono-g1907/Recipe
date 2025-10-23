const ValidationError = require('../errors/ValidationError');
const navigation = require('../lib/navigation');

// check request's accept header to learn whether the client explicitly asked for an HTML response or JSON
function clientWantsHtml(req) {
  const a = req.headers && (req.headers['accept'] || '');
  return a.indexOf('text/html') !== -1;
}


// pick most helpful HTTP status code when we run into validation errors 
// wedefault to 422, but if any message mentions required we send 400 because the user left out a required field
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


  // error-handling middleware receives any error thrown while handling a request 
  // inspect the err object to figure out the best response to send back to the client
function errorHandler(err, req, res, next) {
  // if the JSON body the client sent cannot be parsed, raise a SyntaxError with a body property
  // translate that into 400 response 
  if (err instanceof SyntaxError && err.hasOwnProperty('body')) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // custom ValidationError is thrown by models when data fails validation 
  // choose a status code and either render an HTML page or send JSON 
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

  // for any other kind of unexpected error, log it to the server
  console.error(err);

  // API clients expect JSON, so if the request was for an /api route we return a generic 500 JSON response
  // otherwise render an HTML error page
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