const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Định nghĩa các thư mục đích theo loại
const getUploadDir = (type) => {
  // Đường dẫn tuyệt đối đến thư mục image (cùng cấp với backend)
  // __dirname là backend/middleware -> lên 2 cấp để tới thư mục gốc dự án, rồi vào image
  const baseDir = path.join(__dirname, '../../image');
  
  const dirMap = {
    products: 'products',
    banners: 'banners',
    reviews: 'reviews',
    avatar: 'avatars',
    avatars: 'avatars'
  };
  
  const folder = dirMap[type] || 'others';
  const fullPath = path.join(baseDir, folder);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
  return fullPath;
};

// Cấu hình storage động theo query param `type`
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'products';
    const uploadPath = getUploadDir(type);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Tạo tên file an toàn, không dấu, tránh trùng
    const originalName = file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
    
    // Timestamp + random + original name (an toàn)
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const filename = `${timestamp}-${random}-${baseName}${ext}`;
    cb(null, filename);
  }
});

// Bộ lọc file - chỉ cho phép images và videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = /jpeg|jpg|png|gif|bmp|webp|mp4|webm|mov|avi/i;
  const extname = allowedMimes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed (jpeg, jpg, png, gif, bmp, webp, mp4, webm, mov, avi)'), false);
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

module.exports = upload;