// API base URL
const API_BASE = '/api';

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);
}

initTheme();

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
    });
}

// Sync across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'theme') applyTheme(e.newValue || 'light');
});

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

// Utility function to format date
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

// Utility function to truncate text
function truncateText(text, maxLength = 150) {
    try {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    } catch (error) {
        log(`Text truncation error: ${error.message}`, 'error');
        return text || '';
    }
}

// Create poem card HTML
function createPoemCard(poem) {
    try {
        log(`Creating poem card for: ${poem.title}`, 'info');
        
        const excerpt = truncateText(poem.content);
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        const likes = poem.likes || 0;
        const views = poem.views || 0;
        
        const cardHTML = `
            <div class="poem-card" data-poem-slug="${poem.slug}">
                <h3 class="poem-title">${poem.title}</h3>
                <p class="poem-excerpt">${excerpt}</p>
                <div class="poem-meta">
                    <span class="poem-date">${formatDate(poem.createdAt)}</span>
                    <div class="poem-tags">${tags}</div>
                </div>
                <div class="poem-stats">
                    <span class="poem-likes">❤️ ${likes} likes</span>
                    <span class="poem-views">👁️ ${views} views</span>
                </div>
            </div>
        `;
        
        log(`Poem card created successfully for: ${poem.title}`, 'success');
        return cardHTML;
    } catch (error) {
        log(`Error creating poem card: ${error.message}`, 'error');
        return `<div class="poem-card"><p>Error loading poem</p></div>`;
    }
}

// Load featured poems
async function loadFeaturedPoems() {
    try {
        log('Loading featured poems...', 'info');
        
        const poems = await fetchWithErrorHandling(`${API_BASE}/poems`);
        
        // Get featured poems (first 3)
        const featuredPoems = poems.filter(poem => poem.featured).slice(0, 3);
        
        log(`Found ${featuredPoems.length} featured poems`, 'success');
        
        const container = document.getElementById('featured-poems');
        
        if (!container) {
            log('Featured poems container not found', 'error');
            return;
        }
        
        if (featuredPoems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No featured poems available, Explore other poems.</p>';
            log('No featured poems to display', 'info');
            return;
        }
        
        container.innerHTML = featuredPoems.map(poem => createPoemCard(poem)).join('');
        log('Featured poems loaded and displayed successfully', 'success');
        
    } catch (error) {
        log(`Error loading featured poems: ${error.message}`, 'error');
        const container = document.getElementById('featured-poems');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading poems.</p>';
        }
        showNotification('Error loading poems. Please try again later.', 'error');
    }
}

// Setup poem card click events
function setupPoemCardEvents() {
    try {
        log('Setting up poem card events', 'info');
        
        // Add click event listeners to poem cards
        document.addEventListener('click', function(e) {
            const poemCard = e.target.closest('.poem-card');
            if (poemCard) {
                const slug = poemCard.getAttribute('data-poem-slug');
                if (slug) {
                    log(`Navigating to poem: ${slug}`, 'info');
                    window.location.href = `/poem/${slug}`;
                }
            }
        });
        
        log('Poem card events setup completed', 'success');
    } catch (error) {
        log(`Error setting up poem card events: ${error.message}`, 'error');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    try {
        log('App initialization started', 'info');
        
        loadFeaturedPoems();
        setupPoemCardEvents();
        
        // Set copyright year
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
            log('Copyright year updated', 'success');
        } else {
            log('Copyright year element not found', 'warn');
        }
        
        log('App initialization completed successfully', 'success');
        
    } catch (error) {
        log(`App initialization failed: ${error.message}`, 'error');
        showNotification('Failed to initialize application', 'error');
    }
});