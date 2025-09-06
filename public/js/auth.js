// public/js/auth.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form[action="/auth/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert('Please fill in both email and password');
                e.preventDefault();
                return false;
            }
            
            const button = document.querySelector('button[type="submit"]');
            button.textContent = 'Signing In...';
            button.disabled = true;
        });
    }
});