const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percent', 'percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true }, // 10 for 10%, or 5 for $5
  minOrder: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  expiry: { type: Date, default: null }, // null = never expires
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);