const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllPoems,
  getPoemBySlug,
  createPoem,
  updatePoem,
  deletePoem
} = require('../controllers/poemController');

// Public routes
router.get('/', getAllPoems);
router.get('/:slug', getPoemBySlug);

// Protected routes (admin only)
router.post('/', auth, createPoem);
router.put('/:id', auth, updatePoem);
router.delete('/:id', auth, deletePoem);

module.exports = router; 