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
function createPoemCard(poem) {
    const excerpt = truncateText(poem.content);
    const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    
    return `
        <div class="poem-card" onclick="window.location.href='/poem/${poem.slug}'">
            <h3 class="poem-title">${poem.title}</h3>
            <p class="poem-excerpt">${excerpt}</p>
            <div class="poem-meta">
                <span class="poem-date">${formatDate(poem.createdAt)}</span>
                <div class="poem-tags">${tags}</div>
            </div>
            <button class="like-btn" onclick="event.stopPropagation(); likePoem(event, '${poem._id}')">
                <span class="like-icon">&#10084;</span> <span class="like-text">Like</span>
            </button>
        </div>
    `;
// Like button handler
function likePoem(event, poemId) {
    // You can implement backend call here if needed
    const btn = event.currentTarget;
    btn.classList.toggle('liked');
    if (btn.classList.contains('liked')) {
        btn.querySelector('.like-text').textContent = 'Liked';
    } else {
        btn.querySelector('.like-text').textContent = 'Like';
    }
}
}

// Filter poems based on search term
function filterPoems(searchTerm) {
    if (!searchTerm.trim()) {
        filteredPoems = allPoems;
    } else {
        const term = searchTerm.toLowerCase();
        filteredPoems = allPoems.filter(poem => 
            poem.title.toLowerCase().includes(term) ||
            poem.content.toLowerCase().includes(term) ||
            poem.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }
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
}); 