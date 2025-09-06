/**
 * Entry point: Express app
 *
 * - Sets up sessions (prisma-backed)
 * - Initializes passport
 * - Mounts routes
 * - Serves EJS views and static assets
 *
 * Important environment variables:
 *   - DATABASE_URL (Prisma)
 *   - SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   - SESSION_SECRET
 *   - SUPABASE_BUCKET
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const morgan = require('morgan');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const prisma = require('./db/prismaClient');
const setupPassport = require('./auth/passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_me_in_prod';

// Setup EJS + layouts + static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // default layout file: views/layout.ejs
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

// Logging + body parsing
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store using Prisma
const store = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, // prune expired sessions every 2 minutes
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

// Flash messages (must come AFTER session middleware)
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  next();
});

// Default locals (title, etc.)
app.use((req, res, next) => {
  res.locals.title = 'Drive App';
  res.locals.user = req.user || null; // current logged in user
  next();
});

// Initialize passport
setupPassport(passport, prisma);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.render('index'); // user available in res.locals.user
});

// Auth routes
app.use('/auth', require('./routes/auth'));

// Dashboard & other routes
app.use('/', require('./routes/folders')); // folders/dashboard
app.use('/', require('./routes/files'));
app.use('/', require('./routes/share'));

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

// ✅ Bind to 0.0.0.0 for Railway / Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on 0.0.0.0:${PORT} (PORT=${PORT})`);
});
