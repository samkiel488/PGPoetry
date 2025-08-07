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
    const slug = window.location.pathname.split('/').pop();
    const container = document.getElementById('poem-container');
    const loading = document.getElementById('loading');
    try {
        const response = await fetch(`${API_BASE}/poems/${slug}`);
        if (!response.ok) throw new Error('Poem not found');
        const poem = await response.json();
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        container.innerHTML = `
            <div class="poem-header">
                <h1>${poem.title}</h1>
                <p class="poem-date">${formatDate(poem.createdAt)}</p>
                <div class="poem-tags">${tags}</div>
                <div class="poem-actions">
                    <button class="like-btn" id="like-btn"><span class="like-count">${poem.likes || 0}</span> likes</button>
                    <button class="share-btn" id="share-btn">Share</button>
                </div>
            </div>
            <div class="poem-content">${poem.content}</div>
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
                            iziToast.error({ title: 'Error', message: 'Could not like poem', position: 'topRight' });
                        }
                    } catch {
                        iziToast.error({ title: 'Error', message: 'Network error', position: 'topRight' });
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
                        navigator.clipboard.writeText(url);
                        iziToast.success({
                            title: 'Copied',
                            message: 'Link copied to clipboard!',
                            position: 'topRight'
                        });
                    }
                };
            }
        }, 0);
    } catch (error) {
        console.error('Error loading poem:', error);
        container.innerHTML = '';
        iziToast.error({
            title: 'Error',
            message: 'Poem not found or has been removed.',
            position: 'topRight'
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
}); 