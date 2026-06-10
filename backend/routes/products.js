const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const User = require('../models/User');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');
const { createBulkNotification } = require('./notifications');

const router = express.Router();

// ==================== CẤU HÌNH ====================
const CACHE_TTL = 30000; // 30 seconds cache
const productCache = new Map();

// Clear cache function
function clearProductCache() {
  productCache.clear();
  console.log('Product cache cleared');
}

// Get cached or fresh data
async function getCachedOrFresh(key, fetchFn, ttl = CACHE_TTL) {
  const cached = productCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  productCache.set(key, {
    data: JSON.parse(JSON.stringify(data)),
    timestamp: Date.now()
  });
  return data;
}

// ==================== CẤU HÌNH UPLOAD ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../image/products');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    uploadPath = path.join(uploadPath, String(year), String(month));
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const cleanName = file.originalname
      .replace(ext, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${unique}_${cleanName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP) hoặc video (MP4, MOV, WEBM)'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10
  },
  fileFilter
});

// ==================== SỬA RATE LIMIT - TĂNG GIỚI HẠN ====================
const rateLimitMap = new Map();

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // Tăng từ 30 lên 100 requests per minute
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const timestamps = rateLimitMap.get(ip).filter(t => t > now - windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  
  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      error: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
      retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000)
    });
  }
  
  next();
}

// Áp dụng rate limiting (chỉ khi production; dev không giới hạn để tránh 429 khi reload)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
router.use('/', (req, res, next) => {
  if (IS_PRODUCTION && req.method === 'GET' && !req.path.includes('/admin')) {
    rateLimitMiddleware(req, res, next);
  } else {
    next();
  }
});

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/products
 * Lấy danh sách sản phẩm
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      inStock,
      featured
    } = req.query;

    const cacheKey = JSON.stringify({ page, limit, search, category, minPrice, maxPrice, sort, inStock, featured });
    
    const data = await getCachedOrFresh(cacheKey, async () => {
      let query = {};
      
      if (search && search.trim()) {
        query.name = { $regex: search.trim(), $options: 'i' };
      }
      
      if (category && category !== 'all' && category !== 'undefined') {
        query.category = category;
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice && !isNaN(parseFloat(minPrice))) {
          query.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
          query.price.$lte = parseFloat(maxPrice);
        }
      }
      
      if (inStock === 'true') {
        query.stock = { $gt: 0 };
      }
      
      if (featured === 'true') {
        query.featured = true;
      }
      
      let sortOption = {};
      switch (sort) {
        case 'price_asc': sortOption = { price: 1 }; break;
        case 'price_desc': sortOption = { price: -1 }; break;
        case 'name_asc': sortOption = { name: 1 }; break;
        case 'name_desc': sortOption = { name: -1 }; break;
        case 'newest': sortOption = { createdAt: -1 }; break;
        case 'oldest': sortOption = { createdAt: 1 }; break;
        case 'popular': sortOption = { soldCount: -1 }; break;
        default: sortOption = { createdAt: -1 };
      }
      
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      
      const [products, total] = await Promise.all([
        Product.find(query)
          .select('-__v')
          .sort(sortOption)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(query)
      ]);
      
      const productsWithFullUrls = products.map(product => ({
        ...product,
        image: getFullImageUrl(product.image),
        images: (product.images || []).map(img => getFullImageUrl(img)),
        videoLinks: (product.videoLinks || []).map(v => getFullImageUrl(v))
      }));
      
      return {
        products: productsWithFullUrls,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        }
      };
    });
    
    res.json(data);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: 'Không thể tải danh sách sản phẩm' });
  }
});

/**
 * GET /api/products/:id
 * Lấy chi tiết sản phẩm
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID sản phẩm không hợp lệ' });
    }
    
    const cacheKey = `product_${id}`;
    const product = await getCachedOrFresh(cacheKey, async () => {
      const found = await Product.findById(id)
        .select('-__v')
        .lean();
      
      if (!found) return null;
      
      return {
        ...found,
        image: getFullImageUrl(found.image),
        images: (found.images || []).map(img => getFullImageUrl(img)),
        videoLinks: (found.videoLinks || []).map(v => getFullImageUrl(v))
      };
    }, 15000);
    
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    // Tăng lượt xem (non-blocking)
    Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(err => console.error('View count error:', err));
    
    res.json(product);
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ error: 'Không thể tải thông tin sản phẩm' });
  }
});

// ==================== STAFF/ADMIN: CRUD SẢN PHẨM ====================
const PRODUCT_FIELDS = ['name','price','salePrice','image','images','category','member','preorder','hanteo','stock','description','youtubeLink','videoLinks','specifications','featured','options'];

function pickProductFields(body) {
  const data = {};
  for (const f of PRODUCT_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  // videoLinks: chấp nhận chuỗi (mỗi dòng 1 link) hoặc mảng
  if (typeof data.videoLinks === 'string') {
    data.videoLinks = data.videoLinks.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  }
  return data;
}

// POST /api/products - tạo sản phẩm
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const data = pickProductFields(req.body);
    if (!data.name || data.price === undefined || data.price === null) {
      return res.status(400).json({ error: 'Tên và giá là bắt buộc' });
    }
    const product = await Product.create(data);
    clearProductCache();
    // Thông báo cho tất cả khách hàng về sản phẩm mới
    try {
      const users = await User.find({ role: 'customer' }, '_id');
      await createBulkNotification(
        users.map(u => u._id), 'product',
        `Sản phẩm mới: ${product.name}`,
        `Vừa lên kệ: "${product.name}" - khám phá ngay!`,
        { productId: product._id }
      );
    } catch (e) { console.error('Product notification error:', e.message); }
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Tên sản phẩm đã tồn tại' });
    console.error('POST /products error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id - cập nhật sản phẩm
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const data = pickProductFields(req.body);
    data.updatedAt = new Date();
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    clearProductCache();
    res.json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Tên sản phẩm đã tồn tại' });
    console.error('PUT /products error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id - xoá sản phẩm
router.delete('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    clearProductCache();
    res.json({ message: 'Đã xoá sản phẩm' });
  } catch (err) {
    console.error('DELETE /products error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper function
function getFullImageUrl(path) {
  if (!path) return null;
  // Bỏ host localhost/127.0.0.1 cũ (nếu có) -> trả ĐƯỜNG DẪN TƯƠNG ĐỐI để chạy đúng trên mọi domain (localhost lẫn hosting)
  path = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return path.replace('/uploads', '/image');
  if (path.startsWith('/image/')) return path;
  if (path.startsWith('image/')) return `/${path}`;
  if (path.startsWith('/')) return path;
  return `/image/products/${path}`;
}

module.exports = router;
module.exports.clearProductCache = clearProductCache;