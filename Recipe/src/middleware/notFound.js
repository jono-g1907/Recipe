const navigation = require('../lib/navigation');
const { sanitiseString } = require('../lib/utils');

/**
 * Handle any request that reaches this middleware without finding a
 * matching route. Express runs middleware in order, so by the time we
 * get here we know the user asked for a page that does not exist.
 */
function notFound(req, res) {
  // If the client can handle HTML, render our 404 template so the user
  // sees a friendly error page and a link to head back to safety.
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

  // API clients usually want JSON. We keep the response simple and let
  // them know which path was missing so they can debug their request.
  return res
    .status(404)
    .json({ error: 'Not Found', path: req.originalUrl });
}

module.exports = notFound;
