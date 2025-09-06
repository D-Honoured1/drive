const express = require("express")
const passport = require("passport")
const authController = require("../controllers/authController")

const router = express.Router()

// GET routes for login/register pages
router.get("/login", authController.showLogin)
router.get("/register", authController.showRegister)

// POST route for login with passport authentication
router.post("/login", (req, res, next) => {
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
router.post("/register", authController.register)

// POST route for logout
router.post("/logout", authController.logout)

module.exports = router
