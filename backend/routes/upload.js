const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'products';
    const uploadPath = path.join(__dirname, '../../image', type);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Tạo tên file an toàn
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
    
    const filename = `${timestamp}-${random}-${basename}${ext}`;
    cb(null, filename);
  }
});

// Bộ lọc file
const fileFilter = (req, file, cb) => {
  const allowedMimes = /jpeg|jpg|png|gif|bmp|webp|mp4|webm|mov|avi/i;
  const extname = allowedMimes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Helper: Resize ảnh
async function resizeImage(inputPath, outputPath, width, height) {
  try {
    await sharp(inputPath)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return true;
  } catch (err) {
    console.error('Resize error:', err);
    return false;
  }
}

// Helper: Tạo thumbnail
async function createThumbnail(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 60 })
      .toFile(outputPath);
    return true;
  } catch (err) {
    console.error('Thumbnail error:', err);
    return false;
  }
}

// Quyền upload: avatar/review cho mọi user đã đăng nhập; products/banners... yêu cầu staff/admin
function uploadPermission(req, res, next) {
  const type = req.query.type || 'products';
  const userAllowed = ['avatar', 'avatars', 'review', 'reviews', 'others'];
  if (userAllowed.includes(type)) return next();
  return isStaffOrAdmin(req, res, next);
}

// POST /api/upload - Upload file
router.post('/', verifyToken, uploadPermission, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const type = req.query.type || 'products';
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileUrl = `/image/${type}/${fileName}`;
    
    // Nếu là ảnh (không phải video), tạo thumbnail
    const isImage = /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(fileName);
    let thumbnailUrl = null;
    
    if (isImage) {
      const thumbnailPath = path.join(path.dirname(filePath), 'thumb', fileName);
      const thumbnailDir = path.join(path.dirname(filePath), 'thumb');
      
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      const thumbnailCreated = await createThumbnail(filePath, thumbnailPath);
      if (thumbnailCreated) {
        thumbnailUrl = `/image/${type}/thumb/${fileName}`;
      }
      
      // Resize ảnh gốc nếu quá lớn
      const stats = fs.statSync(filePath);
      if (stats.size > 1024 * 1024) { // > 1MB
        const resizedPath = path.join(path.dirname(filePath), 'resized-' + fileName);
        const resized = await resizeImage(filePath, resizedPath, 1200, 1200);
        if (resized) {
          // Thay thế file gốc bằng file đã resize
          fs.unlinkSync(filePath);
          fs.renameSync(resizedPath, filePath);
        }
      }
    }
    
    console.log(`File uploaded: ${fileUrl}`);
    res.json({ 
      success: true, 
      url: fileUrl,
      thumbnail: thumbnailUrl,
      filename: fileName,
      type: type,
      size: req.file.size
    });
  });
});

// POST /api/upload/multiple - Upload nhiều file
router.post('/multiple', verifyToken, isStaffOrAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const type = req.query.type || 'products';
    const files = req.files.map(file => ({
      url: `/image/${type}/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));
    
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/upload - Xóa file
router.delete('/', verifyToken, isStaffOrAdmin, async (req, res) => {
  try {
    const { fileUrl } = req.query;
    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'File URL required' });
    }
    
    // Lấy đường dẫn file từ URL
    const relativePath = fileUrl.replace(/^\/image\//, '');
    const filePath = path.join(__dirname, '../../image', relativePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Xóa thumbnail nếu có
      const thumbPath = path.join(path.dirname(filePath), 'thumb', path.basename(filePath));
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
      
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;