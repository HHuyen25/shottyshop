const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['order', 'system', 'post', 'promotion', 'product'], default: 'system' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);