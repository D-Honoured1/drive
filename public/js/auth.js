/**
 * Authentication page JavaScript
 * Handles login/register form validation and UX
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Login form handling
    const loginForm = document.querySelector('form[action="/auth/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            
            // Clear previous error styling
            clearFieldErrors([email, password]);
            
            // Validate fields
            let hasErrors = false;
            
            if (!email.value.trim()) {
                showFieldError(email, 'Email is required');
                hasErrors = true;
            } else if (!isValidEmail(email.value)) {
                showFieldError(email, 'Please enter a valid email');
                hasErrors = true;
            }
            
            if (!password.value) {
                showFieldError(password, 'Password is required');
                hasErrors = true;
            }
            
            if (hasErrors) {
                e.preventDefault();
                return false;
            }
            
            // Show loading state
            DriveApp.showLoading(submitButton, 'Signing In...');
        });
    }
    
    // Register form handling
    const registerForm = document.querySelector('form[action="/auth/register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            const submitButton = registerForm.querySelector('button[type="submit"]');
            
            clearFieldErrors([email, password, confirmPassword]);
            
            let hasErrors = false;
            
            if (!email.value.trim()) {
                showFieldError(email, 'Email is required');
                hasErrors = true;
            } else if (!isValidEmail(email.value)) {
                showFieldError(email, 'Please enter a valid email');
                hasErrors = true;
            }
            
            if (!password.value) {
                showFieldError(password, 'Password is required');
                hasErrors = true;
            } else if (password.value.length < 6) {
                showFieldError(password, 'Password must be at least 6 characters');
                hasErrors = true;
            }
            
            if (confirmPassword && confirmPassword.value !== password.value) {
                showFieldError(confirmPassword, 'Passwords do not match');
                hasErrors = true;
            }
            
            if (hasErrors) {
                e.preventDefault();
                return false;
            }
            
            DriveApp.showLoading(submitButton, 'Creating Account...');
        });
    }
});

// Helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldErrors(fields) {
    fields.forEach(function(field) {
        if (field) {
            field.classList.remove('error');
            const errorMessage = field.parentNode.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
    });
}