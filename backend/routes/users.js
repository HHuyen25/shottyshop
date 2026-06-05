const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// [PUBLIC] Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, avatar, provider } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      avatar: avatar || 'https://picsum.photos/50/50',
      provider: provider || 'local'
    });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ user: userObj, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [PUBLIC] Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [ADMIN] Get all users
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// [USER or ADMIN] Get single user
router.get('/:id', verifyToken, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Access denied' });
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// [USER or ADMIN] Update user
router.put('/:id', verifyToken, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Access denied' });
  const { name, password, role, avatar } = req.body;
  const update = { name, avatar, updatedAt: Date.now() };
  if (req.user.role === 'admin' && role) update.role = role;
  if (password) update.password = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  res.json(user);
});

// [ADMIN] Delete user
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;