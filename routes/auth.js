const express = require("express")
const passport = require("passport")
const authController = require("../controllers/authController")
const { body, validationResult } = require("express-validator")

const router = express.Router()

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
]

const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
]

// GET routes for login/register pages
router.get("/login", authController.showLogin)
router.get("/register", authController.showRegister)

// POST route for login with passport authentication
router.post("/login", loginValidation, (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg)
    return res.redirect("/auth/login")
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login authentication error:", err)
      req.flash("error", "Server error during login")
      return res.redirect("/auth/login")
    }

    if (!user) {
      // Authentication failed - provide user feedback
      req.flash("error", info?.message || "Invalid email or password")
      return res.redirect("/auth/login")
    }

    // Authentication successful - log user in
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login session error:", err)
        req.flash("error", "Login failed, please try again")
        return res.redirect("/auth/login")
      }

      req.flash("success", "Welcome back!")
      return res.redirect("/dashboard")
    })
  })(req, res, next)
})

// POST route for registration
router.post("/register", registerValidation, authController.register)

// POST route for logout
router.post("/logout", authController.logout)

module.exports = router
