// Small loader script moved out of HTML to comply with strict CSP
(function(){
    function loadScript(src, cb){
        var s = document.createElement('script');
        s.src = src;
        s.async = false; // preserve execution order
        s.onload = function(){ if(cb) cb(null); };
        s.onerror = function(){ console.warn('Failed to load', src); if(cb) cb(new Error('Failed to load ' + src)); };
        document.head.appendChild(s);
    }

    var iziCdn = 'https://cdn.jsdelivr.net/npm/izitoast/dist/js/iziToast.min.js';

    // Decide which app scripts to load based on pathname
    var path = window.location.pathname || '/';
    var seq = [];

    if (path === '/' || path === '/index.html') {
        // Home
        seq = ['/js/app.js'];
    } else if (path === '/poems') {
        // Poems listing
        seq = ['/js/poems.js'];
    } else if (path.startsWith('/poem/') || (path.startsWith('/poems/') && path.split('/').filter(Boolean).length > 1)) {
        // Single poem page (support /poem/:slug and /poems/:slug)
        seq = ['/js/app.js', '/js/poem.js'];
    } else if (path.startsWith('/admin')) {
        // admin pages load their own scripts; do nothing here
        seq = [];
    } else {
        // default to loading app
        seq = ['/js/app.js'];
    }

    // Load iziToast first (CDN). If iziToast exists locally served, the CDN will be quick cached.
    loadScript(iziCdn, function(err){
        // ignore error, proceed to load page scripts
        function loadNext(i){
            if (i >= seq.length) return;
            loadScript(seq[i], function(){ loadNext(i+1); });
        }
        loadNext(0);
    });
})();
