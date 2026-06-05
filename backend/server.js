require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const bannerRoutes = require('./routes/banners');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const cartRoutes = require('./routes/carts');
const reviewRoutes = require('./routes/reviews');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const wishlistRoutes = require('./routes/wishlist');
const postRoutes = require('./routes/post');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (isProduction) {
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://cdn.jsdelivr.net", "https://cdn.sheetjs.com", "https://apis.google.com", "https://cdnjs.cloudflare.com", "blob:"], scriptSrcElem: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://cdn.jsdelivr.net", "https://cdn.sheetjs.com", "https://apis.google.com", "https://cdnjs.cloudflare.com", "blob:"], scriptSrcAttr: ["'unsafe-inline'"], imgSrc: ["'self'", "data:", "blob:", "https:", "http:"], connectSrc: ["'self'", "https://accounts.google.com", "https://cdn.jsdelivr.net", "https://raw.githubusercontent.com"], styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"], styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"], fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"], mediaSrc: ["'self'", "data:", "blob:", "https:"], frameSrc: ["'self'", "https://accounts.google.com", "https://www.youtube.com", "https://www.google.com", "https://maps.google.com", "https://www.facebook.com", "https://www.tiktok.com"], objectSrc: ["'none'"] } }, crossOriginResourcePolicy: { policy: "cross-origin" } }));
} else {
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
}

app.use(morgan(isProduction ? 'combined' : 'dev'));
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) callback(null, true); else callback(new Error('Not allowed by CORS')); }, credentials: true }));

// ==================== SỬA RATE LIMIT - TĂNG GIỚI HẠN ====================
// Tăng từ 200 lên 500 requests mỗi 15 phút
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 1000 : 1000000, // Dev: gần như không giới hạn để khỏi 429 khi reload nhiều
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Áp dụng rate limit cho tất cả API routes (chỉ thực sự giới hạn khi production)
if (isProduction) {
  app.use('/api/', apiLimiter);
}

// Auth limiter - vẫn giữ thấp vì lý do bảo mật
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many authentication attempts. Please try again later.' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shottyshop';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('MongoDB connected')).catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });
process.on('SIGINT', async () => { await mongoose.disconnect(); console.log('MongoDB disconnected'); process.exit(0); });

// Static files
const imagePath = path.join(__dirname, '../image');
['products', 'banners', 'reviews', 'avatars', 'others', 'posts'].forEach(folder => { const folderPath = path.join(imagePath, folder); if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true }); });
app.use('/image', express.static(imagePath, { maxAge: '30d' }));
app.use('/uploads', express.static(imagePath, { maxAge: '30d' }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes.router);

app.get('/api/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString(), mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }); });

// ==================== LIVE RELOAD (chỉ dev) ====================
// Theo dõi thay đổi file frontend -> trình duyệt tự tải lại, không cần F5 thủ công
if (!isProduction) {
  let lastReload = Date.now();
  try {
    const watchDir = path.join(__dirname, '../frontend');
    fs.watch(watchDir, { recursive: true }, (evt, filename) => {
      if (filename && /\.(html|js|css)$/i.test(filename) && !String(filename).includes('node_modules')) {
        lastReload = Date.now();
      }
    });
    console.log('Live-reload: dang theo doi frontend/');
  } catch (e) { console.error('Live-reload watch error:', e.message); }
  app.get('/api/livereload', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ v: lastReload }); });
}

// Frontend — thử nhiều vị trí để chạy đúng dù cấu trúc repo/deploy khác nhau
const frontendCandidates = [
  path.join(__dirname, '../frontend'),
  path.join(__dirname, 'frontend'),
  path.join(__dirname, '../../frontend'),
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), '../frontend')
];
const frontendPath = frontendCandidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || frontendCandidates[0];
console.log('Frontend path:', frontendPath, '(tồn tại:', fs.existsSync(path.join(frontendPath, 'index.html')), ')');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath, {
    maxAge: isProduction ? '7d' : 0,
    setHeaders: (res, filePath) => {
      // Không cache HTML/JS để thay đổi code luôn được cập nhật ngay (tránh lỗi chạy bản cũ trong cache)
      if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
}
app.get('*', (req, res) => { if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' }); const indexPath = path.join(frontendPath, 'index.html'); if (fs.existsSync(indexPath)) res.sendFile(indexPath); else res.status(404).send('Page not found'); });

// Error handlers
app.use((req, res) => { if (req.path.startsWith('/api/')) res.status(404).json({ error: 'API endpoint not found' }); else res.status(404).sendFile(path.join(frontendPath, '404.html'), err => { if (err) res.status(404).send('Page not found'); }); });
app.use((err, req, res, next) => { console.error('Server error:', err.message); console.error(err.stack); if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max size: 50MB' }); if (err.name === 'ValidationError') return res.status(400).json({ error: err.message }); if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' }); res.status(err.status || 500).json({ error: isProduction ? 'Internal server error' : err.message }); });

app.listen(PORT, () => { console.log(`\n  ┌─────────────────────────────────────────────┐\n  │   SHOTTYSHOP Backend Server Started      │\n  │   Port: ${PORT}                            │\n  │   Environment: ${process.env.NODE_ENV || 'development'} │\n  │   Static: /image                          │\n  └─────────────────────────────────────────────┘\n  `); });
