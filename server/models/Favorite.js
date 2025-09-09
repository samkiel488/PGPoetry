const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  poemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poem',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only favorite a poem once
favoriteSchema.index({ userId: 1, poemId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
