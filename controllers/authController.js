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

    // 🔹 FIX: use req.logIn (not req.login) so Passport attaches session
    req.logIn(user, (err) => {
      if (err) {
        console.error("Auto-login failed after register:", err) // <-- added log
        req.flash("success", "Registration successful, please login")
        return res.redirect("/auth/login")
      }

      req.flash("success", "Welcome to Drive App!")
      return res.redirect("/dashboard") // ✅ always go to dashboard after register
    })
  } catch (err) {
    console.error("Register error:", err) // <-- added log
    req.flash("error", "Registration failed. Please try again.")
    res.redirect("/auth/register")
  }
}
