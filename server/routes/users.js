const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { toggleFavorite, getFavorites } = require('../controllers/userController');

// Protected routes - require authentication
router.post('/:id/favorites', auth, toggleFavorite);
router.get('/:id/favorites', auth, getFavorites);

module.exports = router;
