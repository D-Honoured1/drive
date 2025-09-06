const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Show registration form
router.get('/register', authController.showRegister);

// Handle registration
router.post('/register', authController.register);

// Show login form
router.get('/login', (req, res) => {
  // Pass any flash error messages to the template
  res.render('login', { error: req.flash('error'), user: req.user });
});

// Handle login using Passport
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Flash error and redirect to login
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    // Successful login
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect('/folders');
    });
  })(req, res, next);
});

// Logout
router.post('/logout', authController.logout);

module.exports = router;
