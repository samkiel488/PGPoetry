// load-css-fallback.js
(function(){
    function loadCSS(href, cb, errCb){
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        l.onload = function(){ if(cb) cb(); };
        l.onerror = function(){ if(errCb) errCb(); };
        document.head.appendChild(l);
        return l;
    }
    var localPaths = ['/css/all.min.css', 'css/all.min.css', '../css/all.min.css'];
    // fall back to the latest v6.x Font Awesome on jsDelivr (matches local bundle)
    var cdnHref = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css';
    var loaded = false;
    var tried = 0;
    var timeout = setTimeout(function(){ if(!loaded){ loadCSS(cdnHref); } }, 3000);

    function tryNext(){
        if(loaded) return;
        if(tried >= localPaths.length){
            loadCSS(cdnHref, function(){ loaded = true; clearTimeout(timeout); });
            return;
        }
        var href = localPaths[tried++];
        loadCSS(href, function(){ loaded = true; clearTimeout(timeout); }, function(){ tryNext(); });
    }
    tryNext();
})();
