const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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
  getRSSFeed
} = require('../controllers/poemController');

// Public routes
router.get('/', getAllPoems);
router.get('/:slug', getPoemBySlug);

// Protected routes (admin only, with validation)
router.post('/',
  auth,
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
router.put('/:id', auth, updatePoem);
router.delete('/:id', auth, deletePoem);

// Like a poem (public, rate limited)
const likeLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
router.post('/:id/like', likeLimiter, likePoem);

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

module.exports = router;