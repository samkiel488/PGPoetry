// Admin analytics UI for top liked poems and top viewed poems
const API_BASE = '/api';

function log(message, type='info'){
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${type.toUpperCase()}] ${message}`);
}

async function fetchAnalytics(endpoint){
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      log('No admin token found, redirecting to login', 'warn');
      window.location.href = '/admin';
      return null;
    }
    const res = await fetch(`${API_BASE}/poems/analytics/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.status === 401) {
      log('Unauthorized for analytics endpoint, redirecting to login', 'warn');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin';
      return null;
    }
    if (!res.ok) {
      const errorText = await res.text();
      log(`Analytics endpoint error: ${res.status} - ${errorText}`, 'error');
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return await res.json();
  } catch (e) {
    log(`Failed to fetch analytics ${endpoint}: ${e.message}`, 'error');
    throw e;
  }
}

function renderTopLiked(container, poems){
  if (!container) return;
  // compute max for normalization
  const maxLikes = Math.max(1, ...poems.map(p => p.likes || 0));
  container.innerHTML = poems.map(p => {
    const pct = Math.round(((p.likes||0) / maxLikes) * 100);
    return `
    <div class="analytics-item">
      <h4>${p.title}</h4>
      <div class="analytics-meta">Likes: ${p.likes || 0} · Views: ${p.views || 0}</div>
      <div class="analytics-bar-wrap"><div class="analytics-bar" data-width="${pct}" aria-valuenow="${p.likes||0}" role="progressbar" aria-valuemin="0" aria-valuemax="${maxLikes}"></div></div>
      <div class="analytics-legend">${p.likes || 0} likes</div>
    </div>
  `}).join('');
}

function renderTopViewed(container, poems){
  if (!container) return;
  // compute max for normalization
  const maxViews = Math.max(1, ...poems.map(p => p.views || 0));
  container.innerHTML = poems.map(p => {
    const pct = Math.round(((p.views||0) / maxViews) * 100);
    return `
    <div class="analytics-item">
      <h4>${p.title}</h4>
      <div class="analytics-meta">Views: ${p.views || 0} · Likes: ${p.likes || 0}</div>
      <div class="analytics-bar-wrap"><div class="analytics-bar" data-width="${pct}" aria-valuenow="${p.views||0}" role="progressbar" aria-valuemin="0" aria-valuemax="${maxViews}"></div></div>
      <div class="analytics-legend">${p.views || 0} views</div>
    </div>
  `}).join('');
}

// Animate bars after they are inserted into DOM. Uses requestAnimationFrame for smooth repaint.
function animateAnalyticsBars(container) {
  if (!container) return;
  // small delay to ensure DOM inserted
  requestAnimationFrame(() => {
    const bars = container.querySelectorAll('.analytics-bar');
    bars.forEach(bar => {
      const pct = parseInt(bar.getAttribute('data-width') || '0', 10);
      // ensure a minimum visible width for non-zero values
      const visiblePct = pct === 0 ? 0 : Math.max(4, pct);
      // set width in next frame to trigger CSS transition
      requestAnimationFrame(() => {
        bar.style.width = visiblePct + '%';
      });
    });
  });
}

async function loadAnalytics(){
  try{
    const token = localStorage.getItem('adminToken');
    const container = document.getElementById('analytics-container');
    if (!token) {
      if (container) container.innerHTML = '<p style="color:#e67e22;">Please sign in to view analytics.</p>';
      log('No adminToken found in localStorage; skipping analytics load', 'warn');
      return;
    }
    const topLiked = await fetchAnalytics('top-liked');
    const topViewed = await fetchAnalytics('top-viewed');

    // Check if authentication failed (null return values)
    if (topLiked === null || topViewed === null) {
      log('Authentication failed during analytics fetch', 'warn');
      return;
    }

    const topLikedEl = document.getElementById('top-liked');
    const topViewedEl = document.getElementById('top-viewed');
    renderTopLiked(topLikedEl, topLiked);
    renderTopViewed(topViewedEl, topViewed);
    // Animate bars after render
    animateAnalyticsBars(document);
    // apply theme from localStorage
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    // render chart using topLiked data
    await renderChart(topLiked);
    log('Analytics loaded', 'success');
  }catch(e){
    log('Error loading analytics: ' + e.message, 'error');
    const c = document.getElementById('analytics-container');
    if (c) c.innerHTML = '<p style="color:#e74c3c;">Failed to load analytics</p>';
  }
}

async function loadChartLibrary(){
  return new Promise((resolve, reject) => {
    if (window.Chart) return resolve(window.Chart);
    const src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(window.Chart);
    s.onerror = (e) => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(s);
  });
}

async function renderChart(topLiked){
  try{
    const chartContainer = document.getElementById('analytics-chart');
    if (!chartContainer) return;
    // prepare canvas
    chartContainer.innerHTML = '<canvas id="analyticsCanvas" aria-label="Analytics chart"></canvas>';
    const canvas = document.getElementById('analyticsCanvas');
    // load Chart.js if missing
    await loadChartLibrary();
    // gather labels and data (use topLiked set)
    const labels = topLiked.map(p => p.title);
    const likesData = topLiked.map(p => p.likes || 0);
    const viewsData = topLiked.map(p => p.views || 0);
    // destroy existing chart if any
    if (window._analyticsChart) {
      try { window._analyticsChart.destroy(); } catch(e){}
      window._analyticsChart = null;
    }
    const isDark = localStorage.getItem('theme') === 'dark';
    const textColor = isDark ? '#e6eef6' : '#1f2d3d';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(31,45,61,0.06)';
    const ctx = canvas.getContext('2d');
    window._analyticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Likes',
            data: likesData,
            backgroundColor: '#667eea',
            borderRadius: 6,
            barThickness: '18'
          },
          {
            label: 'Views',
            data: viewsData,
            backgroundColor: '#e74c3c',
            borderRadius: 6,
            barThickness: '18'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor } },
          tooltip: { bodyColor: textColor }
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
        }
      }
    });
  }catch(e){
    console.warn('Chart render error', e);
  }
}

// Initialize analytics on DOM ready
document.addEventListener('DOMContentLoaded', function(){
  loadAnalytics();
});
