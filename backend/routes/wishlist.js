const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

// Helper: Get or create wishlist
async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId, items: [] });
    await wishlist.save();
  }
  return wishlist;
}

// GET /api/wishlist - Get user's wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    await wishlist.populate('items.productId');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wishlist/add - Add product to wishlist
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    let wishlist = await getOrCreateWishlist(req.user.id);
    const exists = wishlist.items.some(item => item.productId.toString() === productId);
    if (exists) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    wishlist.items.push({ productId });
    await wishlist.save();
    await wishlist.populate('items.productId');
    
    res.json({ success: true, message: 'Added to wishlist', wishlist, count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/wishlist/remove/:productId - Remove from wishlist
router.delete('/remove/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    
    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
    await wishlist.save();
    await wishlist.populate('items.productId');
    
    res.json({ success: true, message: 'Removed from wishlist', wishlist, count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    const isInWishlist = wishlist ? wishlist.items.some(item => item.productId.toString() === productId) : false;
    res.json({ isInWishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/wishlist/clear - Clear entire wishlist
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ userId: req.user.id });
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;