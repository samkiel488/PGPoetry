(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js';
    script.onload = () => console.log('iziToast loaded from CDN');
    script.onerror = () => {
        console.error('Failed to load iziToast from CDN, trying local fallback');
        const localScript = document.createElement('script');
        localScript.src = '/node_modules/izitoast/dist/js/iziToast.min.js';
        localScript.onload = () => console.log('iziToast loaded from local fallback');
        localScript.onerror = () => console.error('Failed to load iziToast from local fallback');
        document.head.appendChild(localScript);
    };
    document.head.appendChild(script);
})();
