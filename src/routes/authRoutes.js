/**
 * Express router providing authentication related routes.
 */

const express = require('express');
const {
  getLogin, postLogin, getRegister, postRegister, logout,
} = require('../controllers/authController');
const { attachUser } = require('../middleware/auth');

/**
 * Creates an authentication router.
 * @returns {express.Router} The authentication router.
 */
function createAuthRouter() {
  const router = express.Router();

  router.use(attachUser);

  router.get('/login', getLogin);
  router.post('/login', postLogin);
  router.get('/register', getRegister);
  router.post('/register', postRegister);
  router.get('/logout', logout);

  return router;
}

module.exports = createAuthRouter;
