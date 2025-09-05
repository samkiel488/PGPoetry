require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { getOrCreateOgImage } = require('./utils/imageGenerator');

const authRoutes = require('./routes/auth');
const poemRoutes = require('./routes/poems');
const userRoutes = require('./routes/users');
const Poem = require('./models/Poem');
const { generateMetaTags } = require('./utils/seoUtils');

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
  imgSrc: ["'self'", 'data:', 'blob:'],
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
// Disabled rate limiting for testing purposes
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files - Updated for Render deployment
app.use(express.static(path.join(__dirname, '..', 'client')));
// Serve admin static under the /admin path so requests like /admin/dashboard.html resolve
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// Serve root-level css folder so requests to /css/* resolve when CSS is stored at project-root/css
app.use('/css', express.static(path.join(__dirname, '..', 'css')));

// Serve images directory so uploaded thumbnails and project images are available at /images/*
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/poems', poemRoutes);
app.use('/api/users', userRoutes);

// Simple authenticated user info endpoint
app.get('/api/me', require('./middleware/auth'), (req, res) => {
  // req.user is attached by the auth middleware and excludes sensitive fields
  res.json({ user: req.user });
});

// Serve client pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.get('/poems', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'poems.html'));
});


// Serve poem.html for both /poem/:slug and /poems/:slug with SEO meta injection
app.get(['/poem/:slug', '/poems/:slug'], async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).send('Invalid poem slug');
    }

    // If MongoDB is not connected, serve static page without server-side meta injection
    if (mongoose.connection.readyState !== 1) {
      console.warn('Database not connected — serving static poem page without injected metadata');
      return res.sendFile(path.join(__dirname, '..', 'client', 'poem.html'));
    }

    const poem = await Poem.findOne({ slug }).lean();
    if (!poem) {
      return res.status(404).sendFile(path.join(__dirname, '..', 'client', '404.html'));
    }

    const templatePath = path.join(__dirname, '..', 'client', 'poem.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    const meta = generateMetaTags(poem, req);
    if (html.indexOf('<!-- SEO_META -->') !== -1) {
      html = html.replace('<!-- SEO_META -->', meta);
    } else {
      html = html.replace('</head>', meta + '\n</head>');
    }

    res.send(html);
  } catch (error) {
    console.error('Error rendering poem page:', error);
    // fallback to static file
    res.sendFile(path.join(__dirname, '..', 'client', 'poem.html'));
  }
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

// Dynamic OG image generator (SVG) or redirect to existing thumbnail
app.get('/og-image/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const poem = await Poem.findOne({ slug }).lean();
    // If poem has a configured thumbnail/featuredImage, redirect to it
    const imageField = poem && (poem.thumbnail || poem.featuredImage || poem.image);
    if (imageField) {
      // Build absolute URL if needed
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const imgUrl = imageField.startsWith('http') ? imageField : `${proto}://${host}${imageField.startsWith('/') ? imageField : '/' + imageField}`;
      return res.redirect(imgUrl);
    }

    // Use node-canvas generator to create a PNG and serve it
    try {
      const imgPath = await getOrCreateOgImage(slug, poem && poem.title);
      const stat = fs.statSync(imgPath);
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', stat.size);
      res.set('Cache-Control', 'public, max-age=86400');
      const stream = fs.createReadStream(imgPath);
      stream.pipe(res);
      return;
    } catch (genErr) {
      console.error('Image generator error', genErr);
    }

    // Fallback SVG if generator fails
    const title = (poem && poem.title) ? poem.title : (process.env.SITE_NAME || "PG'sPoeticPen");
    const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#374151" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="48" fill="#fff">${safeTitle}</text>
      <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="'Source Sans Pro', sans-serif" font-size="20" fill="#d1d5db">${process.env.SITE_NAME || "PG'sPoeticPen"}</text>
    </svg>`;

    res.set('Content-Type', 'image/svg+xml');
    // Cache for a short time so social crawlers can fetch again if updated
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    console.error('OG image generation error', error);
    res.status(500).send('');
  }
});

// Connect to MongoDB and start server with retry and fallback logic
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const connectWithRetry = async (attempt = 1) => {
  const maxAttempts = 3;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // tight server selection timeout to fail fast and allow fallback/retries
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');
    console.log('Server is Now Live🙌🙌');
    startServer();
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Handle DNS SRV/TXT timeouts (common with blocked DNS lookups for Atlas SRV records)
    const isDnsSrvTimeout = (error && (error.code === 'ETIMEOUT') && (error.syscall === 'querySrv' || error.syscall === 'queryTxt')) || (error && error.message && error.message.includes('querySrv'));
    if (isDnsSrvTimeout) {
      console.error('Detected DNS SRV/TXT timeout. This often means SRV DNS queries are blocked by the network or the environment cannot resolve SRV records for Atlas clusters.');

      if (process.env.MONGODB_URI_FALLBACK) {
        console.log('Attempting fallback connection using MONGODB_URI_FALLBACK');
        try {
          await mongoose.connect(process.env.MONGODB_URI_FALLBACK, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
          });
          console.log('MongoDB connected using fallback URI');
          console.log('Server is Now Live🙌🙌');
          startServer();
          return;
        } catch (fallbackErr) {
          console.error('Fallback connection failed:', fallbackErr);
        }
      } else {
        console.error('No MONGODB_URI_FALLBACK provided. To fix: either allow SRV DNS resolution or provide a standard connection string in MONGODB_URI_FALLBACK in your .env');
      }
    }

    if (attempt < maxAttempts) {
      const delay = 2000 * attempt;
      console.log(`Retrying MongoDB connection in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts. Starting server without DB connection (read-only static pages).');
      startServer();
    }
  }
};

connectWithRetry();

// 404 handler for unknown routes (must be after all other routes)
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'client', '404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});