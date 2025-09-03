const striptags = (html) => {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, '');
};

function ensureAbsoluteUrl(req, p) {
  if (!p) return '';
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  const pathname = p.startsWith('/') ? p : '/' + p;
  return `${proto}://${host}${pathname}`;
}

function truncate(text, len = 150) {
  if (!text) return '';
  if (text.length <= len) return text;
  return text.slice(0, len).trim() + '...';
}

function generateMetaTags(poem = {}, req = {}) {
  const siteName = process.env.SITE_NAME || "PG'sPoeticPen";
  const title = poem.title ? `${poem.title} — ${siteName}` : `${siteName}`;

  const rawContent = poem.content || poem.body || '';
  const plain = truncate(striptags(rawContent).replace(/\s+/g, ' '), 150);
  const description = plain || `Read beautiful original poems on ${siteName}.`;

  // Prefer explicit thumbnail/image fields if present, fallback to generated og-image endpoint
  const imagePath = (poem.thumbnail || poem.image || poem.featuredImage) || `/og-image/${poem.slug || ''}`;
  const image = ensureAbsoluteUrl(req, imagePath);

  const url = typeof req.originalUrl !== 'undefined' && typeof req.get === 'function'
    ? ensureAbsoluteUrl(req, req.originalUrl)
    : '';

  // Basic meta tags + Open Graph + Twitter
  return `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">

  <!-- Open Graph -->
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
  ${url ? `<meta property="og:url" content="${escapeHtml(url)}">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}

  <!-- Generic robots -->
  <meta name="robots" content="index,follow">
  `;
}

function getShareLinks(poem = {}, req = {}) {
  const url = ensureAbsoluteUrl(req, req.originalUrl || (`/poem/${poem.slug || ''}`));
  const title = poem.title || process.env.SITE_NAME || "PG'sPoeticPen";
  const text = `Just read this amazing piece on ${process.env.SITE_NAME || "PG'sPoeticPen"} ✨: ${title}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    copy: url
  };
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, function (c) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[c];
  });
}

module.exports = {
  generateMetaTags,
  getShareLinks
};
