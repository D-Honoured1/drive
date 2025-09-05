/**
 * Authentication controllers (register, login page, logout)
 */

const prisma = require('../db/prismaClient');
const bcrypt = require('bcrypt');

exports.showRegister = (req, res) => {
  res.render('register', { user: req.user });
};

exports.showLogin = (req, res) => {
  res.render('login', { user: req.user });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).send('Email and password required.');
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).send('User already exists.');
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name }
    });
    // auto login after register - using req.login from passport
    req.login({ id: user.id, email: user.email }, function (err) {
      if (err) {
        console.error('Auto login error:', err);
        return res.redirect('/auth/login');
      }
      return res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Server error during registration.');
  }
};

exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error('Logout error', err);
    }
    // destroy session cookie
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  });
};
