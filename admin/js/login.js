// API base URL
const API_BASE = '/api';

// Get DOM elements
const errorMessage = document.getElementById('error-message');

// Show error message
function showError(message) {
    iziToast.error({
        title: 'Error',
        message: message,
        position: 'topRight'
    });
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements after DOM is ready
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.warn('Login form not found on page');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            let data = {};
            try { data = await response.json(); } catch (err) { /* ignore JSON parse errors */ }

            if (response.ok) {
                // Store token in localStorage
                if (data && data.token) localStorage.setItem('adminToken', data.token);

                // Redirect to dashboard (explicit .html to avoid server routing mismatch)
                window.location.href = '/admin/dashboard.html';
            } else {
                showError((data && data.message) || `Login failed (${response.status})`);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        }
    });

    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = '/admin/dashboard.html';
    }
});