const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post('/login', loginLimiter, login);

module.exports = router; 