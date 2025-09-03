const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/authController');

// Public: register a new user
router.post('/register', register);

// Public: login with username or email (identifier) + password
router.post('/login', login);

// Public: exchange refresh token for a new access token
router.post('/refresh', refresh);

// Public: invalidate refresh token (logout)
router.post('/logout', logout);

module.exports = router;