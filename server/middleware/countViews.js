const Poem = require('../models/Poem');

// Middleware to increment views for a poem identified by :slug
// Attaches the updated poem to req.poem when found.
module.exports = async function countViews(req, res, next) {
  try {
    const slug = req.params.slug;
    if (!slug) return next();

    const poem = await Poem.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (poem) {
      req.poem = poem;
    }
  } catch (error) {
    // Don't block the request on analytics errors
    console.error('countViews middleware error:', error);
  }

  next();
};
