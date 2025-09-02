// Load local iziToast first, fallback to CDN if missing
(function(){
    function loadScript(src, cb, errCb){
        var s = document.createElement('script');
        s.src = src;
        s.onload = cb; s.onerror = errCb;
        document.head.appendChild(s);
    }

    var iziLocal = '/node_modules/izitoast/dist/js/iziToast.min.js';
    var iziCdn = 'https://cdn.jsdelivr.net/npm/izitoast/dist/js/iziToast.min.js';
    // try local path first (if you vendored node_modules into client) else fallback
    loadScript(iziLocal, function(){ console.log('iziToast loaded from local'); }, function(){ loadScript(iziCdn, function(){ console.log('iziToast loaded from CDN'); }); });
})();
