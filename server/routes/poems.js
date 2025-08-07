const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllPoems,
  getPoemBySlug,
  createPoem,
  updatePoem,
  deletePoem,
  likePoem
} = require('../controllers/poemController');

// Public routes
router.get('/', getAllPoems);
router.get('/:slug', getPoemBySlug);

// Protected routes (admin only)
router.post('/', auth, createPoem);
router.put('/:id', auth, updatePoem);
router.delete('/:id', auth, deletePoem);

// Like a poem (public)
router.post('/:id/like', async (req, res, next) => {
  try {
    await require('../controllers/poemController').likePoem(req, res);
  } catch (err) {
    next(err);
  }
});

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

// Like poem route
router.post('/:id/like', likePoem);

module.exports = router; 