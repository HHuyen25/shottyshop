const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================\

// GET /api/categories - Lấy tất cả categories
router.get('/', async (req, res) => {
  try {
    const { activeOnly = true } = req.query;
    let query = {};
    if (activeOnly === 'true') query.isActive = true;
    
    const categories = await Category.find(query).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/categories/tree - Lấy category tree
router.get('/tree', async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/categories/:slug - Lấy category theo slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/categories/seed - Seed default categories (chỉ dùng cho dev)
router.post('/seed', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const defaultCategories = [
      { name: 'Album', icon: '', order: 1, description: 'Music albums from your favorite artists' },
      { name: 'Card', icon: '', order: 2, description: 'Official photocards and trading cards' },
      { name: 'Áo', icon: '', order: 3, description: 'Official merchandise clothing' },
      { name: 'Sản phẩm liên quan', icon: '', order: 4, description: 'Other related merchandise' }
    ];
    
    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create(cat);
      }
    }
    
    res.json({ message: 'Default categories seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;