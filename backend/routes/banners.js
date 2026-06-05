const express = require('express');
const Banner = require('../models/Banner');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Cache cho banners
let bannersCache = null;
let bannersCacheTime = null;
const BANNERS_CACHE_TTL = 60000; // 60 seconds

// [PUBLIC] Lấy tất cả banner (cho slider) - có cache
router.get('/', async (req, res) => {
  try {
    // Check cache
    if (bannersCache && bannersCacheTime && Date.now() - bannersCacheTime < BANNERS_CACHE_TTL) {
      return res.json(bannersCache);
    }
    
    const banners = await Banner.find().sort({ order: 1 });
    bannersCache = banners;
    bannersCacheTime = Date.now();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [PUBLIC] Chỉ lấy banner đang active - có cache
router.get('/active', async (req, res) => {
  try {
    // Check cache
    if (bannersCache && bannersCacheTime && Date.now() - bannersCacheTime < BANNERS_CACHE_TTL) {
      const activeBanners = bannersCache.filter(b => b.active === true);
      return res.json(activeBanners);
    }
    
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    bannersCache = banners;
    bannersCacheTime = Date.now();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear cache khi có thay đổi
function clearBannersCache() {
  bannersCache = null;
  bannersCacheTime = null;
  console.log('Banners cache cleared');
}

// [STAFF/ADMIN] Tạo banner mới
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  const banner = new Banner(req.body);
  await banner.save();
  clearBannersCache();
  res.status(201).json(banner);
});

// [STAFF/ADMIN] Cập nhật banner
router.put('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  clearBannersCache();
  res.json(banner);
});

// [STAFF/ADMIN] Xóa banner
router.delete('/:id', verifyToken, isStaffOrAdmin, async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  clearBannersCache();
  res.status(204).end();
});

module.exports = router;