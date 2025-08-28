// API base URL
const API_BASE = '/api';

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

    if (typeof iziToast !== 'undefined') {
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
    } else {
        log('iziToast not loaded!', 'error');
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

// Calculate reading statistics
function calculateReadingStats(content) {
    try {
        const words = content.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 200));
        return { words, minutes };
    } catch (error) {
        log(`Reading stats calculation error: ${error.message}`, 'error');
        return { words: 0, minutes: 1 };
    }
}

// Load and display poem
async function loadPoem() {
    try {
        log('Loading poem...', 'info');
        
        // Support /poems/:slug and /poem/:slug
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const slug = pathParts[pathParts.length - 1];
        
        log(`Extracted slug: ${slug}`, 'info');
        
        const container = document.getElementById('poem-container');
        const loading = document.getElementById('loading');
        
        if (!container) {
            log('Poem container not found', 'error');
            return;
        }
        
        const poem = await fetchWithErrorHandling(`${API_BASE}/poems/${slug}`);
        
        log(`Poem loaded successfully: ${poem.title}`, 'success');
        
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        const { words, minutes } = calculateReadingStats(poem.content);
        
        const poemHTML = `
            <div class="poem-header">
                <h1>${poem.title}</h1>
                <p class="poem-date">${formatDate(poem.createdAt)}</p>
                <div class="poem-tags">${tags}</div>
                <div class="poem-actions">
                    <button class="like-btn" id="like-btn"><span class="like-count">${poem.likes || 0}</span> likes</button>
                    <button class="share-btn" id="share-btn">Share</button>
                    <button class="copy-link-btn" id="copy-link-btn" title="Copy link to this poem">Copy Link</button>
                </div>
            </div>
            <div class="poem-content">${poem.content}</div>
            <div class="poem-extra">
                <span id="poem-words">${words} words</span>
                <span id="poem-reading">${minutes} min read</span>
                <span id="poem-views">${poem.views || 0} views</span>
            </div>
        `;
        
        container.innerHTML = poemHTML;
        log('Poem HTML rendered successfully', 'success');
        
        // Setup interactive elements
        setupPoemInteractions(poem);
        
    } catch (error) {
        log(`Error loading poem: ${error.message}`, 'error');
        const container = document.getElementById('poem-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Poem not found or error loading poem.</p>';
        }
        showNotification('Poem not found or has been removed.', 'error');
    } finally {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Setup poem interactions (like, share, copy)
function setupPoemInteractions(poem) {
    try {
        log('Setting up poem interactions...', 'info');
        
        // Like button logic
        const likeBtn = document.getElementById('like-btn');
        // Track liked poems in sessionStorage
        const likedKey = `liked_${poem._id}`;
        if (likeBtn) {
            if (sessionStorage.getItem(likedKey)) {
                likeBtn.classList.add('liked');
                likeBtn.disabled = true;
            }
            likeBtn.onclick = async function(e) {
                e.preventDefault();
                log('Like button clicked', 'info');
                if (sessionStorage.getItem(likedKey)) {
                    showNotification('You have already liked this poem!', 'warning');
                    return;
                }
                likeBtn.disabled = true;
                try {
                    const data = await fetchWithErrorHandling(`${API_BASE}/poems/${poem._id}/like`, { method: 'POST' });
                    likeBtn.querySelector('.like-count').textContent = data.likes;
                    likeBtn.classList.add('liked');
                    sessionStorage.setItem(likedKey, 'true');
                    log(`Poem liked successfully. New count: ${data.likes}`, 'success');
                    showNotification('Poem liked!', 'success');
                } catch (error) {
                    log(`Error liking poem: ${error.message}`, 'error');
                    showNotification('Could not like poem. Please try again.', 'error');
                    likeBtn.disabled = false;
                }
            };
            log('Like button setup completed', 'success');
        }
        
        // Share button logic
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.onclick = function(e) {
                e.preventDefault();
                log('Share button clicked', 'info');
                
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({
                        title: poem.title,
                        text: poem.content.substring(0, 100) + '...',
                        url
                    }).then(() => {
                        log('Poem shared successfully', 'success');
                        showNotification('Poem shared!', 'success');
                    }).catch((error) => {
                        log(`Share failed: ${error.message}`, 'error');
                        showNotification('Share cancelled or failed.', 'warning');
                    });
                } else {
                    log('Share API not supported, showing fallback message', 'warn');
                    showNotification('Share not supported on this device. Use the copy link button.', 'warning');
                }
            };
            log('Share button setup completed', 'success');
        }
        
        // Copy link button logic
        const copyBtn = document.getElementById('copy-link-btn');
        if (copyBtn) {
            copyBtn.onclick = function(e) {
                e.preventDefault();
                log('Copy link button clicked', 'info');
                
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                    log('Link copied to clipboard successfully', 'success');
                    showNotification('Link copied to clipboard!', 'success');
                }, (error) => {
                    log(`Failed to copy link: ${error.message}`, 'error');
                    showNotification('Failed to copy link.', 'error');
                });
            };
            log('Copy link button setup completed', 'success');
        }
        
        log('All poem interactions setup completed', 'success');
        
    } catch (error) {
        log(`Error setting up poem interactions: ${error.message}`, 'error');
    }
}

// Setup scroll to top functionality
function setupScrollToTop() {
    try {
        const scrollBtn = document.getElementById('scroll-top-btn');
        if (scrollBtn) {
            window.addEventListener('scroll', function() {
                const shouldShow = window.scrollY > 200;
                scrollBtn.style.display = shouldShow ? 'block' : 'none';
            });
            
            scrollBtn.onclick = function() {
                log('Scroll to top button clicked', 'info');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            
            log('Scroll to top functionality setup completed', 'success');
        } else {
            log('Scroll to top button not found', 'warn');
        }
    } catch (error) {
        log(`Error setting up scroll to top: ${error.message}`, 'error');
    }
}

// Theme persistence (standardized)
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
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

window.addEventListener('storage', (e) => {
    if (e.key === 'theme') applyTheme(e.newValue || 'light');
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    try {
        log('Poem page initialization started', 'info');
        
        loadPoem();
        
        // Set copyright year
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
            log('Copyright year updated', 'success');
        } else {
            log('Copyright year element not found', 'warn');
        }
        
        // Setup scroll to top
        setupScrollToTop();
        
        log('Poem page initialization completed successfully', 'success');
        
    } catch (error) {
        log(`Poem page initialization failed: ${error.message}`, 'error');
        showNotification('Failed to initialize poem page', 'error');
    }
});