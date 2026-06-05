const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// ==================== LOCAL AUTH ====================

// POST /api/auth/register - Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=fff`,
      provider: 'local'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(201).json({ user: userObj, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ user: userObj, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GOOGLE AUTH ====================

// GET /api/auth/google/config - trả Client ID cho frontend (để bật nút Google khi đã cấu hình)
router.get('/google/config', (req, res) => {
  const id = process.env.GOOGLE_CLIENT_ID || '';
  const enabled = !!id && !/^your-|^YOUR_/.test(id) && id.includes('.apps.googleusercontent.com');
  res.json({ enabled, clientId: enabled ? id : '' });
});

// POST /api/auth/google - Google OAuth
router.post('/google', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ error: 'Missing id_token' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = await bcrypt.hash(googleId + Date.now(), SALT_ROUNDS);
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: 'customer',
        avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=1a1a1a&color=fff`,
        provider: 'google'
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj, token });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// ==================== FORGOT / RESET PASSWORD ====================

// POST /api/auth/forgot-password - Gửi email reset password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Vì lý do bảo mật, không tiết lộ email có tồn tại hay không
      return res.json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }
    
    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 giờ
    
    // Lưu token vào database
    await PasswordReset.create({
      email: user.email,
      token: resetToken,
      expiresAt
    });
    
    // Gửi email
    await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({ 
      message: 'If your email is registered, you will receive a password reset link' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password - Đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Tìm token trong database
    const resetRequest = await PasswordReset.findOne({ token });
    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Kiểm tra token còn hiệu lực
    if (!resetRequest.isValid()) {
      return res.status(400).json({ error: 'Token has expired' });
    }
    
    // Tìm user
    const user = await User.findOne({ email: resetRequest.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Cập nhật mật khẩu
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    user.updatedAt = Date.now();
    await user.save();
    
    // Đánh dấu token đã sử dụng
    resetRequest.used = true;
    await resetRequest.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password - Đổi mật khẩu (khi đã đăng nhập)
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    user.updatedAt = Date.now();
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== VERIFY TOKEN ====================

// GET /api/auth/verify - Xác thực token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }
    
    res.json({ valid: true, user });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

module.exports = router;