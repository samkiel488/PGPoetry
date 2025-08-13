// API base URL
const API_BASE = '/api';

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


// Load and display poem
async function loadPoem() {
    // Support /poems/:slug and /poem/:slug
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1];
    const container = document.getElementById('poem-container');
    const loading = document.getElementById('loading');
    try {
        const response = await fetch(`${API_BASE}/poems/${slug}`);
        if (!response.ok) throw new Error('Poem not found');
        const poem = await response.json();
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        const words = poem.content.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 200));
        container.innerHTML = `
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
        // Like button logic
        setTimeout(() => {
            const likeBtn = document.getElementById('like-btn');
            if (likeBtn) {
                likeBtn.onclick = async function(e) {
                    e.preventDefault();
                    likeBtn.disabled = true;
                    try {
                        const res = await fetch(`${API_BASE}/poems/${poem._id}/like`, { method: 'POST' });
                        if (res.ok) {
                            const data = await res.json();
                            likeBtn.querySelector('.like-count').textContent = data.likes;
                        } else {
                            alert('Could not like poem.');
                        }
                    } catch {
                        alert('Network error.');
                    }
                    likeBtn.disabled = false;
                };
            }
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) {
                shareBtn.onclick = function(e) {
                    e.preventDefault();
                    const url = window.location.href;
                    if (navigator.share) {
                        navigator.share({
                            title: poem.title,
                            text: poem.content.substring(0, 100) + '...',
                            url
                        });
                    } else {
                        alert('Share not supported on this device. Use the copy link button.');
                    }
                };
            }
            const copyBtn = document.getElementById('copy-link-btn');
            if (copyBtn) {
                copyBtn.onclick = function(e) {
                    e.preventDefault();
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                        alert('Link copied to clipboard!');
                    }, () => {
                        alert('Failed to copy link.');
                    });
                };
            }
        }, 0);
    } catch (error) {
        console.error('Error loading poem:', error);
        container.innerHTML = '';
        // Show a custom 404 page if available, else fallback
        fetch('/404.html').then(r => r.text()).then(html => {
            document.body.innerHTML = html;
        }).catch(() => {
            alert('Poem not found or has been removed.');
        });
    } finally {
        loading.style.display = 'none';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadPoem();
    // Set copyright year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    // Scroll-to-top button
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (scrollBtn) {
        window.addEventListener('scroll', function() {
            scrollBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
        });
        scrollBtn.onclick = function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
}); 