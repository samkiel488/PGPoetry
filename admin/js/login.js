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
    // Clear all tokens on page load to enforce clean login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');

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
                // Store tokens in localStorage
                if (data && data.accessToken) {
                    // Clear client user tokens to avoid confusion
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    localStorage.removeItem('refreshToken');

                    localStorage.setItem('adminToken', data.accessToken);
                    localStorage.setItem('adminRefreshToken', data.refreshToken || '');
                    localStorage.setItem('adminUser', JSON.stringify(data.user || {}));

                    // Show success message
                    iziToast.success({
                        title: 'Success',
                        message: 'Login successful! Redirecting...',
                        position: 'topRight',
                        timeout: 2000
                    });

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard.html';
                    }, 1000);
                } else {
                    showError('Login successful but no token received. Please try again.');
                }
            } else {
                // Handle specific error cases
                let errorMessage = 'Login failed';
                if (data && data.message) {
                    errorMessage = data.message;
                } else if (response.status === 400) {
                    errorMessage = 'Missing username or password';
                } else if (response.status === 401) {
                    errorMessage = 'Invalid username or password';
                } else if (response.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorMessage = `Login failed (${response.status})`;
                }
                showError(errorMessage);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        }
    });

    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = '/admin/dashboard.html';
    }
});
