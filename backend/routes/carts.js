const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Helper: lấy hoặc tạo giỏ hàng cho user
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [], total: 0 });
    await cart.save();
  }
  return cart;
}

// Helper: tính tổng tiền giỏ hàng
function calculateTotal(items) {
  return items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
}

// Helper: kiểm tra stock và cập nhật thông tin sản phẩm
async function validateAndUpdateItems(items) {
  const updatedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.name || item.productId} not found`);
    }
    
    // Kiểm tra stock
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} only has ${product.stock} left in stock`);
    }
    
    updatedItems.push({
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image
    });
  }
  return updatedItems;
}

// ==================== USER ROUTES ====================

// [USER] Lấy giỏ hàng của chính mình
router.get('/', verifyToken, async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user.id);
    
    // Populate product info để đảm bảo thông tin mới nhất
    const populatedCart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId', 'name price image stock');
    
    res.json(populatedCart || cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Lấy số lượng item trong giỏ
router.get('/count', verifyToken, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Lấy giỏ hàng theo userId (kiểm tra quyền)
router.get('/:userId', verifyToken, async (req, res) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const cart = await getOrCreateCart(req.params.userId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Thêm item vào giỏ (hoặc cập nhật số lượng)
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Only ${product.stock} left in stock for ${product.name}`
      });
    }
    
    let cart = await getOrCreateCart(req.user.id);
    
    const existingIndex = cart.items.findIndex(
      i => i.productId.toString() === productId
    );
    
    if (existingIndex !== -1) {
      // Cập nhật số lượng
      const newQuantity = cart.items[existingIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          error: `Cannot add ${quantity} more. Only ${product.stock - cart.items[existingIndex].quantity} left.`
        });
      }
      cart.items[existingIndex].quantity = newQuantity;
    } else {
      // Thêm mới
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      });
    }
    
    cart.total = calculateTotal(cart.items);
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.json(cart);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// [USER] Cập nhật số lượng sản phẩm trong giỏ
router.put('/update/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let cart = await getOrCreateCart(req.user.id);
    const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    if (quantity === 0) {
      // Xóa item
      cart.items.splice(itemIndex, 1);
    } else {
      if (product.stock < quantity) {
        return res.status(400).json({ 
          error: `Only ${product.stock} left in stock`
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }
    
    cart.total = calculateTotal(cart.items);
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Xóa item khỏi giỏ
router.delete('/remove/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await getOrCreateCart(req.user.id);
    
    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    cart.total = calculateTotal(cart.items);
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Sync giỏ hàng từ localStorage lên server
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items data' });
    }
    
    // Validate và cập nhật thông tin sản phẩm
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (product && product.stock > 0) {
        const quantity = Math.min(item.quantity || 1, product.stock);
        validatedItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.image
        });
      }
    }
    
    let cart = await getOrCreateCart(req.user.id);
    cart.items = validatedItems;
    cart.total = calculateTotal(validatedItems);
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Xóa toàn bộ giỏ hàng
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    cart.total = 0;
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.json({ message: 'Cart cleared successfully', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
