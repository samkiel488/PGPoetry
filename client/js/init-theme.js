// Initialize and manage theme across pages (prevents flash and provides toggle when present)
(function(){
    function applyThemeClasses(isDark){
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark-theme', isDark);
        var icon = document.getElementById('theme-icon');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }

    function getSavedTheme(){
        try { return localStorage.getItem('theme') || 'light'; } catch(e){ return 'light'; }
    }

    // Apply immediately (run as early as possible)
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
            });
        }
    });

    // Sync across tabs
    window.addEventListener('storage', function(e){
        if (e.key === 'theme') {
            applyThemeClasses(e.newValue === 'dark');
        }
    });
})();
