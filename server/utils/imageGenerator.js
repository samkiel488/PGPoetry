const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 630;

async function generateOgImageBuffer(title, siteName) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#374151');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title text
  const safeTitle = (title || siteName || "PGpoetry").replace(/\s+/g, ' ').trim();

  // Draw title (wrap)
  ctx.fillStyle = '#ffffff';
  // Use a bold large sans-serif fallback
  const maxWidth = WIDTH - 160;
  let fontSize = 64;
  ctx.font = `bold ${fontSize}px Sans`;

  // Reduce font size until title fits within max lines
  const words = safeTitle.split(' ');
  let lines = [];
  while (true) {
    lines = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth) {
        if (current === '') {
          // single very long word — force break
          lines.push(test);
          current = '';
        } else {
          lines.push(current);
          current = w;
        }
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    if (lines.length <= 3 || fontSize <= 28) break;
    fontSize -= 6;
    ctx.font = `bold ${fontSize}px Sans`;
  }

  const totalTextHeight = lines.length * (fontSize + 12);
  let startY = (HEIGHT - totalTextHeight) / 2 + fontSize / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], WIDTH / 2, startY + i * (fontSize + 12));
  }

  // Site name at bottom
  ctx.font = `600 20px Sans`;
  ctx.fillStyle = '#d1d5db';
  ctx.fillText(siteName || "PGpoetry", WIDTH / 2, HEIGHT - 40);

  return canvas.toBuffer('image/png');
}

async function getOrCreateOgImage(slug, title) {
  const cacheDir = path.join(__dirname, '..', '..', 'images', 'og-cache');
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch (e) { }

  const filename = `${slug || 'default'}.png`;
  const filePath = path.join(cacheDir, filename);

  // Return cached if exists
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const buf = await generateOgImageBuffer(title, process.env.SITE_NAME || "PGpoetry");
  fs.writeFileSync(filePath, buf);
  return filePath;
}

module.exports = { getOrCreateOgImage, generateOgImageBuffer };
