// ==============================================================
//  IMPORT DATABASE — nạp toàn bộ dữ liệu từ database-backup.json
//  Dùng khi chuyển sang máy/database mới:
//    1. Đặt MONGODB_URI trong file .env
//    2. Chạy:  node import-db.js   (hoặc: npm run import-db)
//  -> Sẽ XÓA dữ liệu cũ của từng collection rồi nạp lại từ file backup.
// ==============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const BACKUP_FILE = path.join(__dirname, 'database-backup.json');

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Thiếu MONGODB_URI trong file .env');
    process.exit(1);
  }
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ Không tìm thấy database-backup.json (đặt cùng thư mục với import-db.js)');
    process.exit(1);
  }

  console.log('📖 Đang đọc database-backup.json ...');
  const parsed = EJSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  const data = parsed.data || parsed; // hỗ trợ cả file có _meta lẫn không

  console.log('🔌 Đang kết nối MongoDB ...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  console.log('✅ Đã kết nối: ' + db.databaseName);
  console.log('⚠️  Bắt đầu import (sẽ XÓA dữ liệu cũ của từng collection rồi nạp lại) ...\n');

  let total = 0;
  for (const [col, docs] of Object.entries(data)) {
    await db.collection(col).deleteMany({});
    if (Array.isArray(docs) && docs.length) {
      await db.collection(col).insertMany(docs, { ordered: false });
      total += docs.length;
    }
    console.log('   ' + col + ': ' + (Array.isArray(docs) ? docs.length : 0) + ' docs');
  }

  console.log('\n🎉 Hoàn tất! Đã nạp ' + total + ' docs vào database "' + db.databaseName + '".');
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('❌ Lỗi import:', err.message);
  process.exit(1);
});
