const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check against environment variables
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Admin password in .env should be a bcrypt hash
    const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login
}; 