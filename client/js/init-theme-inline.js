// Apply theme immediately to prevent flash (moved from inline scripts)
(function() {
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        }
    } catch(e) { console.warn('init-theme-inline error', e); }
})();
