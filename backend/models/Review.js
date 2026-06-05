const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, required: true },
  // MỚI: Ảnh và video kèm theo đánh giá
  mediaUrls: [{ type: String }],
  // Tiện ích
  likes:     { type: Number, default: 0 },
  verified:  { type: Boolean, default: false }, // đã mua sản phẩm
  date:      { type: Date, default: Date.now }
}, { timestamps: true });

// Index để query nhanh
reviewSchema.index({ productId: 1, date: -1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model('Review', reviewSchema);