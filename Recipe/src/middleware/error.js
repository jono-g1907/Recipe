const ValidationError = require('../errors/ValidationError');
const navigation = require('../lib/navigation');

function clientWantsHtml(req) {
  const a = req.headers && (req.headers['accept'] || '');
  return a.indexOf('text/html') !== -1;
}

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

function errorHandler(err, req, res, next) {
  // invalid json
  if (err instanceof SyntaxError && err.hasOwnProperty('body')) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // validation errors from models
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

  // anything else
  console.error(err);
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
