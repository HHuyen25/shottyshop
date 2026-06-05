require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const Coupon = require('./models/Coupon');
const Category = require('./models/Category');
const Post = require('./models/Post');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shottyshop';

// Sample Categories
const sampleCategories = [
  { name: 'Album', icon: '', order: 1, description: 'Official music albums from your favorite K-POP artists', isActive: true },
  { name: 'Card', icon: '', order: 2, description: 'Official photocards and trading cards', isActive: true },
  { name: 'Áo', icon: '', order: 3, description: 'Official merchandise clothing', isActive: true },
  { name: 'Sản phẩm liên quan', icon: '', order: 4, description: 'Other related merchandise including keychains, posters, etc.', isActive: true }
];

// Sample Products
const sampleProducts = [
  { 
    name: 'Album "Dawn" - Special Edition', 
    price: 39.99, 
    category: 'Album', 
    stock: 50, 
    image: 'https://picsum.photos/id/100/300/300', 
    preorder: false, 
    hanteo: true,
    description: 'The highly anticipated special edition album includes a 120-page photobook, 2 random photocards, a poster, and a special art card. This edition counts towards HANTEO chart.',
    specifications: { type: 'CD + Photobook', country: 'Korea', weight: '0.5kg', size: '150x150x20mm' }
  },
  { 
    name: 'Album "Dawn" - Standard Edition', 
    price: 24.99, 
    category: 'Album', 
    stock: 100, 
    image: 'https://picsum.photos/id/101/300/300', 
    preorder: false, 
    hanteo: true,
    description: 'Standard edition includes CD, 80-page photobook, and 1 random photocard. Counts towards HANTEO chart.',
    specifications: { type: 'CD + Photobook', country: 'Korea', weight: '0.3kg', size: '140x140x15mm' }
  },
  { 
    name: 'Official Photocard Set (Random 5pcs)', 
    price: 15.99, 
    category: 'Card', 
    stock: 200, 
    image: 'https://picsum.photos/id/102/300/300', 
    preorder: false, 
    hanteo: false,
    description: 'Set of 5 random official photocards. Each card is officially licensed.',
    specifications: { type: 'Photocard', country: 'Korea', size: '55x85mm' }
  },
  { 
    name: 'Limited Edition Trading Card Box', 
    price: 49.99, 
    category: 'Card', 
    stock: 30, 
    image: 'https://picsum.photos/id/103/300/300', 
    preorder: true, 
    hanteo: false,
    description: 'Limited edition trading card box containing 20 packs. Each pack has 5 random cards. Includes rare holographic cards!',
    specifications: { type: 'Trading Cards', country: 'Korea', weight: '0.8kg', size: '200x150x50mm' }
  },
  { 
    name: 'Official Tour T-Shirt (Black)', 
    price: 34.99, 
    category: 'Áo', 
    stock: 80, 
    image: 'https://picsum.photos/id/104/300/300', 
    preorder: false, 
    hanteo: false,
    description: 'Official world tour merchandise. 100% cotton, available in S-XXL.',
    specifications: { type: 'T-Shirt', country: 'Korea', size: 'S-XXL', weight: '0.2kg' }
  },
  { 
    name: 'Hoodie (White)', 
    price: 59.99, 
    category: 'Áo', 
    stock: 40, 
    image: 'https://picsum.photos/id/105/300/300', 
    preorder: true, 
    hanteo: false,
    description: 'Official hoodie with embroidered logo. Premium cotton blend, available in S-XXL. Pre-order item, ships in 2-3 weeks.',
    specifications: { type: 'Hoodie', country: 'Korea', size: 'S-XXL', weight: '0.6kg' }
  },
  { 
    name: 'Official Light Stick', 
    price: 69.99, 
    category: 'Sản phẩm liên quan', 
    stock: 150, 
    image: 'https://picsum.photos/id/106/300/300', 
    preorder: false, 
    hanteo: false,
    description: 'Official light stick with Bluetooth connectivity. Syncs with concert app.',
    specifications: { type: 'Light Stick', country: 'Korea', weight: '0.3kg', size: '70x70x250mm' }
  },
  { 
    name: 'Keychain + Acrylic Stand Set', 
    price: 19.99, 
    category: 'Sản phẩm liên quan', 
    stock: 120, 
    image: 'https://picsum.photos/id/107/300/300', 
    preorder: false, 
    hanteo: false,
    description: 'Cute keychain and acrylic stand set. Perfect for desk decoration!',
    specifications: { type: 'Keychain + Stand', country: 'Korea', weight: '0.1kg' }
  }
];

// Sample Banners
const sampleBanners = [
  { 
    title: 'Summer Sale', 
    subtitle: 'Up to 50% off on selected items', 
    image: 'https://picsum.photos/id/104/1200/500', 
    buttonText: 'SHOP NOW', 
    buttonLink: '/filter.html', 
    order: 1, 
    active: true, 
    mediaType: 'image' 
  },
  { 
    title: 'New Album "Dawn"', 
    subtitle: 'Pre-order now and get exclusive photocards', 
    image: 'https://picsum.photos/id/105/1200/500', 
    buttonText: 'PRE-ORDER', 
    buttonLink: '/crud/product-detail.html?id=', 
    order: 2, 
    active: true, 
    mediaType: 'image' 
  },
  { 
    title: 'Free Shipping', 
    subtitle: 'On orders over $50', 
    image: 'https://picsum.photos/id/106/1200/500', 
    buttonText: 'SHOP NOW →', 
    buttonLink: '/', 
    order: 3, 
    active: true, 
    mediaType: 'image' 
  }
];

// Sample Coupons
const sampleCoupons = [
  { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minOrder: 20, usageLimit: 100, active: true },
  { code: 'FREESHIP', discountType: 'fixed', discountValue: 5, minOrder: 30, usageLimit: 50, active: true },
  { code: 'SUMMER2024', discountType: 'percentage', discountValue: 15, minOrder: 50, expiry: new Date('2024-12-31'), usageLimit: 200, active: true },
  { code: 'FLASH10', discountType: 'percentage', discountValue: 10, minOrder: 0, usageLimit: 1000, active: true }
];

// Sample Posts
const samplePosts = [
  {
    title: 'Welcome to SHOTTYSHOP!',
    content: '<p>We are excited to announce the launch of SHOTTYSHOP, your premier destination for K-POP merchandise!</p><p>We offer 100% authentic products that count towards HANTEO and GAON charts. Every purchase directly supports your favorite artists.</p><h3>What We Offer:</h3><ul><li>Official albums and merchandise</li><li>Fast shipping from Korea</li><li>24/7 customer support</li><li>Secure payment options</li></ul><p>Stay tuned for upcoming events and exclusive releases!</p>',
    excerpt: 'Welcome to SHOTTYSHOP! We are excited to announce the launch of our official store...',
    category: 'announcement',
    tags: ['launch', 'welcome', 'announcement'],
    status: 'published',
    author: 'Admin',
    featuredImage: 'https://picsum.photos/id/20/800/400'
  },
  {
    title: 'How to Pre-order Albums',
    content: '<p>Pre-ordering albums on SHOTTYSHOP is easy! Follow these steps:</p><ol><li>Browse our collection of upcoming releases</li><li>Click on the "Pre-order" button on the product page</li><li>Add to cart and proceed to checkout</li><li>Complete your payment</li></ol><p>Pre-ordered albums count towards HANTEO chart and will be shipped on the release date.</p>',
    excerpt: 'Learn how to pre-order albums on SHOTTYSHOP and secure your copies before they sell out...',
    category: 'guide',
    tags: ['preorder', 'guide', 'tutorial'],
    status: 'published',
    author: 'Admin',
    featuredImage: 'https://picsum.photos/id/21/800/400'
  },
  {
    title: 'Upcoming Events: Fan Meeting in Seoul',
    content: '<p>We are thrilled to announce a special fan meeting event in Seoul!</p><p><strong>Date:</strong> December 15, 2024</p><p><strong>Venue:</strong> Olympic Hall, Seoul</p><p>Tickets will be available exclusively on SHOTTYSHOP starting November 1st. Stay tuned for more details!</p>',
    excerpt: 'Join us for a special fan meeting event in Seoul this December...',
    category: 'event',
    tags: ['event', 'fanmeeting', 'seoul'],
    status: 'published',
    author: 'Admin',
    featuredImage: 'https://picsum.photos/id/22/800/400'
  },
  {
    title: 'Album Review: "Dawn"',
    content: '<p>"Dawn" is the highly anticipated comeback album that showcases the group\'s musical growth and maturity. The title track blends emotional lyrics with a powerful melody.</p><p>Our rating: 9.5/10</p><p>Must-buy for any fan! The photobook alone is worth the purchase.</p>',
    excerpt: 'Our honest review of the new album "Dawn" - is it worth the hype?',
    category: 'review',
    tags: ['review', 'album', 'dawn'],
    status: 'published',
    author: 'Admin',
    featuredImage: 'https://picsum.photos/id/23/800/400'
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Xóa dữ liệu cũ
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await Category.deleteMany({});
    await Post.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing collections');

    // Tạo categories
    console.log('Creating categories...');
    const categories = await Category.insertMany(sampleCategories);
    console.log(`Added ${categories.length} categories`);

    // Tạo admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@shottyshop.com',
      password: hashedPassword,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=1a1a1a&color=fff',
      provider: 'local'
    });
    await admin.save();
    console.log('Admin created: admin@shottyshop.com / admin123');

    // Tạo staff user
    const staffPassword = await bcrypt.hash('staff123', 10);
    const staff = new User({
      name: 'Staff User',
      email: 'staff@shottyshop.com',
      password: staffPassword,
      role: 'staff',
      avatar: 'https://ui-avatars.com/api/?name=Staff&background=666&color=fff',
      provider: 'local'
    });
    await staff.save();
    console.log('Staff created: staff@shottyshop.com / staff123');

    // Tạo customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = new User({
      name: 'Customer',
      email: 'customer@shottyshop.com',
      password: customerPassword,
      role: 'customer',
      avatar: 'https://ui-avatars.com/api/?name=Customer&background=999&color=fff',
      provider: 'local'
    });
    await customer.save();
    console.log('Customer created: customer@shottyshop.com / customer123');

    // Tạo sản phẩm
    console.log('Creating products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`Added ${products.length} products`);

    // Tạo banner
    console.log('Creating banners...');
    const banners = await Banner.insertMany(sampleBanners);
    console.log(`Added ${banners.length} banners`);

    // Tạo coupon
    console.log('Creating coupons...');
    const coupons = await Coupon.insertMany(sampleCoupons);
    console.log(`Added ${coupons.length} coupons`);

    // Tạo bài viết
    console.log('Creating blog posts...');
    const posts = await Post.insertMany(samplePosts);
    console.log(`Added ${posts.length} posts`);

    // Tạo đánh giá mẫu
    console.log('Creating sample reviews...');
    const sampleReviews = [
      {
        productId: products[0]._id,
        userId: customer._id,
        userName: customer.name,
        rating: 5,
        comment: 'Absolutely love this album! The photobook is stunning and the songs are amazing. Highly recommend!',
        date: new Date()
      },
      {
        productId: products[1]._id,
        userId: customer._id,
        userName: customer.name,
        rating: 4,
        comment: 'Great album but shipping took a bit longer than expected. Overall satisfied!',
        date: new Date()
      },
      {
        productId: products[4]._id,
        userId: customer._id,
        userName: customer.name,
        rating: 5,
        comment: 'The quality of the shirt is excellent. True to size and very comfortable.',
        date: new Date()
      }
    ];
    await Review.insertMany(sampleReviews);
    console.log(`Added ${sampleReviews.length} reviews`);

    console.log(`
    ┌─────────────────────────────────────────────────────┐
    │            SEEDING COMPLETED!                    │
    ├─────────────────────────────────────────────────────┤
    │  Statistics:                                      │
    │  - Categories: ${categories.length}                         │
    │  - Products: ${products.length}                            │
    │  - Banners: ${banners.length}                             │
    │  - Coupons: ${coupons.length}                             │
    │  - Posts: ${posts.length}                                │
    │  - Reviews: ${sampleReviews.length}                        │
    ├─────────────────────────────────────────────────────┤
    │  Test Accounts:                                   │
    │  - Admin: admin@shottyshop.com / admin123            │
    │  - Staff: staff@shottyshop.com / staff123            │
    │  - Customer: customer@shottyshop.com / customer123   │
    ├─────────────────────────────────────────────────────┤
    │  Test Coupons:                                    │
    │  - WELCOME10 (10% off, min $20)                      │
    │  - FREESHIP ($5 off, min $30)                        │
    │  - SUMMER2024 (15% off, min $50)                     │
    │  - FLASH10 (10% off, no min)                         │
    └─────────────────────────────────────────────────────┘
    `);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();