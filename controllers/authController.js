/**
 * Authentication controllers (register, login page, logout)
 */

const prisma = require('../db/prismaClient');
const bcrypt = require('bcrypt');

exports.showRegister = (req, res) => {
  res.render('register', { 
    user: req.user,
    pageTitle: 'Register',
    pageScript: '/js/auth.js',
    pageCSS: '/css/auth.css'
  });
};

exports.showLogin = (req, res) => {
  // Redirect if already authenticated
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  
  res.render('login', { 
    user: req.user,
    pageTitle: 'Login',
    pageScript: '/js/auth.js',
    pageCSS: '/css/auth.css'
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/auth/register');
    }
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      req.flash('error', 'User with this email already exists');
      return res.redirect('/auth/register');
    }
    
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name }
    });
    
    // Auto login after register
    req.login({ id: user.id, email: user.email, name: user.name }, function (err) {
      if (err) {
        console.error('Auto login error:', err);
        req.flash('error', 'Registration successful, please login');
        return res.redirect('/auth/login');
      }
      req.flash('success', 'Welcome to Drive App!');
      return res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Server error during registration');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error('Logout error', err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      req.flash('success', 'You have been logged out');
      res.redirect('/auth/login');
    });
  });
};