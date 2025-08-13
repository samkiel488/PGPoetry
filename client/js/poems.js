// API base URL
const API_BASE = '/api';

// Global variables
let allPoems = [];
let filteredPoems = [];

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Utility function to truncate text
function truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Create poem card HTML
function getReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return { words, minutes };
}

function createPoemCard(poem) {
    const excerpt = truncateText(poem.content);
    const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    const { words, minutes } = getReadingTime(poem.content);
    return `
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
// Like button handler
async function likePoem(event, poemId) {
    const btn = event.currentTarget;
    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/poems/${poemId}/like`, { method: 'POST' });
        if (res.ok) {
            btn.classList.add('liked');
            btn.querySelector('.like-text').textContent = 'Liked';
        } else {
            alert('Could not like poem.');
        }
    } catch {
        alert('Network error.');
    }
    btn.disabled = false;
}
}

// Filter poems by search term or tag
function filterPoems(searchTerm = '', tag = '') {
    let poems = allPoems;
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        poems = poems.filter(poem =>
            poem.title.toLowerCase().includes(term) ||
            poem.content.toLowerCase().includes(term) ||
            poem.tags.some(t => t.toLowerCase().includes(term))
        );
    }
    if (tag) {
        poems = poems.filter(poem => poem.tags.includes(tag));
    }
    filteredPoems = poems;
    renderPoems();
}

// Render poems to the DOM
function renderPoems() {
    const container = document.getElementById('poems-container');
    const loading = document.getElementById('loading');
    
    loading.style.display = 'none';
    
    if (filteredPoems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; grid-column: 1 / -1;">No poems found.</p>';
        return;
    }
    
    container.innerHTML = filteredPoems.map(poem => createPoemCard(poem)).join('');
}

// Load all poems
async function loadPoems() {
    try {
        const response = await fetch(`${API_BASE}/poems`);
        allPoems = await response.json();
        filteredPoems = allPoems;
        renderPoems();
    } catch (error) {
        console.error('Error loading poems:', error);
        const container = document.getElementById('poems-container');
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
        container.innerHTML = '';
        iziToast.error({
            title: 'Error',
            message: 'Error loading poems. Please try again later.',
            position: 'topRight'
        });
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadPoems();
    // Set copyright year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        filterPoems(e.target.value);
    });
    // Tag filter
    document.querySelectorAll('.tag-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            filterPoems('', btn.dataset.tag);
        });
    });
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