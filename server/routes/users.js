const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { toggleFavorite, getFavorites } = require('../controllers/userController');

// Favorites routes - allow anonymous for toggling, require auth for getting
router.post('/:id/favorites', toggleFavorite); // Removed auth to allow anonymous favorites
router.get('/:id/favorites', auth, getFavorites);

module.exports = router;
