const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, required: true },
  buttonText: { type: String, default: 'SHOP NOW' },
  buttonLink: { type: String, default: '#' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', bannerSchema);