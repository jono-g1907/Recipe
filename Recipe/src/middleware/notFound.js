const path = require('path');

function notFound(req, res) {
  if (req.accepts('html')) {
    return res
      .status(404)
      .sendFile(path.join(__dirname, '..', 'views', '404.html'));  
  }
  return res
    .status(404)
    .json({ error: 'Not Found', path: req.originalUrl });
  }

module.exports = notFound;