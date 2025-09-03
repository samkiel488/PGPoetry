Replay Vishnu Nagar song from. // API base URL
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
        
        // Show full content in the listing (no 'See more' behavior)
        const excerpt = poem.content || '';
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        const { words, minutes } = getReadingTime(poem.content);
        const likes = poem.likes || 0;
        const views = poem.views || 0;
        
        const isLiked = likedPoems.has(poem._id);
        const cardHTML = `
            <div class="poem-card" data-poem-slug="${poem.slug}">
                <h3 class="poem-title">${poem.title}</h3>
                <p class="poem-excerpt">${excerpt}</p>
                <div class="poem-meta">
                    <span class="poem-date">${formatDate(poem.createdAt)}</span>
                    <div class="poem-tags">${tags}</div>
                    <span class="poem-words">${words} words</span>
                    <span class="poem-reading">${minutes} min read</span>
                </div>
                        <div class="poem-stats">
                            <span class="poem-views">👁️ ${views} views</span>
                            <button class="like-btn inline-like ${isLiked ? 'liked' : ''}" data-poem-id="${poem._id}" aria-label="Like this poem" ${isLiked ? 'disabled' : ''}>
                                <span class="like-icon">❤</span>
                                <span class="like-count">${likes}</span>
                            </button>
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

// Track liked poems to prevent multiple likes
const likedPoems = new Set();

// Like button handler with rate limiting
async function likePoem(btn, poemId) {
    let success = false;
    try {
        log(`Like button clicked for poem: ${poemId}`, 'info');
        if (!btn || !poemId) {
            log('Like button element or poemId missing', 'error');
            return;
        }

        // Check if already liked
        if (likedPoems.has(poemId)) {
            log(`Poem ${poemId} already liked`, 'warn');
            showNotification('You have already liked this poem!', 'warning');
            return;
        }

        // Disable button and show loading state
        btn.disabled = true;
        const likeCountEl = btn.querySelector('.like-count');
        const originalCount = likeCountEl ? parseInt(likeCountEl.textContent, 10) || 0 : 0;
        if (likeCountEl) likeCountEl.textContent = '...';

        // Add rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const data = await fetchWithErrorHandling(`${API_BASE}/poems/${poemId}/like`, { method: 'POST' });

        // Update UI with returned likes count when available
        const newLikes = data && typeof data.likes === 'number' ? data.likes : originalCount + 1;
        if (likeCountEl) likeCountEl.textContent = newLikes;

        // Mark as liked and keep disabled to prevent further likes
        likedPoems.add(poemId);
        btn.classList.add('liked');
        btn.disabled = true;
        success = true;

        log(`Poem liked successfully: ${poemId}`, 'success');
        showNotification('Poem liked!', 'success');

    } catch (error) {
        log(`Error liking poem: ${error.message}`, 'error');
        showNotification('Could not like poem. Please try again.', 'error');

        // Reset button state on error
        if (btn) {
            const likeCountEl = btn.querySelector('.like-count');
            if (likeCountEl) likeCountEl.textContent = likeCountEl.getAttribute('data-original') || '0';
            btn.classList.remove('liked');
        }
    } finally {
        if (btn && !success) btn.disabled = false;
    }
}

// Filter poems by search term or tag
function filterPoems(searchTerm = '', tag = '') {
    try {
        log(`Filtering poems - search: "${searchTerm}", tag: "${tag}"`, 'info');
        let poems = allPoems;

        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            poems = poems.filter(poem => {
                const titleMatch = poem.title && poem.title.toLowerCase().includes(term);
                const contentMatch = poem.content && poem.content.toLowerCase().includes(term);
                const tagsMatch = Array.isArray(poem.tags) && poem.tags.some(t => String(t).toLowerCase().includes(term));
                return titleMatch || contentMatch || tagsMatch;
            });
            log(`Filtered by search term: ${poems.length} poems found`, 'success');
        }

        if (tag) {
            poems = poems.filter(poem => Array.isArray(poem.tags) && poem.tags.includes(tag));
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

// Spinner utilities (moved here so they are available to loadPoems and other functions)
function showSpinner(id) {
    const el = document.getElementById(id);
    if (el) {
        el.setAttribute('data-loading-visible', 'true');
        el.style.display = 'block';
    }
}

function hideSpinner(id) {
    const el = document.getElementById(id);
    if (el) {
        el.removeAttribute('data-loading-visible');
        el.style.display = 'none';
    }
}

// Load all poems
async function loadPoems() {
    try {
        log('Loading all poems...', 'info');
        showSpinner('loading');
        const response = await fetchWithErrorHandling(`${API_BASE}/poems`);
        log('API response:', 'info');
        console.log('API response raw:', response);
        if (Array.isArray(response) && response.length > 0) {
            console.log('First poem object:', response[0]);
        }
        // Only accept array response from API
        if (Array.isArray(response)) {
            allPoems = response;
        } else {
            allPoems = [];
            log('API response format not recognized', 'error');
            showNotification('Error: Unexpected API response format.', 'error');
        }
        filteredPoems = allPoems;
        log(`Loaded ${allPoems.length} poems successfully`, 'success');
        // Generate tag filters after loading poems
        generateTagFilters();
        renderPoems();
    } catch (error) {
        log(`Error loading poems: ${error.message}`, 'error');
        const container = document.getElementById('poems-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading poems.</p>';
        }
        showNotification('Error loading poems. Please try again later.', 'error');
    } finally {
        hideSpinner('loading');
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

// Generate tag filters dynamically
function generateTagFilters() {
    try {
        log('Generating tag filters dynamically', 'info');
        
        // Get all unique tags from poems
        const allTags = new Set();
        allPoems.forEach(poem => {
            if (poem.tags && Array.isArray(poem.tags)) {
                poem.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        const uniqueTags = Array.from(allTags).sort();
        log(`Found ${uniqueTags.length} unique tags: ${uniqueTags.join(', ')}`, 'success');
        
        // Get the tag filters container
        const tagFiltersContainer = document.querySelector('.tag-filters');
        if (!tagFiltersContainer) {
            log('Tag filters container not found', 'error');
            return;
        }
        
        // Clear existing filters and add "All" button
        tagFiltersContainer.innerHTML = `
            <button class="tag-filter active" data-tag="">All Poems</button>
        `;
        
        // Responsive behavior: show only a few tags on small screens and provide a "More" toggle
        const MAX_VISIBLE_MOBILE = 5;
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

        if (isMobile && uniqueTags.length > MAX_VISIBLE_MOBILE) {
            // show first N tags and hide the rest behind a toggle
            uniqueTags.forEach((tag, idx) => {
                if (idx < MAX_VISIBLE_MOBILE) {
                    const tagButton = document.createElement('button');
                    tagButton.className = 'tag-filter';
                    tagButton.setAttribute('data-tag', tag);
                    tagButton.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
                    tagFiltersContainer.appendChild(tagButton);
                }
            });

            // create hidden container for the remaining tags
            const hiddenWrapper = document.createElement('span');
            hiddenWrapper.className = 'tag-more-list';
            hiddenWrapper.style.display = 'none';

            uniqueTags.forEach((tag, idx) => {
                if (idx >= MAX_VISIBLE_MOBILE) {
                    const tagButton = document.createElement('button');
                    tagButton.className = 'tag-filter tag-filter-hidden';
                    tagButton.setAttribute('data-tag', tag);
                    tagButton.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
                    hiddenWrapper.appendChild(tagButton);
                }
            });

            const moreBtn = document.createElement('button');
            moreBtn.className = 'tag-filter tag-filter-more';
            moreBtn.type = 'button';
            moreBtn.textContent = 'More ▾';
            moreBtn.setAttribute('aria-expanded', 'false');

            tagFiltersContainer.appendChild(hiddenWrapper);
            tagFiltersContainer.appendChild(moreBtn);
        } else {
            // Desktop or few tags: render them all
            uniqueTags.forEach(tag => {
                const tagButton = document.createElement('button');
                tagButton.className = 'tag-filter';
                tagButton.setAttribute('data-tag', tag);
                tagButton.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
                tagFiltersContainer.appendChild(tagButton);
            });
        }
        
        log('Tag filters generated successfully', 'success');
    } catch (error) {
        log(`Error generating tag filters: ${error.message}`, 'error');
    }
}

// Setup tag filters using event delegation so dynamically added buttons work
function setupTagFilters() {
    try {
        const tagFiltersContainer = document.querySelector('.tag-filters');
        if (!tagFiltersContainer) {
            log('Tag filters container not found', 'warn');
            return;
        }

        // Delegate clicks to buttons with class 'tag-filter'
        tagFiltersContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('button.tag-filter');
            if (!btn) return;

            // Handle the "More" toggle separately
            if (btn.classList.contains('tag-filter-more')) {
                e.preventDefault();
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                const hiddenList = tagFiltersContainer.querySelector('.tag-more-list');
                if (hiddenList) {
                    if (expanded) {
                        hiddenList.style.display = 'none';
                        btn.textContent = 'More ▾';
                        btn.setAttribute('aria-expanded', 'false');
                    } else {
                        hiddenList.style.display = 'inline-block';
                        btn.textContent = 'Less ▴';
                        btn.setAttribute('aria-expanded', 'true');
                    }
                }
                return;
            }

            // Normal tag filter click
            const tag = btn.getAttribute('data-tag');
            // update active class
            tagFiltersContainer.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterPoems('', tag);
        });

        log('Tag filters setup completed', 'success');
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

// Setup poem card and like button events
function setupPoemCardEvents() {
    try {
        log('Setting up poem card and like button events', 'info');
        
        document.addEventListener('click', function(e) {
            const poemCard = e.target.closest('.poem-card');
            const likeBtn = e.target.closest('.like-btn');
            
            if (likeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const poemId = likeBtn.getAttribute('data-poem-id');
                if (poemId) {
                    log(`Like button clicked for poem: ${poemId}`, 'info');
                    // Pass the actual button element to likePoem
                    likePoem(likeBtn, poemId);
                }
            } else if (poemCard) {
                const slug = poemCard.getAttribute('data-poem-slug');
                if (slug) {
                    log(`Navigating to poem: ${slug}`, 'info');
                    window.location.href = `/poem/${slug}`;
                }
            }
        });
        
        log('Poem card and like button events setup completed', 'success');
    } catch (error) {
        log(`Error setting up poem card events: ${error.message}`, 'error');
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
        setupPoemCardEvents();

        // Theme persistence (standardized)
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');

        function applyTheme(theme) {
            // set both classnames so admin (dark-theme) and client (dark) CSS both respond
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

        // Sync theme across tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                applyTheme(e.newValue || 'light');
            }
        });
        
        log('Poems page initialization completed successfully', 'success');
        
    } catch (error) {
        log(`Poems page initialization failed: ${error.message}`, 'error');
    }
});