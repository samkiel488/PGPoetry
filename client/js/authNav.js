(function(){
  // Renders auth links in #auth-nav, handles token refresh and logout
  const api = {
    me: '/api/me',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout'
  };

  function el() { return document.getElementById('auth-nav'); }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>\"'`]/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;', '`':'&#96;'}[m]) || m;
    });
  }

  function renderLoggedOut(){
    const node = el(); if(!node) return;
    node.innerHTML = `
      <a class="nav-link" href="/auth.html">Login</a>
      <a class="nav-link" href="/auth.html#register" style="margin-left:0.5rem">Sign up</a>
    `;
  }

  function getInitials(user){
    const name = (user && (user.username || user.name)) || (user && user.email) || 'U';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  }

  function renderLoggedIn(user){
    const node = el(); if(!node) return;
    const name = escapeHtml(user.username || user.email || 'user');
    const email = escapeHtml(user.email || '');
    const initials = escapeHtml(getInitials(user));

    node.innerHTML = `
      <div class="auth-avatar-wrapper">
        <button id="user-avatar-btn" class="nav-avatar-btn" aria-haspopup="true" aria-expanded="false" title="Account menu">
          <span class="nav-avatar">${initials}</span>
        </button>
        <div id="user-dropdown" class="user-dropdown hidden" role="menu" aria-hidden="true">
          <div class="user-dropdown-info">
            <div class="user-name">${name}</div>
            <div class="user-email">${email}</div>
          </div>
          <div class="user-dropdown-actions">
            <button id="dropdown-logout" class="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>
    `;

    // Wire interactions
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('dropdown-logout');

    function closeDropdown(){
      if (!dropdown) return;
      dropdown.classList.add('hidden');
      avatarBtn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
      document.removeEventListener('click', onDocClick);
    }

    function openDropdown(){
      if (!dropdown) return;
      dropdown.classList.remove('hidden');
      avatarBtn.setAttribute('aria-expanded', 'true');
      dropdown.setAttribute('aria-hidden', 'false');
      // listen for outside clicks to close
      setTimeout(() => document.addEventListener('click', onDocClick));
    }

    function toggleDropdown(e){
      e.stopPropagation();
      if (!dropdown) return;
      if (dropdown.classList.contains('hidden')) openDropdown(); else closeDropdown();
    }

    function onDocClick(e){
      const target = e.target;
      if (!avatarBtn.contains(target) && dropdown && !dropdown.contains(target)) {
        closeDropdown();
      }
    }

    if (avatarBtn) avatarBtn.addEventListener('click', toggleDropdown);
    if (logoutBtn) logoutBtn.addEventListener('click', () => { logout(); });
  }

  async function attemptRefresh(){
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await fetch(api.refresh, { method: 'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch (e) { return false; }
  }

  async function fetchMe(){
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const res = await fetch(api.me, { headers: { Authorization: 'Bearer ' + token } });
      if (res.ok) return await res.json();
      if (res.status === 401) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          const retry = await fetch(api.me, { headers: { Authorization: 'Bearer ' + newToken } });
          if (retry.ok) return await retry.json();
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  async function logout(){
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(api.logout, { method: 'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ refreshToken }) });
      }
    } catch (e) { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  async function init(){
    // Quick optimistic render from localStorage
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        try { renderLoggedIn(JSON.parse(raw)); } catch(e){ renderLoggedOut(); }
      } else {
        renderLoggedOut();
      }

      const me = await fetchMe();
      if (me && me.user) {
        renderLoggedIn(me.user);
      } else {
        // ensure logged out state if refresh failed
        if (!raw) renderLoggedOut();
      }
    } catch (e) { renderLoggedOut(); }
  }

  // Initialize on DOMContentLoaded if element exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
