const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');
const { createBulkNotification } = require('./notifications');

// Helper: tạo slug unique (nếu trùng)
function generateUniqueSlug(baseSlug, existingSlugs) {
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ==================== PUBLIC ROUTES ====================\

// GET /api/posts - Lấy danh sách bài viết (published)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, tag } = req.query;
    const query = { status: 'published' };
    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };
    if (tag) query.tags = tag;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const [posts, total] = await Promise.all([
      Post.find(query).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limitNum).select('-comments -content'),
      Post.countDocuments(query)
    ]);
    const categories = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({
      posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      categories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/posts/:id - Xóa bài viết
router.delete('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/stats/categories - Thống kê categories (public)
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;