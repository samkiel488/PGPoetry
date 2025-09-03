const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

function signAccessToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signRefreshToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ message: 'User with that email or username already exists' });

    const user = new User({ username, email, password });
    await user.save();

    // Sign tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('register error', err && err.message ? err.message : err);
    // Provide more specific feedback for common issues
    if (err.message && err.message.includes('JWT_SECRET')) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email
    if (!identifier || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.password) {
      console.warn('User has no password set', user._id);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let match = false;
    try {
      match = await user.comparePassword(password);
    } catch (cmpErr) {
      console.error('password compare failed', cmpErr);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Sign tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('login error', err && err.message ? err.message : err);
    if (err.message && err.message.includes('JWT_SECRET')) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });

    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('refresh error', err && err.message ? err.message : err);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });

    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('logout error', err && err.message ? err.message : err);
    res.status(400).json({ message: 'Logout failed' });
  }
};