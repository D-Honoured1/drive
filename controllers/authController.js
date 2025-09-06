/**
 * Authentication controllers (register, login page, logout)
 */

const prisma = require("../db/prismaClient")
const bcrypt = require("bcryptjs")

exports.showRegister = (req, res) => {
  res.render("register", {
    user: req.user,
    pageTitle: "Register",
    pageScript: "/js/auth.js",
    pageCSS: "/css/auth.css",
    error: req.flash("error"),
    success: req.flash("success"),
  })
}

exports.showLogin = (req, res) => {
  // Redirect if already authenticated
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect("/dashboard")
  }

  res.render("login", {
    user: req.user,
    pageTitle: "Login",
    pageScript: "/js/auth.js",
    pageCSS: "/css/auth.css",
    error: req.flash("error"),
    success: req.flash("success"),
  })
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      req.flash("error", "Email and password are required")
      return res.redirect("/auth/register")
    }

    if (password.length < 8) {
      req.flash("error", "Password must be at least 8 characters long")
      return res.redirect("/auth/register")
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      req.flash("error", "User with this email already exists")
      return res.redirect("/auth/register")
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    })

    // Auto login after register
    req.login({ id: user.id, email: user.email, name: user.name }, (err) => {
      if (err) {
        req.flash("error", "Registration successful, please login")
        return res.redirect("/auth/login")
      }
      req.flash("success", "Welcome to Drive App!")
      return res.redirect("/dashboard")
    })
  } catch (err) {
    req.flash("error", "Registration failed. Please try again.")
    res.redirect("/auth/register")
  }
}

exports.logout = (req, res) => {
  const successMessage = "You have been logged out"

  req.logout((err) => {
    if (err) {
      return res.redirect("/dashboard")
    }

    req.session.destroy((destroyErr) => {
      res.clearCookie("connect.sid")
      if (destroyErr) {
        return res.redirect("/auth/login")
      }
      res.redirect("/auth/login?message=logged_out")
    })
  })
}
