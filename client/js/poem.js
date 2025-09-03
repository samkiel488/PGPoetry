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

        // Convert plain-text poem content into paragraphs preserving line breaks
        const paragraphs = (poem.content || '').trim().split(/\n\s*\n/).map(p => {
            // replace single newlines within a paragraph with <br>
            const inner = p.replace(/\n/g, '<br>');
            return `<p>${inner}</p>`;
        }).join('');

        const poemHTML = `
            <div class="poem-header">
                <h1>${poem.title}</h1>
                <p class="poem-date">${formatDate(poem.createdAt)}</p>
                <div class="poem-tags">${tags}</div>
            </div>
            <div class="poem-content" aria-label="Poem text">${paragraphs}</div>
            <div class="poem-extra">
                <span id="poem-words">${words} words</span>
                <span id="poem-reading">${minutes} min read</span>
                <span id="poem-views">${poem.views || 0} views</span>
            </div>
            <div class="poem-actions">
                <button class="like-btn" id="like-btn"><span class="like-count">${poem.likes || 0}</span> likes</button>
                <button class="share-btn" id="share-btn">Share</button>
                <button class="copy-link-btn" id="copy-link-btn" title="Copy link to this poem">Copy Link</button>
            </div>
        `;
        
        container.innerHTML = poemHTML;
        log('Poem HTML rendered successfully', 'success');
        
        // Add share buttons (server provides share links via meta endpoint)
        try {
            const shareResp = await fetch(`${API_BASE}/poems/${poem.slug}`);
            const shareData = await shareResp.json();
            const shareLinks = {
                twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Just read this amazing piece on ${document.title.split(' — ')[1] || "PG'sPoeticPen"} ✨: ${poem.title}`)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Just read this amazing piece on ${document.title.split(' — ')[1] || "PG'sPoeticPen"} ✨: ${poem.title}`)}%20${encodeURIComponent(window.location.href)}`,
                copy: window.location.href
            };
            renderShareButtons(shareLinks);
            // Add share menu container (for advanced share actions)
            const container = document.getElementById('poem-container');
            if (container) {
                const menu = document.createElement('div');
                menu.className = 'share-menu';
                menu.id = 'share-menu';
                menu.style.position = 'absolute';
                menu.innerHTML = `
                    <div class="share-option copy" id="share-copy">
                        <span class="icon">📋</span><span>Copy poem & link</span>
                    </div>
                    <div class="share-option image" id="share-image">
                        <span class="icon">🖼️</span><span>Share as image</span>
                    </div>
                    <div class="share-option social" id="share-socials">
                        <span class="icon">🔗</span><span>Share to social sites</span>
                    </div>
                `;
                // append to body so positioning and offsetWidth are reliable
                document.body.appendChild(menu);
            }
        } catch (e) {
            console.error('Error fetching share links', e);
        }

        // Setup interactive elements
        setupPoemInteractions(poem);
        
    } catch (error) {
        log(`Error loading poem: ${error.message}`, 'error');
        const container = document.getElementById('poem-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading poem, Please kindly check your internet connection.</p>';
        }
        showNotification('Error loading poem, Please kindly check your internet connection.', 'error');
    } finally {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Render share buttons into #share-container
function renderShareButtons(shareLinks) {
    try {
        const container = document.getElementById('share-container');
        if (!container) return;

        container.innerHTML = `
            <div class="share-buttons">
                <a href="${shareLinks.twitter}" target="_blank" rel="noopener noreferrer" class="share-btn share-twitter">Share on X</a>
                <a href="${shareLinks.facebook}" target="_blank" rel="noopener noreferrer" class="share-btn share-facebook">Share on Facebook</a>
                <a href="${shareLinks.whatsapp}" target="_blank" rel="noopener noreferrer" class="share-btn share-whatsapp">Share on WhatsApp</a>
                <button id="copy-link-btn" class="share-btn share-copy">Copy Link</button>
            </div>
        `;

        const copyBtn = document.getElementById('copy-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareLinks.copy || window.location.href)
                        .then(() => showNotification && showNotification('Link copied to clipboard', 'success'))
                        .catch(() => showNotification && showNotification('Failed to copy link', 'error'));
                } else {
                    // fallback
                    const fakeInput = document.createElement('input');
                    fakeInput.value = shareLinks.copy || window.location.href;
                    document.body.appendChild(fakeInput);
                    fakeInput.select();
                    try { document.execCommand('copy'); showNotification && showNotification('Link copied to clipboard', 'success'); } catch (e) { showNotification && showNotification('Failed to copy link', 'error'); }
                    document.body.removeChild(fakeInput);
                }
            });
        }
    } catch (error) {
        console.error('renderShareButtons error', error);
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
                    const menu = document.getElementById('share-menu');
                    if (!menu) return;
                    // show first so we can measure width
                    menu.classList.add('visible');
                    menu.classList.add('anim-open');
                    // Position menu near the button (simple approach)
                    const rect = shareBtn.getBoundingClientRect();
                    // compute left after visible so offsetWidth is accurate
                    const left = Math.max(12, rect.left + window.scrollX + rect.width - menu.offsetWidth);
                    menu.style.left = left + 'px';
                    menu.style.top = (rect.bottom + window.scrollY + 8) + 'px';
                    // remove anim class after animation ends
                    setTimeout(() => menu.classList.remove('anim-open'), 320);
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

        // Share menu option handlers
        const shareCopy = document.getElementById('share-copy');
        if (shareCopy) {
            shareCopy.addEventListener('click', function() {
                try {
                    // Copy poem text + link
                    const text = `${poem.title}\n\n${poem.content}\n\nRead more: ${window.location.href}`;
                    navigator.clipboard.writeText(text).then(() => {
                        showNotification('Poem and link copied to clipboard', 'success');
                            // auto-close menu
                            const menu = document.getElementById('share-menu'); if (menu) { menu.classList.remove('visible'); }
                    }).catch(async () => {
                        // fallback to input
                        const fake = document.createElement('textarea');
                        fake.value = text;
                        document.body.appendChild(fake);
                        fake.select();
                        try { document.execCommand('copy'); showNotification('Poem and link copied to clipboard', 'success'); } catch (e) { showNotification('Copy failed', 'error'); }
                        document.body.removeChild(fake);
                    });
                } catch (e) {
                    console.error('share-copy error', e);
                    showNotification('Could not copy', 'error');
                }
            });
        }

        const shareImage = document.getElementById('share-image');
        if (shareImage) {
            shareImage.addEventListener('click', async function() {
                try {
                    // Render poem text into a simple canvas image
                    const lines = (poem.content || '').split(/\n/);
                    const canvas = document.createElement('canvas');
                    const width = 1200;
                    const lineHeight = 36;
                    const padding = 60;
                    const height = padding * 2 + Math.min(800, lines.length * lineHeight);
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    // bg
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0,0,width,height);
                    // title
                    ctx.fillStyle = '#2c3e50';
                    ctx.font = 'bold 36px serif';
                    ctx.fillText(poem.title, padding, padding);
                    // body
                    ctx.fillStyle = '#444';
                    ctx.font = '20px serif';
                    let y = padding + 48;
                    ctx.textBaseline = 'top';
                    for (let i=0;i<lines.length && y < height - padding; i++) {
                        const line = lines[i];
                        // simple wrap
                        ctx.fillText(line, padding, y);
                        y += lineHeight;
                    }
                    // convert to blob
                    canvas.toBlob(async function(blob) {
                        if (!blob) return showNotification('Could not generate image', 'error');
                        const file = new File([blob], `${(poem.title || 'poem').replace(/[^a-z0-9]/gi,'_')}.png`, { type: 'image/png' });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({ files: [file], title: poem.title, text: poem.title });
                                showNotification('Image shared', 'success');
                            } catch (e) {
                                showNotification('Share failed', 'error');
                            }
                        } else {
                            // download fallback
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `${(poem.title || 'poem').replace(/[^a-z0-9]/gi,'_')}.png`;
                            document.body.appendChild(a); a.click(); a.remove();
                            URL.revokeObjectURL(url);
                            showNotification('Image downloaded', 'success');
                        }
                    });
                } catch (e) {
                    console.error('share-image error', e);
                    showNotification('Could not create image', 'error');
                }
            });
        }

        const shareSocials = document.getElementById('share-socials');
        if (shareSocials) {
            shareSocials.addEventListener('click', function() {
                // open share links section already rendered by renderShareButtons
                const shareButtons = document.querySelector('.share-buttons');
                if (shareButtons) {
                    shareButtons.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    shareButtons.style.outline = '3px solid rgba(102,126,234,0.12)';
                    setTimeout(() => { shareButtons.style.outline = ''; }, 1500);
                } else {
                    showNotification('Social share options not available', 'warning');
                }
            });
        }
        
        log('All poem interactions setup completed', 'success');
        
    } catch (error) {
        log(`Error setting up poem interactions: ${error.message}`, 'error');
    }

            // Close share menu when clicking outside or pressing Escape
            document.addEventListener('click', function(ev){
                const menu = document.getElementById('share-menu');
                if (!menu || !menu.classList.contains('visible')) return;
                if (ev.target.closest && ev.target.closest('.share-menu')) return; // inside
                if (ev.target.closest && ev.target.closest('#share-btn')) return; // share button
                menu.classList.remove('visible');
            });
            document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape') { const menu = document.getElementById('share-menu'); if (menu) menu.classList.remove('visible'); } });
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

// After rendering poem HTML, fetch server-generated share links and render buttons
(async function() {
    try {
        const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '';
        const shareResp = await fetch(`${apiBase}/api/poems/${window.__POEM_SLUG__ || (window.location.pathname.split('/').pop())}/share-links`);
        if (!shareResp.ok) throw new Error('Share links fetch failed');
        const shareLinks = await shareResp.json();
        renderShareButtons(shareLinks);
    } catch (err) {
        console.warn('Could not fetch server share links, using fallback', err);
        const fallback = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(document.title || 'Check this poem')}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
            whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(document.title || 'Check this poem')}%20${encodeURIComponent(window.location.href)}`,
            copy: window.location.href
        };
        renderShareButtons(fallback);
    }
})();