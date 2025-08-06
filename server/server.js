require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const poemRoutes = require('./routes/poems');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/client', express.static('client'));
app.use('/admin/css', express.static('admin/css'));
app.use('/admin/js', express.static('admin/js'));
app.use('/css', express.static(path.join(__dirname, '..', 'client', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'client', 'js')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/poems', poemRoutes);

// Serve client pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.get('/poems', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'poems.html'));
});

app.get('/poem/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'poem.html'));
});

// Serve admin pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

// Note: If you add more /api/poems/* routes, place them BEFORE /api/poems/:slug to avoid route conflicts.
app.get('/api/poems/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'poem.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Server is Now Live🙌🙌');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Client: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
}); 