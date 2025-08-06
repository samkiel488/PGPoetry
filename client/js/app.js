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
        </div>
    `;
}

// Load featured poems
async function loadFeaturedPoems() {
    try {
        const response = await fetch(`${API_BASE}/poems`);
        const poems = await response.json();
        
        // Get featured poems (first 3)
        const featuredPoems = poems.filter(poem => poem.featured).slice(0, 3);
        
        const container = document.getElementById('featured-poems');
        
        if (featuredPoems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No featured poems available.</p>';
            return;
        }
        
        container.innerHTML = featuredPoems.map(poem => createPoemCard(poem)).join('');
        
    } catch (error) {
        console.error('Error loading featured poems:', error);
        const container = document.getElementById('featured-poems');
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading poems. Please try again later.</p>';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedPoems();
}); 