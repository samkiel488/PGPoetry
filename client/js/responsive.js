// Universal responsive helpers: collapse long text on small screens and add "See more" toggles
(function(){
  const MOBILE_BREAKPOINT = 768; // px
  const COLLAPSE_LENGTH = 180; // characters

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.className = 'see-more';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'See more';
    return btn;
  }

  function collapseElement(el) {
    const fullText = el.textContent.trim();
    if (!fullText || fullText.length <= COLLAPSE_LENGTH) return;
    // store full text
    el.dataset.fullText = fullText;
    const truncated = fullText.substring(0, COLLAPSE_LENGTH).trim();
    el.textContent = truncated + '…';
    el.classList.add('collapsed');
    const btn = createToggleButton();
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        // collapse
        el.textContent = el.dataset.fullText.substring(0, COLLAPSE_LENGTH).trim() + '…';
        el.classList.add('collapsed');
        btn.textContent = 'See more';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        // expand
        el.textContent = el.dataset.fullText;
        el.classList.remove('collapsed');
        btn.textContent = 'See less';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    // append after element
    el.insertAdjacentElement('afterend', btn);
  }

  function initResponsive() {
    try {
      if (window.innerWidth > MOBILE_BREAKPOINT) return; // only apply on small screens

      // Targets: poem excerpts on public pages
      const excerpts = document.querySelectorAll('.poem-excerpt, .poem-content');
      excerpts.forEach(collapseElement);

      // Admin poem items: collapse their snippet paragraphs
      const adminParas = document.querySelectorAll('.poem-item p');
      adminParas.forEach(collapseElement);

      // Hide less-critical elements on small screens to reduce clutter
      document.querySelectorAll('.poem-extra, .poem-tags, .footer .footer-links, .footer .footer-brand p').forEach(el => {
        if (el) el.classList.add('hide-on-mobile');
      });

    } catch (e) {
      // fail silently
      console.warn('responsive init error', e);
    }
  }

  // Run on DOMContentLoaded and on resize crossing breakpoint
  document.addEventListener('DOMContentLoaded', initResponsive);
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', function(){
    const w = window.innerWidth;
    if ((lastWidth > MOBILE_BREAKPOINT && w <= MOBILE_BREAKPOINT) || (lastWidth <= MOBILE_BREAKPOINT && w > MOBILE_BREAKPOINT)) {
      // reload to reapply or remove collapse
      window.location.reload();
    }
    lastWidth = w;
  });
})();
