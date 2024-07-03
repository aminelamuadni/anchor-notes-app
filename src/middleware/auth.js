/**
 * Middleware to ensure that the user is authenticated.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
function ensureAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

/**
 * Attaches the user object to the response locals.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
}

module.exports = { ensureAuth, attachUser };
