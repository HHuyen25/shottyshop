const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '7d';   // ĐÃ SỬA: 15m -> 7d
const REFRESH_TOKEN_EXPIRY = '30d';

// Store refresh tokens (trong production nên dùng Redis)
let refreshTokens = [];

// Tạo access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Tạo refresh token
const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    { id: user._id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  refreshTokens.push(refreshToken);
  return refreshToken;
};

// Xác thực access token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Refresh token middleware
const refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }
  
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    // Tìm user từ decoded.id (cần import User model)
    // Ở đây tạm thời trả về token mới dựa trên thông tin cũ
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    // Xóa refresh token hết hạn
    refreshTokens = refreshTokens.filter(t => t !== refreshToken);
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Logout - xóa refresh token
const logout = (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens = refreshTokens.filter(t => t !== refreshToken);
  }
  res.json({ message: 'Logged out successfully' });
};

// Kiểm tra admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// Kiểm tra staff hoặc admin
const isStaffOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Staff or Admin access required.' });
  }
  next();
};

// Rate limiting cho auth (dùng simple implementation)
const authRateLimit = new Map();

const rateLimitAuth = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 phút
  const maxRequests = 10; // tối đa 10 lần
  
  if (!authRateLimit.has(ip)) {
    authRateLimit.set(ip, { count: 1, firstRequest: now });
    return next();
  }
  
  const data = authRateLimit.get(ip);
  if (now - data.firstRequest > windowMs) {
    // Reset sau windowMs
    authRateLimit.set(ip, { count: 1, firstRequest: now });
    return next();
  }
  
  if (data.count >= maxRequests) {
    return res.status(429).json({ 
      message: 'Too many authentication attempts. Please try again later.' 
    });
  }
  
  data.count++;
  authRateLimit.set(ip, data);
  next();
};

module.exports = { 
  verifyToken, 
  isAdmin, 
  isStaffOrAdmin,
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  logout,
  rateLimitAuth
};