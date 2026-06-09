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

// GET /api/posts/slug/:slug - Lấy chi tiết bài viết theo slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.views = (post.views || 0) + 1;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STAFF/ADMIN ROUTES ====================\

// GET /api/posts/admin - Quản lý tất cả bài viết
router.get('/admin', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - Tạo bài viết mới
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { title, content, category, excerpt, image, featuredImage, images, tags, status, videoLinks, socialLinks } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and Content are required' });
    let baseSlug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const existingPosts = await Post.find({ slug: new RegExp(`^${baseSlug}`) }, 'slug');
    const existingSlugs = existingPosts.map(p => p.slug);
    const slug = generateUniqueSlug(baseSlug, existingSlugs);
    const postData = { title, content, category, excerpt, featuredImage: featuredImage || image || '', images: images || [], videoLinks: videoLinks || [], socialLinks: socialLinks || {}, tags: tags || [], status, slug, author: req.user.name || 'Admin', authorId: req.user.id || req.user._id };
    if (status === 'published') postData.publishedAt = new Date();
    const post = new Post(postData);
    await post.save();
    if (status === 'published') {
      const users = await User.find({ role: { $ne: 'admin' } }, '_id');
      const userIds = users.map(u => u._id);
      await createBulkNotification(userIds, 'post', `Bài viết mới: ${title}`, (excerpt || content).substring(0, 100), { slug, postId: post._id });
    }
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/posts/:id - Cập nhật bài viết
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { title, content, category, excerpt, image, featuredImage, images, tags, status, videoLinks, socialLinks } = req.body;
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) return res.status(404).json({ error: 'Post not found' });
    const updateData = { title, content, category, excerpt, tags, status, updatedAt: Date.now() };
    if (featuredImage !== undefined || image !== undefined) updateData.featuredImage = featuredImage !== undefined ? featuredImage : image;
    if (images !== undefined) updateData.images = images;
    if (videoLinks !== undefined) updateData.videoLinks = videoLinks;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    let wasPublished = false;
    if (existingPost.status !== 'published' && status === 'published') {
      updateData.publishedAt = new Date();
      wasPublished = true;
    }
    const post = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (wasPublished) {
      const users = await User.find({ role: { $ne: 'admin' } }, '_id');
      const userIds = users.map(u => u._id);
      await createBulkNotification(userIds, 'post', `Bài viết mới: ${post.title}`, (post.excerpt || post.content).substring(0, 100), { slug: post.slug, postId: post._id });
    }
    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
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