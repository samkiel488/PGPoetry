const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? (line + ' ' + words[n]) : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const outDir = path.join(__dirname, '..', 'client', 'images', 'previews');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const poem = {
  title: "When Light Returns",
  content: `The city sleeps beneath a silver hush,
and in the alleys, soft echoes recall
all the small mercies that stitched our hush -
memory's cardinals answering the fall.

A lantern left on the windowsill burns
for nights we said we'd not forget.
Fold your coat close; the road still turns.
We are starlit, we are not done yet.`
};

const presets = {
  classic: { titleFont: 'bold 56px Serif', bodyFont: '28px Sans', padding: 100, lineHeight: 1.7 },
  modern:  { titleFont: 'bold 64px Serif', bodyFont: '30px Sans', padding: 110, lineHeight: 1.85 },
  compact: { titleFont: 'bold 48px Serif', bodyFont: '22px Sans', padding: 80, lineHeight: 1.55 }
};

async function makeImage(presetName) {
  const preset = presets[presetName];
  const cardWidth = 1400;
  // compute text layout using an offscreen canvas
  const measureCanvas = createCanvas(cardWidth, 1000);
  const mctx = measureCanvas.getContext('2d');
  mctx.font = preset.titleFont;
  const titleLines = wrapText(mctx, poem.title || '', cardWidth - preset.padding * 2);
  mctx.font = preset.bodyFont;
  const paragraphs = poem.content.trim().split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim());
  const bodyLines = [];
  paragraphs.forEach((p, idx) => {
    const lines = wrapText(mctx, p, cardWidth - preset.padding * 2);
    bodyLines.push(...lines);
    if (idx < paragraphs.length - 1) bodyLines.push(null);
  });

  const titleFontSize = parseInt(preset.titleFont.match(/(\d+)px/)[1], 10);
  const bodyFontSize = parseInt(preset.bodyFont.match(/(\d+)px/)[1], 10);
  const lineHeight = Math.round(bodyFontSize * preset.lineHeight);
  const paragraphGap = Math.round(bodyFontSize * 0.9);
  const titleHeight = titleLines.length * Math.round(titleFontSize * 1.25);
  let bodyHeight = 0;
  bodyLines.forEach(ln => { bodyHeight += (ln === null ? paragraphGap : lineHeight); });
  const footerHeight = 90;
  const cardHeight = Math.ceil(preset.padding * 2 + titleHeight + 32 + bodyHeight + footerHeight);

  const canvas = createCanvas(cardWidth, cardHeight);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,cardWidth,cardHeight);

  // draw subtle gradient
  const g = ctx.createLinearGradient(0,0,0,cardHeight);
  g.addColorStop(0, 'rgba(231, 76, 60, 0.02)');
  g.addColorStop(1, 'rgba(102,126,234,0.02)');
  ctx.fillStyle = g; ctx.fillRect(0,0,cardWidth,cardHeight);

  // card area
  const cardX = 40, cardY = 40, cardW = cardWidth - 80, cardH = cardHeight - 80;
  ctx.fillStyle = '#fff';
  ctx.fillRect(cardX, cardY, cardW, cardH);

  let cursorY = cardY + 36;
  // title
  ctx.fillStyle = '#111'; ctx.font = preset.titleFont; ctx.textBaseline = 'top';
  titleLines.forEach(line => { ctx.fillText(line, cardX + preset.padding, cursorY); cursorY += Math.round(titleFontSize * 1.25); });
  cursorY += Math.round(bodyFontSize * 0.8);

  // body
  ctx.fillStyle = '#222'; ctx.font = preset.bodyFont;
  bodyLines.forEach(line => {
    if (line === null) { cursorY += paragraphGap; } else { ctx.fillText(line, cardX + preset.padding, cursorY); cursorY += lineHeight; }
  });

  // footer
  ctx.fillStyle = '#6b7280'; ctx.font = '16px Sans'; ctx.fillText("PG Poetry — pgpoetry", cardX + preset.padding, cardY + cardH - 50);

  const outPath = path.join(outDir, `${presetName}.png`);
  const out = fs.createWriteStream(outPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  return new Promise((res, rej) => {
    out.on('finish', () => res(outPath));
    out.on('error', rej);
  });
}

(async () => {
  try {
    console.log('Generating previews...');
    const results = [];
    for (const p of Object.keys(presets)) {
      const file = await makeImage(p);
      console.log('Wrote', file);
      results.push(file);
    }
    console.log('All done. Files:', results);
  } catch (e) {
    console.error('Error generating previews', e);
    process.exit(1);
  }
})();
