// API base URL
const API_BASE = '/api';

// Global variables
let currentPoemId = null;
let poems = [];

// Console logging utility
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    switch(type) {
        case 'error':
            console.error(logMessage);
            break;
        case 'warn':
            console.warn(logMessage);
            break;
        case 'success':
            console.log(`%c${logMessage}`, 'color: green; font-weight: bold;');
            break;
        default:
            console.log(logMessage);
    }
}

// Enhanced error handling for fetch requests
async function fetchWithErrorHandling(url, options = {}) {
    try {
        log(`Making ${options.method || 'GET'} request to: ${url}`, 'info');

        const response = await fetch(url, options);

        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
            log('Received 401 Unauthorized from server', 'warn');
            localStorage.removeItem('adminToken');
            showNotification('Session expired. Redirecting to login...', 'warning');
            setTimeout(() => { window.location.href = '/admin'; }, 1200);
            throw new Error(`HTTP 401: Unauthorized`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            log(`HTTP ${response.status}: ${errorText}`, 'error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        log(`Request successful: ${url}`, 'success');
        return data;
    } catch (error) {
        log(`Request failed: ${url} - ${error.message}`, 'error');
        throw error;
    }
}

// Enhanced notification system
function showNotification(message, type = 'info', title = '') {
    log(`Showing notification: ${type} - ${title} - ${message}`, 'info');
    
    const config = {
        title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'),
        message: message,
        position: 'topRight',
        timeout: type === 'error' ? 8000 : 5000,
        closeOnClick: true,
        pauseOnHover: true
    };

    try {
        switch(type) {
            case 'success':
                iziToast.success(config);
                break;
            case 'error':
                iziToast.error(config);
                break;
            case 'warning':
                iziToast.warning(config);
                break;
            default:
                iziToast.info(config);
        }
    } catch (error) {
        log(`Notification system error: ${error.message}`, 'error');
        // Fallback to alert if iziToast is not available
        alert(`${config.title}: ${config.message}`);
    }
}

// Get DOM elements
const poemsList = document.getElementById('poems-list');
const newPoemBtn = document.getElementById('new-poem-btn');
const logoutBtn = document.getElementById('logout-btn');
const poemModal = document.getElementById('poem-modal');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const poemForm = document.getElementById('poem-form');
const modalTitle = document.getElementById('modal-title');
const themeToggle = document.getElementById('theme-toggle');

// Check authentication
function checkAuth() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            log('No authentication token found, redirecting to login', 'warn');
            window.location.href = '/admin';
            return false;
        }
        log('Authentication token found', 'success');
        return token;
    } catch (error) {
        log(`Authentication check failed: ${error.message}`, 'error');
        return false;
    }
}

// Get auth headers
function getAuthHeaders() {
    const token = checkAuth();
    if (!token) {
        throw new Error('Not authenticated');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        log(`Date formatting error: ${error.message}`, 'error');
        return 'Invalid Date';
    }
}

// Show admin loading spinner
function showAdminLoading(show = true) {
    const el = document.getElementById('admin-loading');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
}

// Load poems
async function loadPoems() {
    try {
        log('Loading poems from API...', 'info');
        showAdminLoading(true);
        const poems = await fetchWithErrorHandling(`${API_BASE}/poems`);
        window.poems = poems; // Store globally for access
        renderPoems();
        log(`Successfully loaded ${poems.length} poems`, 'success');
    } catch (error) {
        log(`Failed to load poems: ${error.message}`, 'error');
        poemsList.innerHTML = '<p style="color: #e74c3c;">Error loading poems</p>';
        showNotification('Failed to load poems. Please try again.', 'error');
    } finally {
        showAdminLoading(false);
    }
}

// Render poems
function renderPoems() {
    try {
        log('Rendering poems...', 'info');
        
        if (!window.poems || window.poems.length === 0) {
            poemsList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No poems found. Create your first poem!</p>';
            log('No poems to render', 'info');
            return;
        }
        
        poemsList.innerHTML = window.poems.map(poem => `
            <div class="poem-item">
                <h3>${poem.title}</h3>
                <p>${poem.content.substring(0, 100)}...</p>
                <div class="poem-meta">
                    <span>${formatDate(poem.createdAt)}</span>
                    <div class="poem-actions">
                        <button class="btn btn-edit" type="button" data-id="${poem._id}">Edit</button>
                        <button class="btn btn-danger" type="button" data-id="${poem._id}">Delete</button>
                        <button class="btn btn-secondary" type="button" data-slug="${poem.slug}">Copy Link</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach event listeners after rendering
        attachPoemEventListeners();
        log(`Rendered ${window.poems.length} poems successfully`, 'success');
    } catch (error) {
        log(`Error rendering poems: ${error.message}`, 'error');
        poemsList.innerHTML = '<p style="color: #e74c3c;">Error rendering poems</p>';
    }
}

// Attach event listeners to poem actions
function attachPoemEventListeners() {
    try {
        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const poemId = btn.getAttribute('data-id');
                log(`Edit button clicked for poem: ${poemId}`, 'info');
                editPoem(poemId);
            };
        });

        // Delete buttons
        document.querySelectorAll('.btn-danger').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const poemId = btn.getAttribute('data-id');
                log(`Delete button clicked for poem: ${poemId}`, 'info');
                deletePoem(poemId);
            };
        });

        // Copy link buttons - only those inside .poem-actions and that have data-slug
        document.querySelectorAll('.poem-actions .btn-secondary[data-slug]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const slug = btn.getAttribute('data-slug');
                log(`Copy link button clicked for poem: ${slug}`, 'info');
                copyPoemLink(slug);
            };
        });

        log('Poem event listeners attached successfully', 'success');
    } catch (error) {
        log(`Error attaching poem event listeners: ${error.message}`, 'error');
    }
}

// Copy poem link to clipboard
function copyPoemLink(slug) {
    try {
        if (!slug) {
            log('No slug provided for copyPoemLink', 'warn');
            showNotification('No link available to copy', 'warning');
            return;
        }

        const url = `${window.location.origin}/poems/${slug}`;
        log(`Copying poem link: ${url}`, 'info');

        navigator.clipboard.writeText(url).then(() => {
            log('Poem link copied to clipboard successfully', 'success');
            showNotification('Poem link copied to clipboard!', 'success');
        }, (error) => {
            log(`Failed to copy link: ${error.message}`, 'error');
            showNotification('Failed to copy link', 'error');
        });
    } catch (error) {
        log(`Copy link error: ${error.message}`, 'error');
        showNotification('Failed to copy link', 'error');
    }
}

// Open modal for new poem
function openNewPoemModal() {
    try {
        log('Opening new poem modal', 'info');
        currentPoemId = null;
        modalTitle.textContent = 'New Poem';
        poemForm.reset();
        poemModal.style.display = 'flex';
        log('New poem modal opened successfully', 'success');
    } catch (error) {
        log(`Error opening new poem modal: ${error.message}`, 'error');
    }
}

// Open modal for editing poem
async function editPoem(poemId) {
    try {
        log(`Loading poem for editing: ${poemId}`, 'info');
        const poem = await fetchWithErrorHandling(`${API_BASE}/poems/id/${poemId}`, {
            headers: getAuthHeaders()
        });
        
        currentPoemId = poemId;
        modalTitle.textContent = 'Edit Poem';
        document.getElementById('poem-title').value = poem.title;
        document.getElementById('poem-content').value = poem.content;
        document.getElementById('poem-tags').value = poem.tags.join(', ');
        document.getElementById('poem-featured').checked = poem.featured;
        poemModal.style.display = 'flex';
        
        log(`Poem loaded for editing: ${poem.title}`, 'success');
    } catch (error) {
        log(`Error loading poem for editing: ${error.message}`, 'error');
        showNotification('Could not load poem for editing', 'error');
    }
}

// Close modal
function closePoemModal() {
    try {
        log('Closing poem modal', 'info');
        poemModal.style.display = 'none';
        currentPoemId = null;
        poemForm.reset();
        log('Poem modal closed successfully', 'success');
    } catch (error) {
        log(`Error closing poem modal: ${error.message}`, 'error');
    }
}

// Preview mode for poem before submit
function setupPreviewButton() {
    try {
        const previewBtn = document.getElementById('preview-btn');
        const previewModal = document.getElementById('preview-modal');
        const previewContent = document.getElementById('preview-content');
        
        if (previewBtn && previewModal && previewContent) {
            previewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                log('Preview button clicked', 'info');
                
                const formData = new FormData(poemForm);
                const title = formData.get('title');
                const content = formData.get('content');
                const tags = formData.get('tags');
                
                previewContent.innerHTML = `<h2>${title}</h2><div>${content}</div><div>${tags}</div>`;
                previewModal.classList.add('open');
                 log('Preview modal opened', 'success');
             });
             
            document.getElementById('close-preview').onclick = function() {
                previewModal.classList.remove('open');
                 log('Preview modal closed', 'info');
             };
            // Close when clicking outside modal-content
            previewModal.addEventListener('click', function(e){
                if (e.target === previewModal) {
                    previewModal.classList.remove('open');
                    log('Preview modal closed by outside click', 'info');
                }
            });
            // Close on Esc
            document.addEventListener('keydown', function(e){
                if (e.key === 'Escape' && previewModal.classList.contains('open')) {
                    previewModal.classList.remove('open');
                }
            });
             
             log('Preview button setup completed', 'success');
        }
    } catch (error) {
        log(`Error setting up preview button: ${error.message}`, 'error');
    }
}

// Form submission handler
poemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        log('Poem form submitted', 'info');
        const formData = new FormData(poemForm);
        const poemData = {
            title: formData.get('title'),
            content: formData.get('content'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            featured: formData.get('featured') === 'on'
        };

        log(`Poem data prepared: ${poemData.title}`, 'info');

        const url = currentPoemId 
            ? `${API_BASE}/poems/${currentPoemId}`
            : `${API_BASE}/poems`;
        const method = currentPoemId ? 'PUT' : 'POST';

        await fetchWithErrorHandling(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(poemData)
        });

        closePoemModal();
        loadPoems();

        const message = currentPoemId ? 'Poem updated successfully!' : 'Poem created successfully!';
        log(message, 'success');
        showNotification(message, 'success');

    } catch (error) {
        log(`Error saving poem: ${error.message}`, 'error');
        // Show server-provided message when available
        const msg = error.message || 'Network error. Please try again.';
        showNotification(msg, 'error');
    }
});

// Delete poem
async function deletePoem(poemId) {
    try {
        if (!confirm('Are you sure you want to delete this poem?')) {
            log('Poem deletion cancelled by user', 'info');
            return;
        }

        log(`Deleting poem: ${poemId}`, 'info');
        const res = await fetch(`${API_BASE}/poems/${poemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            // handled by getAuthHeaders or earlier, but double-check
            localStorage.removeItem('adminToken');
            showNotification('Session expired. Redirecting to login...', 'warning');
            setTimeout(() => { window.location.href = '/admin'; }, 1200);
            return;
        }

        if (!res.ok) {
            const text = await res.text();
            log(`Server returned error deleting poem: ${res.status} - ${text}`, 'error');
            showNotification(`Failed to delete poem: ${res.status} - ${text}`, 'error');
            return;
        }

        await loadPoems();
        log('Poem deleted successfully', 'success');
        showNotification('Poem deleted successfully!', 'success');

    } catch (error) {
        log(`Error deleting poem: ${error.message}`, 'error');
        showNotification(`Error deleting poem: ${error.message}`, 'error');
    }
}

// Logout
function logout() {
    try {
        log('User logging out', 'info');
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
        log('User redirected to login page', 'success');
    } catch (error) {
        log(`Error during logout: ${error.message}`, 'error');
    }
}

// Theme toggle functionality
function setupThemeToggle() {
    try {
        log('Setting up theme toggle', 'info');
        
        function setTheme(dark) {
            try {
                if (dark) {
                    document.body.classList.add('dark-theme');
                    localStorage.setItem('theme', 'dark');
                    document.getElementById('theme-icon').textContent = '☀️';
                    log('Dark theme applied', 'success');
                } else {
                    document.body.classList.remove('dark-theme');
                    localStorage.setItem('theme', 'light');
                    document.getElementById('theme-icon').textContent = '🌙';
                    log('Light theme applied', 'success');
                }
            } catch (error) {
                log(`Error setting theme: ${error.message}`, 'error');
            }
        }
        
        function initTheme() {
            try {
                const theme = localStorage.getItem('theme');
                setTheme(theme === 'dark');
                log(`Theme initialized: ${theme || 'light'}`, 'success');
            } catch (error) {
                log(`Error initializing theme: ${error.message}`, 'error');
            }
        }
        
        // Initialize theme
        initTheme();
        
        // Add click event listener
        if (themeToggle) {
            themeToggle.onclick = function() {
                log('Theme toggle clicked', 'info');
                setTheme(!document.body.classList.contains('dark-theme'));
            };
            log('Theme toggle event listener attached', 'success');
        } else {
            log('Theme toggle element not found', 'error');
        }
        
    } catch (error) {
        log(`Error setting up theme toggle: ${error.message}`, 'error');
    }
}

// Event listeners
function setupEventListeners() {
    try {
        log('Setting up event listeners', 'info');
        
        if (newPoemBtn) {
            newPoemBtn.addEventListener('click', openNewPoemModal);
            log('New poem button listener attached', 'success');
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', closePoemModal);
            log('Close modal button listener attached', 'success');
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closePoemModal);
            log('Cancel button listener attached', 'success');
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
            log('Logout button listener attached', 'success');
        }
        
        // Close modal when clicking outside
        if (poemModal) {
            poemModal.addEventListener('click', (e) => {
                if (e.target === poemModal) {
                    closePoemModal();
                }
            });
            log('Modal outside click listener attached', 'success');
        }
        
        log('All event listeners setup completed', 'success');
    } catch (error) {
        log(`Error setting up event listeners: ${error.message}`, 'error');
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    try {
        log('Dashboard initialization started', 'info');
        
        if (!checkAuth()) {
            log('Authentication failed, stopping initialization', 'error');
            return;
        }
        
        // Setup all components
        setupEventListeners();
        setupThemeToggle();
        setupPreviewButton();
        loadPoems();
        
        log('Dashboard initialization completed successfully', 'success');
        
    } catch (error) {
        log(`Dashboard initialization failed: ${error.message}`, 'error');
        showNotification('Failed to initialize dashboard', 'error');
    }
});