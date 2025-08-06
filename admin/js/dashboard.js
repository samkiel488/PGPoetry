// API base URL
const API_BASE = '/api';

// Global variables
let currentPoemId = null;
let poems = [];

// Get DOM elements
const poemsList = document.getElementById('poems-list');
const newPoemBtn = document.getElementById('new-poem-btn');
const logoutBtn = document.getElementById('logout-btn');
const poemModal = document.getElementById('poem-modal');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const poemForm = document.getElementById('poem-form');
const modalTitle = document.getElementById('modal-title');

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin';
        return false;
    }
    return token;
}

// Get auth headers
function getAuthHeaders() {
    const token = checkAuth();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Load poems
async function loadPoems() {
    try {
        const response = await fetch(`${API_BASE}/poems`);
        poems = await response.json();
        renderPoems();
    } catch (error) {
        console.error('Error loading poems:', error);
        poemsList.innerHTML = '<p style="color: #e74c3c;">Error loading poems</p>';
    }
}

// Render poems
function renderPoems() {
    if (poems.length === 0) {
        poemsList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No poems found. Create your first poem!</p>';
        return;
    }
    
    poemsList.innerHTML = poems.map(poem => `
        <div class="poem-item">
            <h3>${poem.title}</h3>
            <p>${poem.content.substring(0, 100)}...</p>
            <div class="poem-meta">
                <span>${formatDate(poem.createdAt)}</span>
                <div class="poem-actions">
                    <button class="btn btn-edit" onclick="editPoem('${poem._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePoem('${poem._id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Open modal for new poem
function openNewPoemModal() {
    currentPoemId = null;
    modalTitle.textContent = 'New Poem';
    poemForm.reset();
    poemModal.style.display = 'flex';
}

// Open modal for editing poem
function editPoem(poemId) {
    const poem = poems.find(p => p._id === poemId);
    if (!poem) return;
    
    currentPoemId = poemId;
    modalTitle.textContent = 'Edit Poem';
    
    // Fill form with poem data
    document.getElementById('poem-title').value = poem.title;
    document.getElementById('poem-content').value = poem.content;
    document.getElementById('poem-tags').value = poem.tags.join(', ');
    document.getElementById('poem-featured').checked = poem.featured;
    
    poemModal.style.display = 'flex';
}

// Close modal
function closePoemModal() {
    poemModal.style.display = 'none';
    currentPoemId = null;
    poemForm.reset();
}

// Handle poem form submission
poemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(poemForm);
    const poemData = {
        title: formData.get('title'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        featured: formData.get('featured') === 'on'
    };
    
    try {
        const url = currentPoemId 
            ? `${API_BASE}/poems/${currentPoemId}`
            : `${API_BASE}/poems`;
        
        const method = currentPoemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(poemData)
        });
        
        if (response.ok) {
            closePoemModal();
            loadPoems();
        } else {
            const data = await response.json();
            iziToast.error({
                title: 'Error',
                message: data.message || 'Error saving poem',
                position: 'topRight'
            });
        }
    } catch (error) {
        console.error('Error saving poem:', error);
        iziToast.error({
            title: 'Error',
            message: 'Network error. Please try again.',
            position: 'topRight'
        });
    }
});

// Delete poem
async function deletePoem(poemId) {
    if (!confirm('Are you sure you want to delete this poem?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/poems/${poemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadPoems();
        } else {
            const data = await response.json();
            iziToast.error({
                title: 'Error',
                message: data.message || 'Error deleting poem',
                position: 'topRight'
            });
        }
    } catch (error) {
        console.error('Error deleting poem:', error);
        iziToast.error({
            title: 'Error',
            message: 'Network error. Please try again.',
            position: 'topRight'
        });
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
}

// Event listeners
newPoemBtn.addEventListener('click', openNewPoemModal);
closeModal.addEventListener('click', closePoemModal);
cancelBtn.addEventListener('click', closePoemModal);
logoutBtn.addEventListener('click', logout);

// Close modal when clicking outside
poemModal.addEventListener('click', (e) => {
    if (e.target === poemModal) {
        closePoemModal();
    }
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    loadPoems();
}); 