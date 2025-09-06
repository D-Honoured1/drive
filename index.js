require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const morgan = require('morgan');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

// Add these routes AFTER your middleware setup but BEFORE your main routes

// DEBUG: Add these routes to your index.js after the middleware section:

app.get('/debug/auth', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null,
    sessionID: req.sessionID,
    sessionData: req.session
  });
});

app.get('/debug/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    res.json({ users, count: users.length });
  } catch (error) {
    res.json({ error: error.message });
  }
});

const prisma = require('./db/prismaClient');
const setupPassport = require('./auth/passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_me_in_prod';

// Setup EJS + layouts + static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

// Logging + body parsing
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store using Prisma
const store = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000,
  dbRecordIdIsSessionId: false
});

// Setup express-session
app.use(
  session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

// CRITICAL: Initialize passport BEFORE flash messages
setupPassport(passport, prisma);
app.use(passport.initialize());
app.use(passport.session());

// Flash messages AFTER passport
app.use(flash());

// Make flash messages and user available in all views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.title = 'Drive App';
  res.locals.user = req.user || null;
  next();
});

// Routes
app.get('/', (req, res) => {
  // Redirect authenticated users to dashboard
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// Auth routes
app.use('/auth', require('./routes/auth'));

// Protected routes
app.use('/', require('./routes/folders'));
app.use('/', require('./routes/files'));
app.use('/', require('./routes/share'));

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on 0.0.0.0:${PORT} (PORT=${PORT})`);
});