require("dotenv").config()
const express = require("express")
const session = require("express-session")
const path = require("path")
const passport = require("passport")
const morgan = require("morgan")
const flash = require("connect-flash")
const expressLayouts = require("express-ejs-layouts")
const { PrismaSessionStore } = require("@quixo3/prisma-session-store")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const cors = require("cors")

const prisma = require("./db/prismaClient")
const setupPassport = require("./auth/passport")

const app = express()

// Tell Express it's running behind a proxy (Railway/Supabase/Heroku, etc.)
app.set("trust proxy", 1)

const PORT = process.env.PORT || 3000
const SESSION_SECRET = process.env.SESSION_SECRET || "replace_me_in_prod"

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)
app.use("/auth/login", authLimiter)
app.use("/auth/register", authLimiter)

// Compression
app.use(compression())

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? true // Replace with your actual domain
        : ["http://localhost:3000"],
    credentials: true,
  }),
)

// --- Views + static ---
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.set("layout", "layout")
app.use(expressLayouts)
app.use(express.static(path.join(__dirname, "public")))

// --- Logging + parsers ---
app.use(morgan("dev"))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.json({ limit: "10mb" }))

// --- Session store + session ---
const store = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000,
  dbRecordIdIsSessionId: false,
})

app.use(
  session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "lax",
},

  }),
)

// --- Passport ---
setupPassport(passport, prisma)
app.use(passport.initialize())
app.use(passport.session())

// --- Flash ---
app.use(flash())

// --- Globals ---
app.use((req, res, next) => {
  res.locals.error = req.flash("error")
  res.locals.success = req.flash("success")
  res.locals.title = "Drive App"
  res.locals.user = req.user || null
  // Set default template variables to prevent undefined errors
  res.locals.pageCSS = res.locals.pageCSS || null
  res.locals.pageScript = res.locals.pageScript || null
  res.locals.pageScripts = res.locals.pageScripts || null
  res.locals.pageTitle = res.locals.pageTitle || "Drive App"
  next()
})

// --- Debug routes (development only) ---
if (process.env.NODE_ENV !== "production") {
  app.get("/debug/auth", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      user: req.user || null,
      sessionID: req.sessionID,
      sessionData: req.session,
    })
  })

  app.get("/debug/users", async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true },
      })
      res.json({ users, count: users.length })
    } catch (error) {
      res.json({ error: error.message })
    }
  })
}

// --- Main routes ---
app.get("/", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect("/dashboard")
  }
  res.render("index", {
    pageTitle: "Welcome"
  })
})

app.use("/auth", require("./routes/auth"))
app.use("/", require("./routes/folders"))
app.use("/", require("./routes/files"))
app.use("/", require("./routes/share"))

app.get("/health", (req, res) => res.json({ ok: true }))

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      error: "Something went wrong",
      message: "Internal server error"
    })
  } else {
    res.status(500).send(`Internal server error: ${err.message}`)
  }
})

// --- Start server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on 0.0.0.0:${PORT} (PORT=${PORT})`)
})
