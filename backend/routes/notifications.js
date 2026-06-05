const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// GET /api/notifications - Lấy danh sách thông báo của user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const query = { userId: req.user.id };
    if (unreadOnly === 'true') query.read = false;
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read - Đánh dấu một thông báo đã đọc
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notif) return res.status(404).json({ error: 'Not found' });
    notif.read = true;
    await notif.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read-all - Đánh dấu đọc tất cả thông báo
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions (Dùng nội bộ hệ thống)
async function createNotification(userId, type, title, message, data = {}) {
  const notif = new Notification({ userId, type, title, message, data });
  await notif.save();
  return notif;
}

async function createBulkNotification(userIds, type, title, message, data = {}) {
  if (!userIds || userIds.length === 0) return [];
  const notifs = userIds.map(userId => ({ userId, type, title, message, data }));
  return await Notification.insertMany(notifs);
}

// Xuất các hàm helper để các router khác có thể import sử dụng trực tiếp nếu cần
router.createNotification = createNotification;
router.createBulkNotification = createBulkNotification;

module.exports = router;