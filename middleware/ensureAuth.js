/**
 * ensureAuth middleware - protects routes.
 * If user is authenticated (req.isAuthenticated), calls next().
 * Otherwise redirects to login page (or returns 401 for API calls).
 */

const ensureAuth = require("./middleware/ensureAuth")

app.get("/dashboard", ensureAuth, (req, res) => {
  res.render("dashboard", {
    user: req.user,
    title: "Dashboard",
  })
})



function ensureAuth(req, res, next) {
  console.log("\n🛡️  ENSURE AUTH CHECK")
  console.log("Path:", req.path)
  console.log("isAuthenticated available?", typeof req.isAuthenticated === "function")
  console.log("isAuthenticated result:", req.isAuthenticated ? req.isAuthenticated() : "N/A")
  console.log("User object:", req.user ? `${req.user.email} (${req.user.id})` : "None")
  console.log("Session ID:", req.sessionID)

  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("✅ Auth check passed, proceeding...")
    return next()
  }

  console.log("❌ Auth check failed, redirecting to login")

  // If request wants JSON, return 401 JSON
  if (req.accepts("json") && !req.accepts("html")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  return res.redirect("/auth/login")
}

module.exports = ensureAuth
