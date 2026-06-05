const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================

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

// GET /api/categories/:id/products - Lấy sản phẩm theo category
router.get('/:id/products', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [products, total] = await Promise.all([
      Product.find({ category: category.name })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments({ category: category.name })
    ]);
    
    res.json({
      products,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        icon: category.icon
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// POST /api/categories - Tạo category mới
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { name, description, icon, image, order, parentCategory, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Kiểm tra trùng tên
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    
    const category = new Category({
      name,
      description: description || '',
      icon: icon || '',
      image: image || '',
      order: order || 0,
      parentCategory: parentCategory || null,
      isActive: isActive !== false
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/categories/:id - Cập nhật category
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { name, description, icon, image, order, parentCategory, isActive } = req.body;
    
    // Kiểm tra trùng tên (trừ chính nó)
    if (name) {
      const existing = await Category.findOne({ name, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }
    
    const updateData = {
      updatedAt: Date.now()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;
    if (parentCategory !== undefined) updateData.parentCategory = parentCategory || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/categories/:id - Xóa category
router.delete('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Kiểm tra xem có sản phẩm nào thuộc category này không
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productCount} products are using this category.` 
      });
    }
    
    // Kiểm tra category con
    const childCount = await Category.countDocuments({ parentCategory: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${childCount} sub-categories exist.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
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