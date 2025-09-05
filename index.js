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

const prisma = require('./db/prismaClient');
const setupPassport = require('./auth/passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_me_in_prod';

// Setup EJS, static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Logging + body parsing
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store using Prisma
const store = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, // prune expired sessions every 2 minutes
  dbRecordIdIsSessionId: false,
  // Optionally set a custom model name if your schema differs
  // sessionModel: 'Session'
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
      secure: process.env.NODE_ENV === 'production', // set to true in prod with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

// Initialize passport
setupPassport(passport, prisma);
app.use(passport.initialize());
app.use(passport.session());

// Basic routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// Route mounting
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/folders')); // dashboard and folder routes
app.use('/', require('./routes/files'));
app.use('/', require('./routes/share'));

// Simple healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT} (PORT=${PORT})`);
});
