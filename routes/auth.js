// UPDATED routes/auth.js - Fix the login route
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
  console.log('=== GET /auth/login ===');
  console.log('User authenticated?', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
  console.log('Current user:', req.user);
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('User already authenticated, redirecting to dashboard');
    return res.redirect('/dashboard');
  }
  
  // FIX: Add the missing page assets that your layout expects
  res.render('login', { 
    user: req.user,
    pageTitle: 'Login',           // This was missing!
    pageScript: '/js/auth.js',    // This was missing!
    pageCSS: '/css/auth.css'      // This was missing!
  });
});

// Handle login form submission
router.post('/login', (req, res, next) => {
  console.log('\n=== POST /auth/login ===');
  console.log('Login data:', { email: req.body.email, passwordLength: req.body.password?.length });
  console.log('Session before:', req.sessionID);
  
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    console.log('❌ Missing credentials');
    req.flash('error', 'Email and password are required');
    return res.redirect('/auth/login');
  }
  
  console.log('🔐 Attempting authentication for:', email);
  
  passport.authenticate('local', (err, user, info) => {
    console.log('\n--- Auth Result ---');
    console.log('Error:', err ? err.message : 'None');
    console.log('User:', user ? `${user.email} (ID: ${user.id})` : 'None');
    console.log('Info:', info ? info.message : 'None');
    
    if (err) {
      console.error('❌ Auth error:', err);
      req.flash('error', 'Authentication error occurred');
      return res.redirect('/auth/login');
    }

    if (!user) {
      console.log('❌ Login failed:', info?.message);
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    console.log('✅ Auth successful, creating session...');
    
    req.logIn(user, (loginErr) => {
      console.log('\n--- Session Creation ---');
      console.log('Login error:', loginErr ? loginErr.message : 'None');
      console.log('Session after login:', req.sessionID);
      console.log('req.user set?', !!req.user);
      console.log('isAuthenticated?', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
      
      if (loginErr) {
        console.error('❌ Session error:', loginErr);
        req.flash('error', 'Could not create session');
        return res.redirect('/auth/login');
      }
      
      console.log('✅ Session created! Redirecting to dashboard...');
      req.flash('success', 'Welcome back!');
      
      // Force session save before redirect
      req.session.save((saveErr) => {
        if (saveErr) console.error('Session save error:', saveErr);
        console.log('🎯 Final redirect to /dashboard');
        return res.redirect('/dashboard');
      });
    });
  })(req, res, next);
});

// Handle logout
router.post('/logout', authController.logout);

module.exports = router;