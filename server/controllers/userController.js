const User = require('../models/User');
const Poem = require('../models/Poem');

// Toggle favorite for a user
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { poemId } = req.body;

    if (!poemId) {
      return res.status(400).json({ message: 'Poem ID is required' });
    }

    // Ensure user can only modify their own favorites
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const poem = await Poem.findById(poemId);
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    const index = user.favorites.indexOf(poemId);
    let isFavorited = false;

    if (index > -1) {
      // Remove from favorites
      user.favorites.splice(index, 1);
    } else {
      // Add to favorites
      user.favorites.push(poemId);
      isFavorited = true;
    }

    await user.save();

    res.json({ isFavorited, favorites: user.favorites });
  } catch (error) {
    console.error('toggleFavorite error:', error);
    res.status(500).json({ message: 'Error toggling favorite' });
  }
};

// Get user's favorite poems
const getFavorites = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure user can only view their own favorites
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(id).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.favorites);
  } catch (error) {
    console.error('getFavorites error:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites
};
