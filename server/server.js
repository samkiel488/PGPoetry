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
// Configure trust proxy in a safe, configurable way.
// Do NOT set this to the boolean `true` in production unless you understand the implications.
// Set environment variable TRUST_PROXY to a specific value when needed (e.g. 'loopback', '127.0.0.1', 'uniquelocal', or a number of hops like '1').
const trustProxyEnv = process.env.TRUST_PROXY;
if (typeof trustProxyEnv !== 'undefined' && trustProxyEnv !== '') {
  // Use the explicit value provided by the environment
  app.set('trust proxy', trustProxyEnv);
  console.log(`Express trust proxy set from TRUST_PROXY=${trustProxyEnv}`);
} else {
  // Default to loopback (safer than `true`) for local development
  app.set('trust proxy', 'loopback');
}
const PORT = process.env.PORT || 3000;

// Security middleware
// Use Helmet with a CSP that allows trusted CDNs for scripts/styles/fonts (izitoast, fontawesome, google fonts)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://localhost:3000', 'http://localhost:3000', 'https://*'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.use(cors());

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files - Updated for Render deployment
app.use(express.static(path.join(__dirname, '..', 'client')));
// Serve admin static under the /admin path so requests like /admin/dashboard.html resolve
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// Serve root-level css folder so requests to /css/* resolve when CSS is stored at project-root/css
app.use('/css', express.static(path.join(__dirname, '..', 'css')));

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


// Serve poem.html for both /poem/:slug and /poems/:slug
app.get(['/poem/:slug', '/poems/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'poem.html'));
});

// Serve admin pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});
// Also serve /admin/dashboard.html explicitly to match browser requests that include the .html suffix
app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

// Serve admin analytics page (explicit routes so /admin/analytics.html works)
app.get('/admin/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'analytics.html'));
});
app.get('/admin/analytics.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'analytics.html'));
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Server is Now Live🙌🙌');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});


// 404 handler for unknown routes (must be after all other routes)
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'client', '404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});