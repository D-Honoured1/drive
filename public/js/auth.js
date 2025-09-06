/**
 * Authentication page JavaScript
 * Handles login/register form validation and UX
 */

document.addEventListener("DOMContentLoaded", () => {
  // Password toggle functionality
  const togglePassword = document.getElementById("togglePassword")
  const passwordInput = document.getElementById("password")

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      // Update icon
      const eyeIcon = togglePassword.querySelector(".eye-icon")
      if (type === "text") {
        eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `
      } else {
        eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `
      }
    })
  }

  // Auto-hide flash messages after 5 seconds
  const flashMessages = document.querySelectorAll(".alert")
  flashMessages.forEach((message) => {
    setTimeout(() => {
      message.style.opacity = "0"
      setTimeout(() => {
        message.remove()
      }, 300)
    }, 5000)
  })

  // Login form handling
  const loginForm = document.querySelector('form[action="/auth/login"]')
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      const email = document.getElementById("email")
      const password = document.getElementById("password")
      const submitButton = loginForm.querySelector('button[type="submit"]')

      // Clear previous error styling
      clearFieldErrors([email, password])

      // Validate fields
      let hasErrors = false

      if (!email.value.trim()) {
        showFieldError(email, "Email is required")
        hasErrors = true
      } else if (!isValidEmail(email.value)) {
        showFieldError(email, "Please enter a valid email")
        hasErrors = true
      }

      if (!password.value) {
        showFieldError(password, "Password is required")
        hasErrors = true
      }

      if (hasErrors) {
        e.preventDefault()
        return false
      }

      showLoadingState(submitButton, "Signing In...")
    })
  }

  // Register form handling
  const registerForm = document.querySelector('form[action="/auth/register"]')
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      const email = document.getElementById("email")
      const password = document.getElementById("password")
      const confirmPassword = document.getElementById("confirmPassword")
      const submitButton = registerForm.querySelector('button[type="submit"]')

      clearFieldErrors([email, password, confirmPassword])

      let hasErrors = false

      if (!email.value.trim()) {
        showFieldError(email, "Email is required")
        hasErrors = true
      } else if (!isValidEmail(email.value)) {
        showFieldError(email, "Please enter a valid email")
        hasErrors = true
      }

      if (!password.value) {
        showFieldError(password, "Password is required")
        hasErrors = true
      } else if (password.value.length < 8) {
        showFieldError(password, "Password must be at least 8 characters")
        hasErrors = true
      } else if (!isStrongPassword(password.value)) {
        showFieldError(password, "Password must contain uppercase, lowercase, number, and special character")
        hasErrors = true
      }

      if (confirmPassword && confirmPassword.value !== password.value) {
        showFieldError(confirmPassword, "Passwords do not match")
        hasErrors = true
      }

      if (hasErrors) {
        e.preventDefault()
        return false
      }

      showLoadingState(submitButton, "Creating Account...")
    })
  }

  const passwordField = document.getElementById("password")
  if (passwordField && registerForm) {
    passwordField.addEventListener("input", function () {
      showPasswordStrength(this.value)
    })
  }
})

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isStrongPassword(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  return strongRegex.test(password) && password.length >= 8
}

function showFieldError(field, message) {
  field.classList.add("error")

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".error-message")
  if (existingError) {
    existingError.remove()
  }

  // Add new error message
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message show"
  errorDiv.textContent = message
  field.parentNode.appendChild(errorDiv)
}

function clearFieldErrors(fields) {
  fields.forEach((field) => {
    if (field) {
      field.classList.remove("error")
      const errorMessage = field.parentNode.querySelector(".error-message")
      if (errorMessage) {
        errorMessage.remove()
      }
    }
  })
}

function showLoadingState(button, text) {
  const btnText = button.querySelector(".btn-text")
  const btnSpinner = button.querySelector(".btn-spinner")

  if (btnText && btnSpinner) {
    btnText.style.display = "none"
    btnSpinner.style.display = "block"
    button.disabled = true
  } else {
    // Fallback for buttons without spinner elements
    button.disabled = true
    button.textContent = text
  }
}

function showPasswordStrength(password) {
  const existingIndicator = document.querySelector(".password-strength")
  if (existingIndicator) {
    existingIndicator.remove()
  }

  if (!password) return

  const passwordField = document.getElementById("password")
  const strength = calculatePasswordStrength(password)

  const indicator = document.createElement("div")
  indicator.className = "password-strength"
  indicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill strength-${strength.level}" style="width: ${strength.percentage}%"></div>
        </div>
        <span class="strength-text">${strength.text}</span>
    `

  passwordField.parentNode.appendChild(indicator)
}

function calculatePasswordStrength(password) {
  let score = 0
  const feedback = []

  if (password.length >= 8) score += 25
  else feedback.push("at least 8 characters")

  if (/[a-z]/.test(password)) score += 25
  else feedback.push("lowercase letter")

  if (/[A-Z]/.test(password)) score += 25
  else feedback.push("uppercase letter")

  if (/\d/.test(password)) score += 25
  else feedback.push("number")

  if (/[@$!%*?&]/.test(password)) score += 25
  else feedback.push("special character")

  let level, text
  if (score < 50) {
    level = "weak"
    text = "Weak - Add: " + feedback.slice(0, 2).join(", ")
  } else if (score < 75) {
    level = "medium"
    text = "Medium - Add: " + feedback.join(", ")
  } else if (score < 100) {
    level = "good"
    text = "Good - Add: " + feedback.join(", ")
  } else {
    level = "strong"
    text = "Strong password"
  }

  return { level, text, percentage: Math.min(score, 100) }
}
