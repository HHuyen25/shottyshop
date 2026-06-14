# 🎵 SHOTTYSHOP - K-POP E-commerce Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%3E%3D6.0-brightgreen)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A complete e-commerce platform for K-POP merchandise and albums, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## ✨ Features

### 🛒 Customer Features
- **User Authentication** - Login/Register with email or Google OAuth
- **Product Browsing** - Filter by category, price, pre-order, Hanteo chart
- **Shopping Cart** - Add/remove items, update quantities, stock validation
- **Wishlist** - Save favorite products for later
- **Order Management** - Place orders, track status, view history
- **Product Reviews** - Rate and review purchased products
- **Blog/News** - Read articles, leave comments, like posts
- **Multi-language** - Support for English, Vietnamese, Korean, Japanese, Chinese, Spanish
- **Multi-currency** - USD, VND, KRW, JPY, CNY, MXN
- **Dark Mode** - Automatic theme switching

### 👨‍💼 Admin Features
- **Dashboard** - Revenue charts, order statistics, top products
- **User Management** - CRUD users, role management (admin/staff/customer)
- **Product Management** - CRUD products, stock control, image upload
- **Order Management** - Update status, view details, export reports
- **Banner Management** - Image/video sliders, order control
- **Coupon Management** - Create discount codes, usage limits
- **Blog Management** - Create/edit posts, manage comments
- **Reports** - Export CSV, revenue analysis, product performance

### 👔 Staff Features
- **Product Management** - Create/edit products, update stock
- **Order Management** - Update order status
- **Banner Management** - Create/edit banners

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer with Sharp for image optimization
- **Email**: Nodemailer (Gmail SMTP)
- **Security**: Helmet, CORS, express-rate-limit

### Frontend
- **Core**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js
- **Excel Export**: SheetJS
- **PDF Export**: html2pdf.js
- **Icons**: Emoji/UTF-8 icons

## 📁 Project Structure

```
shottyshop/
├── backend/                 # Node.js + Express API
│   ├── server.js            # Điểm khởi động server
│   ├── import-db.js         # Script nạp dữ liệu từ database-backup.json
│   ├── database-backup.json # 🗄️ TOÀN BỘ dữ liệu (1 file duy nhất để import)
│   ├── models/  routes/  middleware/  utils/
│   └── .env                 # Biến môi trường (tự tạo, KHÔNG commit)
├── frontend/                # HTML/CSS/JS thuần (giao diện khách + admin + staff)
└── image/                   # Ảnh tĩnh
```

---

## 🚀 Hướng dẫn khởi động dự án (chạy trên máy mới)

### 1. Yêu cầu
- **Node.js** >= 18 — tải tại https://nodejs.org
- **MongoDB Atlas** (miễn phí) — tạo cluster tại https://cloud.mongodb.com
  (hoặc MongoDB cài sẵn trên máy)

### 2. Cài đặt
```bash
# Tải mã nguồn về rồi vào thư mục backend
cd shottyshop/backend

# Cài các thư viện
npm install
```

### 3. Tạo file `.env` trong thư mục `backend/`
Tạo file tên `.env` với nội dung (thay giá trị của bạn vào):
```env
PORT=3000
NODE_ENV=development

# Chuỗi kết nối MongoDB (lấy ở Atlas -> Connect -> Drivers)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shottyshop?retryWrites=true&w=majority

# Bí mật JWT (đặt chuỗi ngẫu nhiên bất kỳ)
JWT_SECRET=doi-thanh-chuoi-bi-mat-ngau-nhien
REFRESH_SECRET=doi-thanh-chuoi-bi-mat-khac

# Cloudinary (kho ảnh cloud — để ảnh upload không bị mất). Lấy ở dashboard Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# (Tùy chọn) Đăng nhập Google
GOOGLE_CLIENT_ID=
```
> ⚠️ Trên Atlas vào **Network Access** thêm IP `0.0.0.0/0` để máy nào cũng kết nối được.

### 4. Nạp dữ liệu vào database (chỉ 1 lệnh — từ file backup duy nhất)
Toàn bộ dữ liệu (sản phẩm, người dùng, banner, bài viết, coupon...) đã được lưu sẵn trong **`backend/database-backup.json`**. Chỉ cần chạy:
```bash
npm run import-db
```
Lệnh này tự xóa dữ liệu cũ rồi nạp toàn bộ từ file backup vào database trỏ bởi `MONGODB_URI`.

> 💡 Muốn **tạo file backup mới** (sao lưu lại database hiện tại thành 1 file) — xem mục *Backup* bên dưới.

### 5. Khởi động server
```bash
npm start        # chạy bình thường
# hoặc
npm run dev      # chế độ dev, tự khởi động lại khi sửa code
```
Server chạy ở **http://localhost:3000**

### 6. Truy cập
- 🛍️ Trang khách: **http://localhost:3000**
- 🔐 Đăng nhập: **http://localhost:3000/crud/login.html**
- 👨‍💼 Admin: vào bằng tài khoản role `admin`
- 👔 Staff: vào bằng tài khoản role `staff`

---

## 🗄️ Backup database thành 1 file

Để sao lưu toàn bộ database hiện tại thành **một file duy nhất** (`database-backup.json`):
```bash
cd backend
node -e "require('dotenv').config();const fs=require('fs'),m=require('mongoose'),{EJSON}=require('bson');m.connect(process.env.MONGODB_URI).then(async()=>{const db=m.connection.db,cols=(await db.listCollections().toArray()).map(c=>c.name).filter(n=>!n.startsWith('system.')),out={};for(const c of cols)out[c]=await db.collection(c).find({}).toArray();fs.writeFileSync('database-backup.json',EJSON.stringify({_meta:{exportedAt:new Date().toISOString(),collections:cols},data:out},null,2));console.log('Đã backup',cols.length,'collections');await m.disconnect();});"
```
Sau đó chỉ cần đưa file `database-backup.json` sang máy khác và chạy `npm run import-db` là xong.
