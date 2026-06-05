const express = require('express');
const Coupon = require('../models/Coupon');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: Kiểm tra coupon có còn hiệu lực không
async function isCouponValid(coupon, cartTotal = 0) {
  if (!coupon.active) return { valid: false, message: 'Coupon is inactive' };
  
  // Kiểm tra hết hạn
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  // Kiểm tra số lần sử dụng
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Kiểm tra min order
  if (coupon.minOrder && cartTotal < coupon.minOrder) {
    return { 
      valid: false, 
      message: `Minimum order of ${coupon.minOrder} required (current: ${cartTotal})` 
    };
  }
  
  return { valid: true };
}

// Helper: Tính discount
function calculateDiscount(coupon, cartTotal) {
  let discount = 0;
  if (coupon.discountType === 'percentage' || coupon.discountType === 'percent') {
    discount = (cartTotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }
  
  // Giới hạn discount không vượt quá cartTotal
  if (discount > cartTotal) discount = cartTotal;
  
  // Làm tròn đến 2 chữ số thập phân
  return Math.round(discount * 100) / 100;
}

// ==================== PUBLIC ROUTES ====================

// [PUBLIC] Validate coupon (dùng trong checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Missing coupon code' });
    }
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.json({ valid: false, message: 'Coupon not found' });
    }
    
    const validation = await isCouponValid(coupon, cartTotal || 0);
    if (!validation.valid) {
      return res.json(validation);
    }
    
    const discount = calculateDiscount(coupon, cartTotal || 0);
    
    res.json({
      valid: true,
      discount,
      discountValue: coupon.discountValue,
      discountType: coupon.discountType,
      message: `Coupon applied! You saved ${discount}`,
      couponId: coupon._id
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// [PUBLIC] Get all active coupons (cho frontend hiển thị)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      $or: [{ expiry: { $gte: now } }, { expiry: null }]
    }).limit(10).sort({ createdAt: -1 });
    
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [PUBLIC] Get coupon by code (public info only)
router.get('/by-code/:code', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    const validation = await isCouponValid(coupon);
    
    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrder: coupon.minOrder,
      isValid: validation.valid,
      message: validation.message
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN/STAFF ROUTES ====================

// [STAFF/ADMIN] Get all coupons
router.get('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Get single coupon
router.get('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Create coupon
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrder, usageLimit, expiry, active } = req.body;
    
    // Validation
    if (!code || !discountValue) {
      return res.status(400).json({ error: 'Code and discount value are required' });
    }
    if (discountValue <= 0) {
      return res.status(400).json({ error: 'Discount value must be greater than 0' });
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
    }
    
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      minOrder: minOrder || 0,
      usageLimit: usageLimit || null,
      expiry: expiry || null,
      active: active !== false,
      usedCount: 0
    });
    
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Update coupon
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrder, usageLimit, expiry, active } = req.body;
    
    // Validation
    if (discountValue !== undefined && discountValue <= 0) {
      return res.status(400).json({ error: 'Discount value must be greater than 0' });
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
    }
    
    const updateData = {
      updatedAt: Date.now()
    };
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minOrder !== undefined) updateData.minOrder = minOrder;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (expiry !== undefined) updateData.expiry = expiry;
    if (active !== undefined) updateData.active = active;
    
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Delete coupon
router.delete('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Increment used count (khi áp dụng thành công)
router.post('/:id/use', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await coupon.save();
    
    res.json({ usedCount: coupon.usedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Bulk delete expired coupons
router.delete('/expired/bulk', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const result = await Coupon.deleteMany({
      expiry: { $lt: new Date() },
      active: true
    });
    
    res.json({ 
      message: `Deleted ${result.deletedCount} expired coupons`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;