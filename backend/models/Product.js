const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0, default: null }, // Giá khuyến mãi
  image: { type: String, default: '' },
  images: [{ type: String }], // Hỗ trợ nhiều ảnh
  category: { 
    type: String, 
    enum: ['Album', 'Card', 'Áo', 'Sản phẩm liên quan'], 
    required: true,
    index: true
  },
  member: {
    type: String,
    enum: ['', 'OHYUL', 'RYUL', 'WOOJIN', 'LOUIS', 'GROUP'],
    default: '',
    index: true
  },
  preorder: { type: Boolean, default: false },
  hanteo: { type: Boolean, default: false },
  stock: { type: Number, default: 10, min: 0 },
  description: { type: String, default: '' },
  youtubeLink: { type: String, default: '' },
  videoLinks: [{ type: String }], // Link nhúng: YouTube, TikTok, Facebook, Zalo...
  specifications: {
    type: { type: String, default: '' },
    country: { type: String, default: '' },
    size: { type: String, default: '' },
    weight: { type: String, default: '' },
    material: { type: String, default: '' },
    brand: { type: String, default: '' }
  },
  // Phân loại kiểu Shopee: mỗi nhóm có tên + nhiều giá trị. VD: {name:'Size', values:['S','M','L']}
  options: [{
    name: { type: String, default: '' },
    values: [{ type: String }]
  }],
  featured: { type: Boolean, default: false }, // Sản phẩm nổi bật
  viewCount: { type: Number, default: 0 }, // Lượt xem
  soldCount: { type: Number, default: 0 }, // Số lượng đã bán
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: kiểm tra còn hàng không
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual: giá hiện tại (giá khuyến mãi hoặc giá gốc)
productSchema.virtual('currentPrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Index cho search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);