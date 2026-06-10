const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/email');
const { createNotification } = require('./notifications');

const router = express.Router();

function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// [STAFF/ADMIN] Lấy tất cả đơn hàng
router.get('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    const sortOption = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const [orders, total] = await Promise.all([
      Order.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Order.countDocuments(query)
    ]);
    res.json({ orders, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total, itemsPerPage: limitNum } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Thống kê
router.get('/stats/summary', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const [totalOrders, totalRevenue, pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders, todayOrders, weekOrders, monthOrders] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      Order.countDocuments({ createdAt: { $gte: monthAgo } })
    ]);
    res.json({ totalOrders, totalRevenue: totalRevenue[0]?.total || 0, pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders, todayOrders, weekOrders, monthOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Doanh thu theo thời gian
router.get('/stats/revenue', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    let result;
    if (period === 'month') {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (period === 'week') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0,0,0,0);
      result = await Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]);
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = await Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: { $dayOfMonth: '$createdAt' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Lấy đơn hàng của user
router.get('/user/:userId', verifyToken, async (req, res) => {
  if (req.user.id !== req.params.userId && req.user.role === 'customer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Chi tiết đơn hàng
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'customer' && order.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [USER] Tạo đơn hàng
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, total, couponApplied, discountAmount, customerName, customerEmail, customerPhone } = req.body;
    
    // Lấy thông tin từ req.body hoặc req.user
    const finalCustomerName = customerName || req.user?.name || 'Customer';
    const finalCustomerEmail = customerEmail || req.user?.email || 'customer@example.com';
    const finalCustomerPhone = customerPhone || '';
    
    if (!items?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    if (!shippingAddress?.street) {
      return res.status(400).json({ error: 'Missing shipping address' });
    }
    
    // Kiểm tra stock
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `${product.name} only has ${product.stock} left` });
      }
    }
    
    // Tính totalAmount nếu không có
    const calculatedTotal = total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = calculatedTotal - (discountAmount || 0);
    
    // Trừ stock
    for (let item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }
    
    const order = new Order({
      orderId: generateOrderId(),
      userId: req.user.id,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      customerPhone: finalCustomerPhone,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      totalAmount: calculatedTotal,
      total: finalTotal < 0 ? 0 : finalTotal,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city || '',
        district: shippingAddress.district || '',
        postalCode: shippingAddress.postalCode || '',
        address: shippingAddress.street
      },
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      discountAmount: discountAmount || 0,
      couponApplied: couponApplied || null,
      date: new Date()
    });
    
    await order.save();

    // Trả response NGAY khi đã lưu đơn -> thanh toán nhanh, không bắt người dùng chờ email
    res.status(201).json(order);

    // Gửi email xác nhận + thông báo CHẠY NỀN (không chặn response, SMTP có thể mất vài giây)
    sendOrderConfirmation(order, finalCustomerEmail).catch(emailErr => console.error('Email error:', emailErr.message));
    createNotification(req.user.id, 'order', '🛒 Đơn hàng mới', `Đơn hàng #${order.orderId} đã được tạo thành công`, { orderId: order._id }).catch(notifErr => console.error('Notification error:', notifErr.message));
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// [USER] Khách xác nhận đã thanh toán (chuyển khoản / momo) cho đơn của chính mình
router.patch('/:id/confirm-payment', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId?.toString() !== req.user.id && req.user.role === 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }
    order.paymentStatus = 'paid';
    await order.save();
    try {
      await createNotification(order.userId, 'order', 'Đã ghi nhận thanh toán', `Đơn #${order.orderId} đã được đánh dấu đã thanh toán, đang chờ xác nhận.`, { orderId: order._id });
    } catch (e) {}
    res.json({ message: 'Payment confirmed', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Cập nhật trạng thái đơn hàng
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const updateData = { updatedAt: Date.now() };
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (status === 'cancelled') {
      for (let item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }
    
    // Gửi thông báo khi có thay đổi trạng thái
    if (order.userId && status && status !== order.status) {
      let statusMessage = '';
      switch (status) {
        case 'processing': statusMessage = 'Đơn hàng đang được xử lý'; break;
        case 'shipped': statusMessage = 'Đơn hàng đã được giao cho vận chuyển'; break;
        case 'delivered': statusMessage = 'Đơn hàng đã giao thành công'; break;
        case 'cancelled': statusMessage = 'Đơn hàng đã bị hủy'; break;
        default: statusMessage = `Trạng thái đơn hàng: ${status}`;
      }
      await createNotification(order.userId, 'order', `Cập nhật đơn hàng #${order.orderId || order._id.toString().slice(-8)}`, statusMessage, { orderId: order._id, status });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [STAFF/ADMIN] Cập nhật tracking number
router.patch('/:id/tracking', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    if (!trackingNumber) return res.status(400).json({ error: 'Tracking number is required' });
    const order = await Order.findByIdAndUpdate(req.params.id, { trackingNumber, updatedAt: Date.now() }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [ADMIN] Xóa đơn hàng
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public track order
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ orderId: order.orderId, status: order.status, date: order.createdAt, total: order.total, customerName: order.customerName, trackingNumber: order.trackingNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;