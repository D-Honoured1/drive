/**
 * Global JavaScript - Loaded on all pages
 * Keep this minimal - only truly global functionality
 */

// Flash message auto-dismiss
document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss flash messages after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            alert.style.opacity = '0';
            setTimeout(function() {
                alert.remove();
            }, 300);
        }, 5000);
    });
});

// Global utility functions
window.DriveApp = {
    // Show loading state
    showLoading: function(button, text = 'Loading...') {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = text;
    },
    
    // Hide loading state
    hideLoading: function(button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    },
    
    // Show confirmation dialog
    confirm: function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }
};