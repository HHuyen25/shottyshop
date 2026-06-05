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

// ==================== PUBLIC ROUTES ====================

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
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const popularTags = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json({
      posts,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total, itemsPerPage: limitNum },
      categories: categories.map(c => ({ name: c._id, count: c.count })),
      popularTags: popularTags.map(t => ({ name: t._id, count: t.count }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/featured - Bài viết nổi bật
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const posts = await Post.find({ status: 'published' }).sort({ views: -1, likes: -1 }).limit(parseInt(limit)).select('title slug featuredImage excerpt views publishedAt');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/:slug - Chi tiết bài viết
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post || post.status !== 'published') return res.status(404).json({ error: 'Post not found' });
    await post.incrementViews();
    const relatedPosts = await Post.getRelatedPosts(post._id, post.category);
    const authorPosts = await Post.find({ author: post.author, _id: { $ne: post._id }, status: 'published' }).limit(3).select('title slug publishedAt');
    res.json({ ...post.toObject(), relatedPosts, authorPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts/:slug/comments - Thêm bình luận
router.post('/:slug/comments', async (req, res) => {
  try {
    const { userName, userEmail, content } = req.body;
    if (!userName || !userEmail || !content) return res.status(400).json({ error: 'All fields required' });
    if (!userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return res.status(400).json({ error: 'Invalid email' });
    if (content.length < 5) return res.status(400).json({ error: 'Comment too short (min 5 characters)' });
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ userName, userEmail, content, createdAt: new Date() });
    await post.save();
    res.status(201).json({ message: 'Comment added', comment: post.comments[post.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts/:id/like - Like bài viết
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.incrementLikes();
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN / STAFF ROUTES ====================

// GET /api/posts/admin/all - Lấy tất cả bài viết (kể cả draft)
router.get('/admin/all', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/admin/:id - Lấy bài viết theo ID (admin)
router.get('/admin/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - Tạo bài viết mới (admin/staff)
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, featuredImage, status, author, socialLinks, videoLinks } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
    // Tạo slug unique
    let baseSlug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existingSlugs = await Post.distinct('slug', { slug: new RegExp(`^${baseSlug}`) });
    const slug = generateUniqueSlug(baseSlug, existingSlugs);
    const postData = {
      title, slug, content,
      excerpt: excerpt || content.substring(0, 200),
      category: category || 'news',
      tags: tags || [],
      featuredImage: featuredImage || '',
      status: status || 'draft',
      author: author || req.user?.name || 'Admin',
      authorId: req.user?.id,
      socialLinks: socialLinks || {},
      videoLinks: Array.isArray(videoLinks) ? videoLinks : (typeof videoLinks === 'string' ? videoLinks.split(/[\n,]/).map(s => s.trim()).filter(Boolean) : [])
    };
    if (status === 'published') postData.publishedAt = new Date();
    const post = new Post(postData);
    await post.save();
    // Gửi thông báo nếu bài viết được publish ngay lập tức
    if (post.status === 'published') {
      const users = await User.find({ role: { $ne: 'admin' } }, '_id');
      const userIds = users.map(u => u._id);
      await createBulkNotification(userIds, 'post', `Bài viết mới: ${post.title}`, (post.excerpt || post.content).substring(0, 100), { slug: post.slug, postId: post._id });
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
    const { title, content, excerpt, category, tags, featuredImage, status, socialLinks, videoLinks } = req.body;
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) return res.status(404).json({ error: 'Post not found' });
    const updateData = {
      updatedAt: Date.now(),
      title: title || existingPost.title,
      content: content || existingPost.content,
      excerpt: excerpt || existingPost.excerpt,
      category: category || existingPost.category,
      tags: tags || existingPost.tags,
      featuredImage: featuredImage || existingPost.featuredImage,
      status: status || existingPost.status,
      socialLinks: socialLinks !== undefined ? socialLinks : existingPost.socialLinks,
      videoLinks: videoLinks !== undefined
        ? (Array.isArray(videoLinks) ? videoLinks : String(videoLinks).split(/[\n,]/).map(s => s.trim()).filter(Boolean))
        : existingPost.videoLinks
    };
    // Nếu title thay đổi, cập nhật slug
    if (title && title !== existingPost.title) {
      let baseSlug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existingSlugs = await Post.distinct('slug', { slug: new RegExp(`^${baseSlug}`), _id: { $ne: req.params.id } });
      updateData.slug = generateUniqueSlug(baseSlug, existingSlugs);
    }
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
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;