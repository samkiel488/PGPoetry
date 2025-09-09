const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  poemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poem',
    required: [true, 'Poem ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
commentSchema.index({ poemId: 1, createdAt: -1 });

// Virtual for populated user data
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
