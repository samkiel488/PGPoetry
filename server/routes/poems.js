const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
  getAllPoems,
  getPoemBySlug,
  createPoem,
  updatePoem,
  deletePoem,
  likePoem,
  getTopLikedPoems,
  getTopViewedPoems,
  getRSSFeed,
  getComments,
  createComment,
  deleteComment,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite
} = require('../controllers/poemController');
const path = require('path');
const fs = require('fs');
const { generateMetaTags, getShareLinks } = require('../utils/seoUtils');
const multer = require('multer');

// Public routes
const countViews = require('../middleware/countViews');
router.get('/', getAllPoems);
// When fetching a poem by slug, increment views via countViews middleware and then return the poem
router.get('/:slug', countViews, async (req, res, next) => {
  const accept = req.headers.accept || '';
  const Poem = require('../models/Poem');
  try {
    const slug = req.params.slug;
    const poem = req.poem || await Poem.findOne({ slug }).lean();
    if (!poem) return res.status(404).send('Poem not found');

    if (accept.includes('text/html')) {
      return renderPoemPage(req, res, poem);
    }

    // default to JSON API response
    return res.json(poem);
  } catch (e) {
    next(e);
  }
});

// Protected routes (admin only, with validation)
router.post('/',
  auth,
  requireRole('admin'),
  [
    body('title').trim().isLength({ min: 1 }).escape(),
    body('content').trim().isLength({ min: 1 }).escape(),
    body('tags').isArray().optional(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createPoem
);
router.put('/:id', auth, requireRole('admin'), updatePoem);
router.delete('/:id', auth, requireRole('admin'), deletePoem);

// Like a poem (public, rate limited)
const likeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler: do NOT send 429 to clients. Instead return a neutral 200 payload so UI doesn't show an error.
  handler: (req, res /*, next */) => {
    // You can log rate-limit events for monitoring without exposing to users
    console.warn(`Rate limit triggered for IP ${req.ip} on ${req.originalUrl}`);
    return res.status(200).json({ ok: true, rateLimited: true });
  }
});
router.post('/:id/like', likeLimiter, likePoem);

// Comment routes
router.get('/:id/comments', getComments);
router.post('/:id/comments', [
  body('text').trim().isLength({ min: 1, max: 1000 }).escape()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}, createComment);
router.delete('/comments/:id', auth, deleteComment);

// Favorite routes
router.post('/:id/favorite', auth, addFavorite);
router.delete('/:id/favorite', auth, removeFavorite);
router.get('/:id/favorite', auth, checkFavorite);
router.get('/favorites/user', auth, getUserFavorites);

// Add route for getting poem by id (for admin edit modal)
router.get('/id/:id', auth, async (req, res) => {
  const Poem = require('../models/Poem');
  try {
    const poem = await Poem.findById(req.params.id);
    if (!poem) return res.status(404).json({ message: 'Poem not found' });
    res.json(poem);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching poem' });
  }
});

// Slur filter route
router.post('/slur', async (req, res) => {
  const { text } = req.body;
  const slurWords = ['slur1', 'slur2', 'slur3']; // Add actual slur words
  const hasSlur = slurWords.some(word => text.toLowerCase().includes(word));
  res.json({ hasSlur, filtered: hasSlur ? text.replace(new RegExp(slurWords.join('|'), 'gi'), '***') : text });
});

// Analytics endpoints
router.get('/analytics/top-liked', auth, getTopLikedPoems);
router.get('/analytics/top-viewed', auth, getTopViewedPoems);
// RSS feed
router.get('/rss', getRSSFeed);

// Configure multer to store uploads in /images/uploads with validation
const uploadDir = path.join(__dirname, '..', '..', 'images', 'uploads');
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
      // ignore if exists
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    const safeId = (req.params.id || Date.now()).toString().replace(/[^a-z0-9-_]/gi, '_');
    const name = `${safeId}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, WEBP and GIF are allowed.'));
  }
  cb(null, true);
}

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter }); // 2MB limit

// Admin-only endpoint to upload a thumbnail for a poem (with explicit error handling)
router.post('/:id/thumbnail', auth, requireRole('admin'), (req, res) => {
  upload.single('thumbnail')(req, res, async function (err) {
    try {
      if (err) {
        // Multer errors or fileFilter errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ message: err.message || 'Invalid file upload' });
      }

      const Poem = require('../models/Poem');
      const poem = await Poem.findById(req.params.id);
      if (!poem) {
        // remove uploaded file if poem not found
        if (req.file && req.file.path) {
          try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        return res.status(404).json({ message: 'Poem not found' });
      }
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      // Double-check extension/mimetype server-side
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!allowedExt.includes(ext) || !allowedMimeTypes.includes(req.file.mimetype)) {
        // remove uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) { }
        return res.status(400).json({ message: 'Invalid file type' });
      }

      const relPath = `/images/uploads/${req.file.filename}`;
      poem.thumbnail = relPath;
      await poem.save();

      res.json({ message: 'Thumbnail uploaded', thumbnail: relPath });
    } catch (e) {
      console.error('thumbnail upload error', e);
      // cleanup file on error
      if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch (err) { }
      }
      res.status(500).json({ message: 'Upload failed' });
    }
  });
});

// Share links endpoint (public) - returns JSON with share URLs for social platforms
router.get('/:slug/share-links', async (req, res) => {
  try {
    const Poem = require('../models/Poem');
    const slug = req.params.slug;
    const poem = await Poem.findOne({ slug }).lean();
    if (!poem) return res.status(404).json({ message: 'Poem not found' });
    const links = getShareLinks(poem, req);
    res.json(links);
  } catch (e) {
    console.error('share-links error', e);
    res.status(500).json({ message: 'Error generating share links' });
  }
});

// Serve poem page with server-side injected SEO metadata for crawlers and social previews
async function renderPoemPage(req, res, poem) {
  try {
    const templatePath = path.join(__dirname, '..', '..', 'client', 'poem.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    const meta = generateMetaTags(poem, req);
    if (html.indexOf('<!-- SEO_META -->') !== -1) {
      html = html.replace('<!-- SEO_META -->', meta);
    } else {
      // fallback: insert before closing </head>
      html = html.replace('</head>', meta + '\n</head>');
    }
    res.send(html);
  } catch (e) {
    console.error('renderPoemPage error', e);
    // fallback to client-side file
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'poem.html'));
  }
}

module.exports = router;