/**
 * Authentication routes
 * Handles login, registration, and logout
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Show registration form
router.get('/register', authController.showRegister);

// Handle registration form submission
router.post('/register', authController.register);

// Show login form
router.get('/login', authController.showLogin);

// Handle login form submission using Passport Local Strategy
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    // If an error occurred in strategy
    if (err) return next(err);

    // If login failed
    if (!user) {
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    // Successful login: establish session
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect('/dashboard'); // redirect on success
    });
  })(req, res, next);
});

// Handle logout
router.post('/logout', authController.logout);

module.exports = router;
