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

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware cơ bản
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (isProduction) {
  app.use(helmet({ 
    contentSecurityPolicy: { 
      directives: { 
        defaultSrc: ["'self'"], 
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://cdn.jsdelivr.net", "https://cdn.sheetjs.com", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'", "https://api.cloudinary.com", "https://shottyshop.onrender.com", "https://accounts.google.com"]
      } 
    } 
  }));
} else {
  app.use(morgan('dev'));
}

// Cấu hình CORS
const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'https://shottyshop.onrender.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Giới hạn lượt yêu cầu (Rate limiting)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', apiLimiter);

// Kết nối Cơ sở dữ liệu
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI && isProduction) {
  console.error('CRITICAL ERROR: MONGODB_URI environment variable is not defined!');
  process.exit(1);
}

mongoose.connect(mongoURI || 'mongodb://localhost:27017/shottyshop')
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });

// --- GIẢI PHÁP AN TOÀN: TỰ ĐỘNG KIỂM TRA VÀ NẠP ROUTER TRÁNH LÀM SẬP SERVER ---
const loadRouterSafely = (apiPath, routerModulePath) => {
  try {
    const routerModule = require(routerModulePath);
    // Kiểm tra xem module được export ra có phải là một hàm middleware hợp lệ của Express không
    if (typeof routerModule === 'function' || (routerModule && typeof routerModule.use === 'function')) {
      app.use(apiPath, routerModule);
    } else {
      console.error(`🚨 CẢNH BÁO ROUTER: File "${routerModulePath}" export sai định dạng (Cần xuất module.exports = router). Bỏ qua để tránh sập server.`);
    }
  } catch (error) {
    console.error(`🚨 LỖI NẠP FILE: Không thể load file "${routerModulePath}". Chi tiết lỗi:`, error.message);
  }
};

// Thực hiện nạp an toàn từng router một
loadRouterSafely('/api/users', './routes/users');
loadRouterSafely('/api/products', './routes/products');
loadRouterSafely('/api/banners', './routes/banners');
loadRouterSafely('/api/orders', './routes/orders');
loadRouterSafely('/api/coupons', './routes/coupons');
loadRouterSafely('/api/carts', './routes/carts');
loadRouterSafely('/api/reviews', './routes/reviews');
loadRouterSafely('/api/categories', './routes/categories');
loadRouterSafely('/api/auth', './routes/auth');
loadRouterSafely('/api/upload', './routes/upload');
loadRouterSafely('/api/wishlist', './routes/wishlist');
loadRouterSafely('/api/posts', './routes/post');
loadRouterSafely('/api/notifications', './routes/notifications');

// --- XỬ LÝ ĐƯỜNG DẪN STATIC FILE & FRONTEND ---
const uploadsPath = path.join(__dirname, '..', 'image');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/image', express.static(uploadsPath));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, {
  maxAge: isProduction ? '1d' : 0,
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('*', (req, res) => { 
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' }); 
  const indexPath = path.join(frontendPath, 'index.html'); 
  if (fs.existsSync(indexPath)) res.sendFile(indexPath); 
  else res.status(404).send('Page not found'); 
});

// Điều hướng lỗi
app.use((req, res) => { 
  if (req.path.startsWith('/api/')) res.status(404).json({ error: 'API endpoint not found' }); 
  else res.status(404).sendFile(path.join(frontendPath, '404.html'), err => { if (err) res.status(404).send('Page not found'); }); 
});

app.use((err, req, res, next) => { 
  console.error('Server error:', err.message); 
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max size: 50MB' }); 
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message }); 
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' }); 
  res.status(err.status || 500).json({ error: isProduction ? 'Internal server error' : err.message }); 
});

app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`); 
});