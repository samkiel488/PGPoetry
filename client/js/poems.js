// API base URL
const API_BASE = '/api';

// Global variables
let allPoems = [];
let filteredPoems = [];

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

// Get reading time for poem
function getReadingTime(text) {
    try {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 200));
        return { words, minutes };
    } catch (error) {
        log(`Reading time calculation error: ${error.message}`, 'error');
        return { words: 0, minutes: 1 };
    }
}

// Create poem card HTML
function createPoemCard(poem) {
    try {
        log(`Creating poem card for: ${poem.title}`, 'info');
        
        const excerpt = truncateText(poem.content);
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        const { words, minutes } = getReadingTime(poem.content);
        
        const cardHTML = `
            <div class="poem-card" onclick="window.location.href='/poem/${poem.slug}'">
                <h3 class="poem-title">${poem.title}</h3>
                <p class="poem-excerpt">${excerpt}</p>
                <div class="poem-meta">
                    <span class="poem-date">${formatDate(poem.createdAt)}</span>
                    <div class="poem-tags">${tags}</div>
                    <span class="poem-words">${words} words</span>
                    <span class="poem-reading">${minutes} min read</span>
                </div>
                <button class="like-btn" onclick="event.stopPropagation(); likePoem(event, '${poem._id}')">
                    <span class="like-icon">&#10084;</span> <span class="like-text">Like</span>
                </button>
            </div>
        `;
        
        log(`Poem card created successfully for: ${poem.title}`, 'success');
        return cardHTML;
    } catch (error) {
        log(`Error creating poem card: ${error.message}`, 'error');
        return `<div class="poem-card"><p>Error loading poem</p></div>`;
    }
}

// Like button handler
async function likePoem(event, poemId) {
    try {
        log(`Like button clicked for poem: ${poemId}`, 'info');
        
        const btn = event.currentTarget;
        btn.disabled = true;
        
        await fetchWithErrorHandling(`${API_BASE}/poems/${poemId}/like`, { method: 'POST' });
        
        btn.classList.add('liked');
        btn.querySelector('.like-text').textContent = 'Liked';
        log(`Poem liked successfully: ${poemId}`, 'success');
        showNotification('Poem liked!', 'success');
        
    } catch (error) {
        log(`Error liking poem: ${error.message}`, 'error');
        showNotification('Could not like poem. Please try again.', 'error');
    } finally {
        const btn = event.currentTarget;
        btn.disabled = false;
    }
}

// Filter poems by search term or tag
function filterPoems(searchTerm = '', tag = '') {
    try {
        log(`Filtering poems - search: "${searchTerm}", tag: "${tag}"`, 'info');
        
        let poems = allPoems;
        
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            poems = poems.filter(poem =>
                poem.title.toLowerCase().includes(term) ||
                poem.content.toLowerCase().includes(term) ||
                poem.tags.some(t => t.toLowerCase().includes(term))
            );
            log(`Filtered by search term: ${poems.length} poems found`, 'success');
        }
        
        if (tag) {
            poems = poems.filter(poem => poem.tags.includes(tag));
            log(`Filtered by tag "${tag}": ${poems.length} poems found`, 'success');
        }
        
        filteredPoems = poems;
        renderPoems();
        
    } catch (error) {
        log(`Error filtering poems: ${error.message}`, 'error');
    }
}

// Render poems to the DOM
function renderPoems() {
    try {
        log('Rendering poems to DOM...', 'info');
        
        const container = document.getElementById('poems-container');
        const loading = document.getElementById('loading');
        
        if (!container) {
            log('Poems container not found', 'error');
            return;
        }
        
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (filteredPoems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; grid-column: 1 / -1;">No poems found.</p>';
            log('No poems to render', 'info');
            return;
        }
        
        container.innerHTML = filteredPoems.map(poem => createPoemCard(poem)).join('');
        log(`Rendered ${filteredPoems.length} poems successfully`, 'success');
        
    } catch (error) {
        log(`Error rendering poems: ${error.message}`, 'error');
    }
}

// Load all poems
async function loadPoems() {
    try {
        log('Loading all poems...', 'info');
        
        allPoems = await fetchWithErrorHandling(`${API_BASE}/poems`);
        filteredPoems = allPoems;
        
        log(`Loaded ${allPoems.length} poems successfully`, 'success');
        renderPoems();
        
    } catch (error) {
        log(`Error loading poems: ${error.message}`, 'error');
        
        const container = document.getElementById('poems-container');
        const loading = document.getElementById('loading');
        
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading poems.</p>';
        }
        
        showNotification('Error loading poems. Please try again later.', 'error');
    }
}

// Setup search functionality
function setupSearch() {
    try {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                log(`Search input changed: "${e.target.value}"`, 'info');
                filterPoems(e.target.value);
            });
            log('Search functionality setup completed', 'success');
        } else {
            log('Search input element not found', 'warn');
        }
    } catch (error) {
        log(`Error setting up search: ${error.message}`, 'error');
    }
}

// Setup tag filters
function setupTagFilters() {
    try {
        const tagFilters = document.querySelectorAll('.tag-filter');
        tagFilters.forEach(btn => {
            btn.addEventListener('click', function() {
                const tag = btn.dataset.tag;
                log(`Tag filter clicked: ${tag}`, 'info');
                filterPoems('', tag);
            });
        });
        log(`Tag filters setup completed: ${tagFilters.length} filters`, 'success');
    } catch (error) {
        log(`Error setting up tag filters: ${error.message}`, 'error');
    }
}

// Setup scroll to top button
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    try {
        log('Poems page initialization started', 'info');
        
        loadPoems();
        
        // Set copyright year
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
            log('Copyright year updated', 'success');
        } else {
            log('Copyright year element not found', 'warn');
        }
        
        // Setup all functionality
        setupSearch();
        setupTagFilters();
        setupScrollToTop();
        
        log('Poems page initialization completed successfully', 'success');
        
    } catch (error) {
        log(`Poems page initialization failed: ${error.message}`, 'error');
        showNotification('Failed to initialize poems page', 'error');
    }
});