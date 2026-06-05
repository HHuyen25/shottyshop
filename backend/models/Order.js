const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      district: String,
      ward: String,
      street: String,
      postalCode: String
    },
    paymentMethod: { 
      type: String, 
      enum: ['cod', 'bank', 'momo', 'banking'], 
      default: 'cod' 
    },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    couponApplied: { type: String, default: null },
    notes: String,
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Tạo orderId tự động trước khi lưu
OrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);