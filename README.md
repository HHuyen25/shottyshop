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
