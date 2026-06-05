// backend/models/Post.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: '' },
  category: { type: String, default: 'news' },
  tags: [String],
  featuredImage: { type: String, default: '' },
  videoLinks: [{ type: String }], // Link nhúng video/bài viết: YouTube, TikTok, Facebook, Zalo...
  socialLinks: {
    facebook: { type: String, default: '' },
    zalo: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: String, default: 'Admin' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tăng views
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Tăng likes
postSchema.methods.incrementLikes = async function() {
  this.likes += 1;
  await this.save();
};

// Lấy bài viết liên quan cùng category
postSchema.statics.getRelatedPosts = async function(postId, category, limit = 3) {
  return this.find({ _id: { $ne: postId }, category, status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title slug featuredImage publishedAt');
};

module.exports = mongoose.model('Post', postSchema);