const path = require('path');
const ValidationError = require('../errors/ValidationError');

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
      return res.redirect(302, '/invalid.html');
    }
    return res.status(status).json({ error: 'Validation failed', details: err.errors });
  }

  // anything else
  console.error(err);
  if (req.path && req.path.indexOf('/api') === 0) {
    return res.status(500).json({ error: 'Server error' });
  }
  return res.status(500).sendFile(path.join(__dirname, '..', 'views', 'invalid.html'));
}

module.exports = errorHandler;