/**
 * Authentication routes
 *
 * Routes:
 *  GET /auth/register
 *  POST /auth/register
 *  GET /auth/login
 *  POST /auth/login
 *  POST /auth/logout
 */

const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.showRegister);
router.post('/register', authController.register);

router.get('/login', authController.showLogin);
// passport local login
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: false
  }),
  (req, res) => {
    // on success
    res.redirect('/dashboard');
  }
);

router.post('/logout', authController.logout);

module.exports = router;
