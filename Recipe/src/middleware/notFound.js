const navigation = require('../lib/navigation');
const { sanitiseString } = require('../lib/utils');

function notFound(req, res) {
  // if the client can handle HTML, render 404 template
  if (req.accepts('html')) {
    const link = navigation.buildReturnLink(req);
    const requestedPath = sanitiseString(req.originalUrl || req.path || '');
    return res.status(404).render('404.html', {
      returnHref: link.href,
      returnText: link.text,
      userId: link.userId,
      requestedPath: requestedPath,
    });
  }

  return res
    .status(404)
    .json({ error: 'Not Found', path: req.originalUrl });
}

module.exports = notFound;