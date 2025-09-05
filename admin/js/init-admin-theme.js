// Admin theme initializer — applies saved theme immediately and sets up the toggle
(function(){
  function applyThemeClasses(isDark){
    try{
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark-theme', isDark);
      document.body.classList.toggle('dark', isDark);
      var icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }catch(e){ console.warn('applyThemeClasses error', e); }
  }

  function getSavedTheme(){
    try { return localStorage.getItem('theme') || 'dark'; } catch(e){ return 'dark'; }
  }

  // Apply immediately
  var saved = getSavedTheme();
  applyThemeClasses(saved === 'dark');

  // Attach toggle behavior if toggle exists
  document.addEventListener('DOMContentLoaded', function(){
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function(){
        var current = getSavedTheme() === 'dark' ? 'dark' : 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('theme', next); } catch(e){}
        applyThemeClasses(next === 'dark');
        // Dispatch a custom event to notify other scripts of theme change
        window.dispatchEvent(new Event('themechange'));
      });
    }
  });

  // Sync across tabs
  window.addEventListener('storage', function(e){
    if (e.key === 'theme') {
      applyThemeClasses(e.newValue === 'dark');
      window.dispatchEvent(new Event('themechange'));
    }
  });
})();
