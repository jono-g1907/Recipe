const path = require('path');

function notFound(req, res) {
  if (req.path && req.path.indexOf('/api') === 0) {
    return res.status(404).json({ error: 'Not Found', path: req.originalUrl });
  }
  return res.status(404).sendFile(path.join(__dirname, '..', 'views', '404.html'));
}

module.exports = notFound;