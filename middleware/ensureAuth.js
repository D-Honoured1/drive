/**
 * ensureAuth middleware - protects routes.
 * If user is authenticated (req.isAuthenticated), calls next().
 * Otherwise redirects to login page (or returns 401 for API calls).
 */

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // If request wants JSON, return 401 JSON
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // default: redirect to login
  return res.redirect('/auth/login');
}

module.exports = ensureAuth;
