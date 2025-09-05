const Poem = require('../models/Poem');
const slugify = require('slugify');

// Get all poems (public)
const getAllPoems = async (req, res) => {
  try {
    const poems = await Poem.find().sort({ createdAt: -1 });
    res.json(poems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching poems' });
  }
};

// Get single poem by slug (public)
const getPoemBySlug = async (req, res) => {
  try {
    // Only match slug, not id
    if (!/^[a-z0-9-]+$/.test(req.params.slug)) {
      return res.status(400).json({ message: 'Invalid poem slug' });
    }
    const poem = await Poem.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    // Fetch related poems based on matching tags
    let relatedPoems = [];
    if (poem.tags && poem.tags.length > 0) {
      relatedPoems = await Poem.find({
        _id: { $ne: poem._id }, // Exclude current poem
        tags: { $in: poem.tags } // Match any tag
      })
      .sort({ views: -1, createdAt: -1 }) // Sort by views desc, then date desc
      .limit(5) // Limit to 5 suggestions
      .select('title slug tags featured thumbnail'); // Select only needed fields
    }

    res.json({
      ...poem.toObject(),
      relatedPoems
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching poem' });
  }
};

// Create new poem (admin only)
const createPoem = async (req, res) => {
  try {
    const { title, content, tags, featured } = req.body;
    
    const slug = slugify(title, { lower: true, strict: true });
    
    const poem = new Poem({
      title,
      slug,
      content,
      tags: tags || [],
      featured: featured || false
    });

    await poem.save();
    res.status(201).json(poem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A poem with this title already exists' });
    }
    res.status(500).json({ message: 'Error creating poem' });
  }
};

// Update poem (admin only)
const updatePoem = async (req, res) => {
  try {
    const { title, content, tags, featured } = req.body;
    // Find the poem first
    const poem = await Poem.findById(req.params.id);
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }
    if (title) {
      poem.title = title;
      poem.slug = slugify(title, { lower: true, strict: true });
    }
    if (content !== undefined) poem.content = content;
    if (tags !== undefined) poem.tags = tags;
    if (featured !== undefined) poem.featured = featured;
    await poem.save();
    res.json(poem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A poem with this title already exists' });
    }
    res.status(500).json({ message: 'Error updating poem' });
  }
};

// Delete poem (admin only)
const deletePoem = async (req, res) => {
  try {
    const poem = await Poem.findByIdAndDelete(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    res.json({ message: 'Poem deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poem' });
  }
};

const likePoem = async (req, res) => {
  try {
    const poem = await Poem.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }
    res.json({ likes: poem.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error liking poem' });
  }
};

// Get top liked poems (analytics)
const getTopLikedPoems = async (req, res) => {
  try {
    const poems = await Poem.find().sort({ likes: -1 }).limit(10);
    res.json(poems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top liked poems' });
  }
};

// Get top viewed poems (analytics)
const getTopViewedPoems = async (req, res) => {
  try {
    const poems = await Poem.find().sort({ views: -1 }).limit(10);
    res.json(poems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top viewed poems' });
  }
};

// RSS feed for all public poems
const getRSSFeed = async (req, res) => {
  try {
    const poems = await Poem.find().sort({ createdAt: -1 });
    let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>PGPoetry RSS</title><link>https://pgpoetry.com/</link><description>Latest poems from PGPoetry</description>`;
    poems.forEach(poem => {
      rss += `<item><title>${poem.title}</title><link>https://pgpoetry.com/poem/${poem.slug}</link><description>${poem.content.substring(0, 200)}</description><pubDate>${poem.createdAt.toUTCString()}</pubDate></item>`;
    });
    rss += `</channel></rss>`;
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    res.status(500).send('Error generating RSS feed');
  }
};

module.exports = {
  getAllPoems,
  getPoemBySlug,
  createPoem,
  updatePoem,
  deletePoem,
  likePoem,
  getTopLikedPoems,
  getTopViewedPoems,
  getRSSFeed
};
