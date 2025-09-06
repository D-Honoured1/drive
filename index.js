require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const morgan = require('morgan');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const prisma = require('./db/prismaClient');
const setupPassport = require('./auth/passport');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_me_in_prod';

// --- Views + static ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

// --- Logging + parsers ---
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Session store + session ---
const store = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000,
  dbRecordIdIsSessionId: false
});

app.use(
  session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

// --- Passport ---
setupPassport(passport, prisma);
app.use(passport.initialize());
app.use(passport.session());

// --- Flash ---
app.use(flash());

// --- Globals ---
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.title = 'Drive App';
  res.locals.user = req.user || null;
  next();
});

// --- Debug routes ---
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

// --- Main routes ---
app.get('/', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/folders'));
app.use('/', require('./routes/files'));
app.use('/', require('./routes/share'));

app.get('/health', (req, res) => res.json({ ok: true }));

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

// --- Start server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on 0.0.0.0:${PORT} (PORT=${PORT})`);
});
