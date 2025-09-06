// Dashboard-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add folder creation, deletion confirmations, etc.
    const deleteForms = document.querySelectorAll('form[data-action="delete-folder"]');
    deleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const folderName = this.dataset.folderName;
            if (!confirm(`Are you sure you want to delete the folder "${folderName}" and all its files?`)) {
                e.preventDefault();
            }
        });
    });
});