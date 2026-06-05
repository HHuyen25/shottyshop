const express = require('express');
const mongoose = require('mongoose');
const Review   = require('../models/Review');
const User     = require('../models/User');
const Product  = require('../models/Product');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── Helper: chuyển string → ObjectId an toàn ───
function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(id); }
  catch { return null; }
}

// ═══════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════

/**
 * GET /api/reviews/product/:productId
 * Lấy danh sách đánh giá của sản phẩm (có phân trang, lọc theo sao)
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 5, rating } = req.query;
    const { productId } = req.params;

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    // Build query
    const query = { productId };
    if (rating) query.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
      Review.countDocuments(query)
    ]);

    // Tính avgRating từ TOÀN BỘ reviews (không phải chỉ trang hiện tại)
    const allReviews = await Review.find({ productId }).select('rating');
    const avgRating = allReviews.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(r => { ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1; });

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages:  Math.ceil(total / limitNum),
        totalItems:  total,
        itemsPerPage: limitNum
      },
      stats: {
        averageRating:     parseFloat(avgRating.toFixed(2)),
        totalReviews:      allReviews.length,
        ratingDistribution
      }
    });
  } catch (err) {
    console.error('GET /reviews/product error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reviews/product/:productId/summary
 * Rating summary (dùng aggregate)
 */
router.get('/product/:productId/summary', async (req, res) => {
  try {
    const { productId } = req.params;
    const oid = toObjectId(productId);
    const total = await Review.countDocuments({ productId });

    if (total === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    const matchStage = oid
      ? { $match: { productId: oid } }
      : { $match: { productId } };

    const [ratings, avgResult] = await Promise.all([
      Review.aggregate([matchStage, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
      Review.aggregate([matchStage, { $group: { _id: null, avg: { $avg: '$rating' } } }])
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { ratingDistribution[r._id] = r.count; });

    res.json({
      averageRating: parseFloat((avgResult[0]?.avg || 0).toFixed(2)),
      totalReviews: total,
      ratingDistribution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// USER ROUTES (cần đăng nhập)
// ═══════════════════════════════════════════════

/**
 * POST /api/reviews
 * Tạo đánh giá mới (kèm ảnh/video URLs)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, rating, comment, mediaUrls } = req.body;

    // Validate
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'productId, rating và comment là bắt buộc' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }
    if (comment.trim().length < 5) {
      return res.status(400).json({ error: 'Nhận xét phải có ít nhất 5 ký tự' });
    }
    if (mediaUrls && !Array.isArray(mediaUrls)) {
      return res.status(400).json({ error: 'mediaUrls phải là mảng' });
    }
    if (mediaUrls && mediaUrls.length > 5) {
      return res.status(400).json({ error: 'Tối đa 5 file media' });
    }

    // Kiểm tra sản phẩm
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

    // Kiểm tra đã review chưa
    const existing = await Review.findOne({ productId, userId: req.user.id });
    if (existing) return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    const review = new Review({
      productId,
      userId:    req.user.id,
      userName:  user.name,
      rating:    parseInt(rating),
      comment:   comment.trim(),
      mediaUrls: mediaUrls || [],  // Lưu URLs ảnh/video
      date:      new Date()
    });

    await review.save();

    // Tính lại avg rating
    const oid = toObjectId(productId);
    const avgResult = oid
      ? await Review.aggregate([
          { $match: { productId: oid } },
          { $group: { _id: null, avg: { $avg: '$rating' } } }
        ])
      : [];

    res.status(201).json({
      review,
      message:       'Gửi đánh giá thành công',
      averageRating: parseFloat((avgResult[0]?.avg || 0).toFixed(2))
    });
  } catch (err) {
    console.error('POST /reviews error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/reviews/:id
 * Cập nhật đánh giá của chính mình
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { rating, comment, mediaUrls } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Bạn chỉ có thể sửa đánh giá của mình' });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }
    if (comment && comment.trim().length < 5) {
      return res.status(400).json({ error: 'Nhận xét phải có ít nhất 5 ký tự' });
    }
    if (mediaUrls && mediaUrls.length > 5) {
      return res.status(400).json({ error: 'Tối đa 5 file media' });
    }

    if (rating)     review.rating    = parseInt(rating);
    if (comment)    review.comment   = comment.trim();
    if (mediaUrls)  review.mediaUrls = mediaUrls;
    review.date = new Date();

    await review.save();
    res.json({ review, message: 'Cập nhật đánh giá thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/reviews/:id
 * Xoá đánh giá (user xoá của mình, admin xoá tất cả)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });

    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn chỉ có thể xoá đánh giá của mình' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá đánh giá' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reviews/my-reviews
 * Lấy đánh giá của chính mình
 */
router.get('/my-reviews', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.user.id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('productId', 'name images image price'),
      Review.countDocuments({ userId: req.user.id })
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages:  Math.ceil(total / limitNum),
        totalItems:  total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════

/**
 * GET /api/reviews/admin/all
 */
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, rating } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (rating)    query.rating    = parseInt(rating);

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('productId', 'name images image'),
      Review.countDocuments(query)
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages:  Math.ceil(total / limitNum),
        totalItems:  total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/reviews/admin/:id
 */
router.delete('/admin/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    res.json({ message: 'Admin đã xoá đánh giá' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/reviews/admin/product/:productId
 */
router.delete('/admin/product/:productId', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await Review.deleteMany({ productId: req.params.productId });
    res.json({
      message: `Đã xoá ${result.deletedCount} đánh giá của sản phẩm`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;