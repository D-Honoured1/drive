const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Show registration form
router.get('/register', authController.showRegister);

// Handle registration form submission
router.post('/register', authController.register);

// Show login form - redirect if already authenticated
router.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('login', { user: req.user });
});

// Handle login form submission
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    req.flash('error', 'Email and password are required');
    return res.redirect('/auth/login');
  }
  
  console.log('Login attempt for:', email);
  
  passport.authenticate('local', (err, user, info) => {
    console.log('Auth callback:', {
      err: err ? err.message : null,
      user: user ? `ID: ${user.id}, Email: ${user.email}` : null,
      info: info ? info.message : null
    });
    
    // If an error occurred in strategy
    if (err) {
      console.error('Passport strategy error:', err);
      req.flash('error', 'An error occurred during login');
      return res.redirect('/auth/login');
    }

    // If login failed
    if (!user) {
      console.log('Login failed for:', email, 'Reason:', info?.message);
      req.flash('error', info?.message || 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Successful authentication, establish session
    req.logIn(user, (err) => {
      if (err) {
        console.error('Session establishment error:', err);
        req.flash('error', 'Login session could not be established');
        return res.redirect('/auth/login');
      }
      
      console.log('Login successful for user:', user.email, 'Redirecting to dashboard');
      req.flash('success', 'Welcome back!');
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// Handle logout
router.post('/logout', authController.logout);

module.exports = router;
