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

// --- Image generation helpers (prototype client-only) ---
function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line ? (line + ' ' + words[n]) : words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = words[n];
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);
    return lines;
}

async function generatePoemCanvas(poem, opts = {}) {
    // opts: { theme: 'light'|'dark', preset: 'classic'|'modern'|'compact'|'elegant'|'vintage' }
    const theme = opts.theme || 'light';
    const preset = opts.preset || 'classic';
    // No watermark by default for clean export
    const watermark = false;
    // Use higher default scale for crisper images
    const scale = opts.scale || 3;
    // improved base card size and paddings
    const cardWidth = 1400; // px
    let padding = 100;

    // Enhanced preset mapping with better typography
    let titleFontSize = 56;
    let bodyFontSize = 28;
    let lineHeightMultiplier = 1.7;
    let titleFontFamily = `'Crimson Text', 'Times New Roman', serif`;
    let bodyFontFamily = `'Libre Baskerville', 'Georgia', serif`;

    if (preset === 'modern') {
        titleFontSize = 64; bodyFontSize = 30; padding = 110; lineHeightMultiplier = 1.85;
        titleFontFamily = `'Montserrat', 'Helvetica Neue', sans-serif`;
        bodyFontFamily = `'Open Sans', 'Arial', sans-serif`;
    } else if (preset === 'compact') {
        titleFontSize = 48; bodyFontSize = 22; padding = 80; lineHeightMultiplier = 1.55;
        titleFontFamily = `'Poppins', 'Helvetica', sans-serif`;
        bodyFontFamily = `'Roboto', 'Arial', sans-serif`;
    } else if (preset === 'elegant') {
        titleFontSize = 58; bodyFontSize = 26; padding = 120; lineHeightMultiplier = 1.8;
        titleFontFamily = `'Playfair Display', 'Times New Roman', serif`;
        bodyFontFamily = `'Crimson Text', 'Georgia', serif`;
    } else if (preset === 'vintage') {
        titleFontSize = 52; bodyFontSize = 24; padding = 100; lineHeightMultiplier = 1.75;
        titleFontFamily = `'Old Standard TT', 'Times New Roman', serif`;
        bodyFontFamily = `'Libre Baskerville', 'Georgia', serif`;
    }

    // Create a temporary canvas to measure and draw
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // use scaled resolution for retina-quality
    canvas.width = cardWidth * scale;
    // we will compute height dynamically
    ctx.scale(scale, scale);

    // Enhanced color schemes
    let bgGradient, cardBg, textColor, metaColor, accentColor;

    if (theme === 'dark') {
        bgGradient = ['#0f1720', '#1e293b', '#334155'];
        cardBg = '#1e293b';
        textColor = '#f1f5f9';
        metaColor = '#94a3b8';
        accentColor = '#60a5fa';
    } else {
        if (preset === 'elegant') {
            bgGradient = ['#fef7ed', '#fed7aa', '#fdba74'];
            cardBg = '#ffffff';
            textColor = '#1f2937';
            metaColor = '#6b7280';
            accentColor = '#d97706';
        } else if (preset === 'vintage') {
            bgGradient = ['#f5f5f4', '#d6d3d1', '#a8a29e'];
            cardBg = '#ffffff';
            textColor = '#1c1917';
            metaColor = '#78716c';
            accentColor = '#a16207';
        } else if (preset === 'modern') {
            bgGradient = ['#f8fafc', '#e2e8f0', '#cbd5e1'];
            cardBg = '#ffffff';
            textColor = '#1e293b';
            metaColor = '#64748b';
            accentColor = '#3b82f6';
        } else {
            bgGradient = ['#ffffff', '#f8fafc', '#f1f5f9'];
            cardBg = '#ffffff';
            textColor = '#1f2937';
            metaColor = '#6b7280';
            accentColor = '#e74c3c';
        }
    }

    // Wait for webfonts to be ready so measurements are accurate
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* ignore */ }

    // Title measurements with enhanced typography
    ctx.font = `bold ${titleFontSize}px ${titleFontFamily}`;
    const titleLines = wrapText(ctx, poem.title || '', cardWidth - padding * 2);

    // Body paragraphs with improved typography
    ctx.font = `${bodyFontSize}px ${bodyFontFamily}`;
    const paragraphs = (poem.content || '').trim().split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim());
    const bodyLines = [];
    paragraphs.forEach((p, idx) => {
        const lines = wrapText(ctx, p, cardWidth - padding * 2);
        bodyLines.push(...lines);
        if (idx < paragraphs.length - 1) {
            bodyLines.push(null); // paragraph separator marker
        }
    });

    // Compute height with better spacing
    const lineHeight = Math.round(bodyFontSize * lineHeightMultiplier);
    const paragraphGap = Math.round(bodyFontSize * 1.2);
    const titleHeight = titleLines.length * Math.round(titleFontSize * 1.4);
    let bodyHeight = 0;
    bodyLines.forEach((ln) => { bodyHeight += (ln === null ? paragraphGap : lineHeight); });
    const footerHeight = 100;
    const cardHeight = Math.ceil(padding * 2 + titleHeight + 48 + bodyHeight + footerHeight);

    // resize canvas to final height (account for scale)
    canvas.height = cardHeight * scale;
    // reset and scale again
    const ctx2 = canvas.getContext('2d');
    ctx2.scale(scale, scale);

    // Enhanced background with sophisticated gradients
    const bgGradientObj = ctx2.createLinearGradient(0, 0, 0, cardHeight);
    bgGradient.forEach((color, index) => {
        bgGradientObj.addColorStop(index / (bgGradient.length - 1), color);
    });
    ctx2.fillStyle = bgGradientObj;
    ctx2.fillRect(0, 0, cardWidth, cardHeight);

    // Add subtle texture/noise for vintage preset
    if (preset === 'vintage') {
        ctx2.fillStyle = 'rgba(0,0,0,0.02)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * cardWidth;
            const y = Math.random() * cardHeight;
            const size = Math.random() * 2;
            ctx2.fillRect(x, y, size, size);
        }
    }

    // Draw enhanced card background with better shadows and rounded corners
    const cardX = 40, cardY = 40, cardW = cardWidth - 80, cardH = cardHeight - 80;
    const r = preset === 'modern' ? 12 : preset === 'elegant' ? 24 : 16;

    // Card shadow with multiple layers for depth
    ctx2.save();
    ctx2.shadowColor = 'rgba(0,0,0,0.15)';
    ctx2.shadowBlur = preset === 'elegant' ? 25 : 15;
    ctx2.shadowOffsetX = preset === 'elegant' ? 8 : 4;
    ctx2.shadowOffsetY = preset === 'elegant' ? 8 : 4;

    // Main card background
    ctx2.fillStyle = cardBg;
    ctx2.beginPath();
    ctx2.moveTo(cardX + r, cardY);
    ctx2.lineTo(cardX + cardW - r, cardY);
    ctx2.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx2.lineTo(cardX + cardW, cardY + cardH - r);
    ctx2.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx2.lineTo(cardX + r, cardY + cardH);
    ctx2.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx2.lineTo(cardX, cardY + r);
    ctx2.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();

    // Add decorative border for elegant preset
    if (preset === 'elegant') {
        ctx2.strokeStyle = accentColor;
        ctx2.lineWidth = 2;
        ctx2.stroke();
    }

    // content area start with better spacing
    let cursorY = cardY + padding * 0.6;

    // Enhanced title with better typography
    ctx2.fillStyle = textColor;
    ctx2.font = `bold ${titleFontSize}px ${titleFontFamily}`;
    ctx2.textBaseline = 'top';

    // Add subtle text shadow for elegance
    if (preset === 'elegant' || preset === 'vintage') {
        ctx2.shadowColor = 'rgba(0,0,0,0.1)';
        ctx2.shadowBlur = 2;
        ctx2.shadowOffsetX = 1;
        ctx2.shadowOffsetY = 1;
    }

    titleLines.forEach((line, index) => {
        ctx2.fillText(line, cardX + padding, cursorY);
        cursorY += Math.round(titleFontSize * 1.4);
    });

    // Reset shadow
    ctx2.shadowColor = 'transparent';
    ctx2.shadowBlur = 0;
    ctx2.shadowOffsetX = 0;
    ctx2.shadowOffsetY = 0;

    cursorY += Math.round(bodyFontSize * 1.2);

    // Enhanced body text with better spacing
    ctx2.fillStyle = textColor;
    ctx2.font = `${bodyFontSize}px ${bodyFontFamily}`;

    // Add subtle letter spacing for better readability
    ctx2.letterSpacing = preset === 'modern' ? '0.5px' : '0px';

    bodyLines.forEach(line => {
        if (line === null) {
            cursorY += paragraphGap;
        } else {
            ctx2.fillText(line, cardX + padding, cursorY);
            cursorY += lineHeight;
        }
    });

    // Enhanced footer with better typography and decorative elements
    ctx2.fillStyle = metaColor;
    ctx2.font = `16px ${bodyFontFamily}`;

    // Add decorative line above footer
    if (preset === 'elegant' || preset === 'vintage') {
        ctx2.strokeStyle = accentColor;
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(cardX + padding, cardY + cardH - 70);
        ctx2.lineTo(cardX + cardW - padding, cardY + cardH - 70);
        ctx2.stroke();
    }

    ctx2.fillText("PG'sPoeticPen — PG Poetry", cardX + padding, cardY + cardH - 45);

    // Add small decorative element for elegant preset
    if (preset === 'elegant') {
        ctx2.fillStyle = accentColor;
        ctx2.font = '12px serif';
        ctx2.fillText('❦', cardX + cardW - padding - 20, cardY + cardH - 45);
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve({ blob, canvas });
        }, 'image/png');
    });
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
    // expose poem data globally for delegated handlers (safe for client-only use)
    try { window.__CURRENT_POEM__ = poem; } catch (e) { /* ignore in restricted contexts */ }
        
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
            // Open preview modal and generate image with controls
            openImagePreviewModal(poem);
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

// Ensure delegated handler for share-image exists (prevents cases where element wasn't present)
if (!window.__pgp_share_image_delegated) {
    window.__pgp_share_image_delegated = true;
    document.addEventListener('click', function(ev) {
        try {
                const target = ev.target.closest && ev.target.closest('.share-option.image, #share-image');
            if (!target) return;
            ev.preventDefault();
                console.log('[pgp] delegated share-image click detected', { target: String(target && target.id) });
            // find poem data from global scope or inline dataset
            const poem = window.__CURRENT_POEM__ || (window.__poem_data__ ? window.__poem_data__ : null);
            if (!poem) {
                // try to parse from DOM if embedded
                const container = document.getElementById('poem-container');
                if (container && container.dataset && container.dataset.poem) {
                    try { window.__CURRENT_POEM__ = JSON.parse(container.dataset.poem); } catch (e) { /* ignore */ }
                }
            }
            const used = window.__CURRENT_POEM__ || window.__poem_data__;
            if (!used) {
                showNotification && showNotification('Poem data not available', 'warning');
                return;
            }
            openImagePreviewModal(used);
        } catch (e) {
            console.error('delegated share-image handler error', e);
            showNotification && showNotification('Could not open image preview', 'error');
        }
    });
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

// --- Image preview modal ---
function createImagePreviewModal() {
    if (document.getElementById('image-preview-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'image-preview-modal';
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="ip-overlay"></div>
        <div class="ip-dialog">
            <div class="ip-header">
                <h3>Preview Image</h3>
                <button id="ip-close" class="ip-close">×</button>
            </div>
            <div class="ip-controls">
                <label>Theme: <select id="ip-theme"><option value="light">Light</option><option value="dark">Dark</option></select></label>
                <label class="ip-presets-label">Preset: <select id="ip-preset"><option value="classic">Classic</option><option value="modern">Modern</option><option value="compact">Compact</option><option value="elegant">Elegant</option><option value="vintage">Vintage</option></select></label>
                <button id="ip-generate" class="btn btn-primary">Generate</button>
                <button id="ip-download" class="btn" disabled>Download PNG</button>
            </div>
            <div class="ip-samples" id="ip-samples" aria-hidden="false" style="padding:12px 16px; display:flex; gap:8px; overflow:auto;"></div>
            <div class="ip-preview" id="ip-preview"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#ip-close').addEventListener('click', () => { modal.classList.remove('visible'); });
    modal.querySelector('.ip-overlay').addEventListener('click', () => { modal.classList.remove('visible'); });

    // samples generation helper
    async function generateSamples(poem) {
        try {
            const samplesContainer = modal.querySelector('#ip-samples');
            if (!samplesContainer) return;
            samplesContainer.innerHTML = '';
            const presets = ['classic','modern','compact','elegant','vintage'];
            for (const p of presets) {
                const cell = document.createElement('div');
                cell.className = 'ip-sample';
                cell.dataset.preset = p;
                cell.innerHTML = '<div class="ip-sample-box" style="width:150px;height:100px;display:flex;align-items:center;justify-content:center;background:#f6f7fb;border-radius:6px;overflow:hidden;"></div><div style="font-size:12px;text-align:center;margin-top:6px;">'+p.charAt(0).toUpperCase()+p.slice(1)+'</div>';
                samplesContainer.appendChild(cell);
                // generate small thumbnail asynchronously
                (async () => {
                    try {
                        const { blob, canvas } = await generatePoemCanvas(poem, { theme: 'light', preset: p, scale: 1 });
                        const thumbUrl = canvas.toDataURL('image/png');
                        const img = document.createElement('img'); img.src = thumbUrl; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
                        const box = cell.querySelector('.ip-sample-box'); box.innerHTML = ''; box.appendChild(img);
                    } catch (e) {
                        // ignore sample failure
                    }
                })();
            }
            // click handler to pick preset
            samplesContainer.addEventListener('click', function(ev){
                const cell = ev.target.closest && ev.target.closest('.ip-sample');
                if (!cell) return;
                const p = cell.dataset.preset;
                const sel = modal.querySelector('#ip-preset'); if (sel) sel.value = p;
            });
        } catch (e) { /* ignore */ }
    }
}

async function openImagePreviewModal(poem) {
    createImagePreviewModal();
    let modal = document.getElementById('image-preview-modal');
    // defensive: if not present (race), recreate
    if (!modal) { createImagePreviewModal(); modal = document.getElementById('image-preview-modal'); }
    console.log('[pgp] openImagePreviewModal called', { title: poem && poem.title });
    const preview = document.getElementById('ip-preview');
    const themeSel = document.getElementById('ip-theme');
    // typography preset selector (injected if missing)
    let presetSel = document.getElementById('ip-preset');
    if (!presetSel) {
        const controls = modal.querySelector('.ip-controls');
        if (controls) {
            const node = document.createElement('label');
            node.innerHTML = 'Preset: <select id="ip-preset"><option value="classic">Classic</option><option value="modern">Modern</option><option value="compact">Compact</option></select>';
            controls.insertBefore(node, controls.querySelector('#ip-generate'));
            presetSel = document.getElementById('ip-preset');
        }
    }
    const genBtn = document.getElementById('ip-generate');
    const dlBtn = document.getElementById('ip-download');

    modal.classList.add('visible');
    // lock body scroll to prevent layout shift
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // rely on CSS for visual layout; still ensure modal is visible
    try {
        modal.style.pointerEvents = 'auto';
        modal.style.opacity = '1';
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        console.log('[pgp] modal shown');
    } catch (e) { console.warn('[pgp] ensuring modal visible failed', e); }

    let lastUrl = null;
    const keyHandler = (e) => { if (e.key === 'Escape') closeModal(); };

    function cleanupUrl() {
        if (lastUrl) {
            try { URL.revokeObjectURL(lastUrl); } catch (e) { /* ignore */ }
            lastUrl = null;
        }
    }

    function closeModal() {
        cleanupUrl();
        modal.classList.remove('visible');
        preview.innerHTML = '';
        dlBtn.disabled = true;
        genBtn.disabled = false;
        document.removeEventListener('keydown', keyHandler);
    // restore body overflow and inline styles
    try { document.body.style.overflow = prevOverflow || ''; } catch (e) { /* ignore */ }
    try {
        modal.style.display = '';
        modal.style.pointerEvents = '';
        modal.style.opacity = '';
        modal.removeAttribute('aria-hidden');
    } catch (e) { /* ignore */ }
    
    }

    async function generate() {
        genBtn.disabled = true; dlBtn.disabled = true; dlBtn.removeAttribute('data-url');
        preview.innerHTML = '<div class="ip-loading"><div class="spinner" aria-hidden="true"></div><div class="loading-text">Generating…</div></div>';
        try {
            // revoke previous
            cleanupUrl();
            const scale = 3; // higher default for crisper images
            const theme = themeSel.value || 'light';
            const preset = (presetSel && presetSel.value) ? presetSel.value : 'classic';
            const watermark = false;
            const { blob, canvas } = await generatePoemCanvas(poem, { theme, watermark, scale, preset });
            let url = null;
            let usedDataUrl = false;
            try {
                // try blob URL first
                url = URL.createObjectURL(blob);
                lastUrl = url;
            } catch (cspErr) {
                // CSP may disallow blob: in img-src — fallback to data URL
                try {
                    url = canvas.toDataURL('image/png');
                    usedDataUrl = true;
                    console.warn('[pgp] Falling back to data URL for image preview due to CSP', cspErr);
                } catch (dErr) {
                    console.error('[pgp] toDataURL also failed', dErr);
                    throw dErr;
                }
            }
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            preview.appendChild(img);
            dlBtn.disabled = false;
            dlBtn.onclick = () => {
                const a = document.createElement('a');
                // For data URLs we can set href directly; for blob URLs also works
                a.href = url; a.download = `${(poem.title || 'poem').replace(/[^a-z0-9]/gi,'_')}.png`;
                document.body.appendChild(a); a.click(); a.remove();
                // revoke blob URLs after download initiation
                if (!usedDataUrl) cleanupUrl();
            };
        } catch (e) {
            preview.innerHTML = '<div class="ip-error">Failed to generate image</div>';
        } finally {
            genBtn.disabled = false;
        }
    }

    // wire controls
    genBtn.onclick = generate;
    // ensure close removes Url and listeners
    modal.querySelector('#ip-close').addEventListener('click', closeModal);
    modal.querySelector('.ip-overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', keyHandler);

    // ensure modal is focused for keyboard close and visible in DOM
    try { modal.focus(); } catch (e) { /* ignore */ }
    await new Promise(res => requestAnimationFrame(res));
    // Trigger initial generation
    await generate();
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