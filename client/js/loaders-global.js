// Global loader to replace inline loaders across pages and respect CSP
(function(){
    function loadScript(src, cb, errCb){
        var s = document.createElement('script');
        s.src = src;
        s.async = false; // ensure execution order
        s.onload = function(){ if(cb) cb(); };
        s.onerror = function(){ if(errCb) errCb(); };
        document.head.appendChild(s);
    }

    // Always load iziToast from CDN (fast and reliable)
    var iziCdn = 'https://cdn.jsdelivr.net/npm/izitoast/dist/js/iziToast.min.js';
    loadScript(iziCdn, function(){
        // iziToast loaded, nothing else here - page-specific scripts load themselves or via loaders.js
    }, function(){
        console.warn('iziToast failed to load from CDN');
    });
})();
