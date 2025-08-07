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
    const poem = await Poem.findOne({ slug: req.params.slug });
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }
    res.json(poem);
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

module.exports = {
  getAllPoems,
  getPoemBySlug,
  createPoem,
  updatePoem,
  deletePoem
}; 