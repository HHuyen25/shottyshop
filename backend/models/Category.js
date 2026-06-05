const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  description: { 
    type: String, 
    default: '' 
  },
  icon: { 
    type: String, 
    default: '' 
  },
  image: {
    type: String,
    default: ''
  },
  order: { 
    type: Number, 
    default: 0 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo slug tự động trước khi save
categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  next();
});

// Phương thức lấy danh sách sản phẩm theo category
categorySchema.methods.getProducts = async function() {
  const Product = mongoose.model('Product');
  return await Product.find({ category: this.name });
};

// Static method lấy category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find().sort({ order: 1 });
  const categoryMap = {};
  const roots = [];
  
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat.toObject(), children: [] };
  });
  
  categories.forEach(cat => {
    if (cat.parentCategory && categoryMap[cat.parentCategory]) {
      categoryMap[cat.parentCategory].children.push(categoryMap[cat._id]);
    } else {
      roots.push(categoryMap[cat._id]);
    }
  });
  
  return roots;
};

module.exports = mongoose.model('Category', categorySchema);