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
        
        if (!response.ok) {
            throw new Error('Poem not found');
        }
        
        const poem = await response.json();
        
        const tags = poem.tags ? poem.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
        
        container.innerHTML = `
            <div class="poem-header">
                <h1>${poem.title}</h1>
                <p class="poem-date">${formatDate(poem.createdAt)}</p>
                <div class="poem-tags">${tags}</div>
            </div>
            <div class="poem-content">${poem.content}</div>
        `;
        
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