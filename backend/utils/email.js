const nodemailer = require('nodemailer');

let transporter = null;

// Khởi tạo transporter nếu có thông tin email
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email transporter configured');
} else {
  console.warn('Email not configured – skipping email functions');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

/**
 * Email template wrapper
 */
function getEmailTemplate(title, content, buttonText = null, buttonLink = null) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a, #333);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 8px 0 0;
          opacity: 0.8;
          font-size: 14px;
        }
        .content {
          padding: 30px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          background: #1a1a1a;
          color: white;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 40px;
          font-weight: 600;
          margin: 20px 0;
          transition: background 0.2s;
        }
        .button:hover {
          background: #333;
        }
        .warning {
          background: #fef3c7;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #d97706;
          margin: 16px 0;
        }
        .success {
          background: #d1fae5;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #059669;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
        }
        .total {
          text-align: right;
          font-size: 18px;
          font-weight: 700;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid #eee;
        }
        @media (max-width: 600px) {
          .content { padding: 20px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>SHOTTYSHOP</h1>
            <p>Your Premier K-POP Destination</p>
          </div>
          <div class="content">
            ${content}
            ${buttonText && buttonLink ? `<div style="text-align: center;"><a href="${buttonLink}" class="button">${buttonText}</a></div>` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SHOTTYSHOP Co., Ltd. All rights reserved.</p>
            <p>123 Nguyen Hue Street, District 1, Ho Chi Minh City, Vietnam</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #999;">Contact Us</a> | 
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" style="color: #999;">Privacy Policy</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gửi email xác nhận đơn hàng
 */
async function sendOrderConfirmation(order, userEmail) {
  if (!transporter) {
    console.warn('Email not configured – skipping sendOrderConfirmation');
    return;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Thank you for your order!</h2>
    <p>Dear <strong>${escapeHtml(order.customerName)}</strong>,</p>
    <p>We have received your order and will process it as soon as possible.</p>
    
    <h3>Order Details</h3>
    <p><strong>Order ID:</strong> #${order.orderId}</p>
    <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString()}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
    
    <h3>🛒 Order Items</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div class="total">
      Total: <strong style="color: #10b981;">$${order.total.toFixed(2)}</strong>
    </div>
    
    <p><strong>Shipping Address:</strong><br>
    ${escapeHtml(order.shippingAddress?.street || '')}<br>
    ${escapeHtml(order.shippingAddress?.district || '')}, ${escapeHtml(order.shippingAddress?.city || '')}
    </p>
    
    <p>We will notify you once your order is shipped.</p>
    
    <p>Best regards,<br><strong>SHOTTYSHOP Team</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `"SHOTTYSHOP" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation #${order.orderId}`,
      html: getEmailTemplate('Order Confirmation', content, 'View Order Status', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/crud/order-history.html`)
    });
    console.log(`Order confirmation email sent to ${userEmail}`);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

/**
 * Gửi email reset password
 */
async function sendPasswordResetEmail(userEmail, resetToken) {
  if (!transporter) {
    console.warn('Email not configured – skipping sendPasswordResetEmail');
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/crud/reset-password.html?token=${resetToken}`;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password for your SHOTTYSHOP account.</p>
    
    <div class="warning">
      This link will expire in 1 hour. If you did not request this, please ignore this email.
    </div>
    
    <p>Click the button below to create a new password:</p>
    
    <p style="font-size: 12px; background: #f0f0f0; padding: 8px; border-radius: 6px; word-break: break-all;">
      Or copy this link: ${resetUrl}
    </p>
    
    <p>Best regards,<br><strong>SHOTTYSHOP Team</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `"SHOTTYSHOP" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reset Your Password - SHOTTYSHOP',
      html: getEmailTemplate('Reset Password', content, 'Reset Password', resetUrl)
    });
    console.log(`Password reset email sent to ${userEmail}`);
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }
}

/**
 * Gửi email thông báo đơn hàng đã giao
 */
async function sendOrderDeliveredNotification(order, userEmail) {
  if (!transporter) return;

  const content = `
    <h2>Your Order Has Been Delivered!</h2>
    <p>Dear <strong>${escapeHtml(order.customerName)}</strong>,</p>
    <p>Your order <strong>#${order.orderId}</strong> has been delivered successfully.</p>
    
    <div class="success">
      Thank you for shopping with us! We hope you enjoy your purchase.
    </div>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Best regards,<br><strong>SHOTTYSHOP Team</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `"SHOTTYSHOP" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Delivered #${order.orderId}`,
      html: getEmailTemplate('Order Delivered', content, 'Write a Review', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/crud/order-history.html`)
    });
    console.log(`Delivery notification sent to ${userEmail}`);
  } catch (err) {
    console.error('Failed to send delivery email:', err);
  }
}

/**
 * Gửi email chào mừng
 */
async function sendWelcomeEmail(userEmail, userName) {
  if (!transporter) return;

  const content = `
    <h2>Welcome to SHOTTYSHOP!</h2>
    <p>Dear <strong>${escapeHtml(userName)}</strong>,</p>
    <p>Thank you for joining SHOTTYSHOP! We're excited to have you as part of our community.</p>
    
    <p>Here's what you can do:</p>
    <ul>
      <li>Browse thousands of K-POP albums and merchandise</li>
      <li>Track your orders with HANTEO chart counting</li>
      <li>Get exclusive member-only discounts</li>
      <li>Fast shipping from Korea to your door</li>
    </ul>
    
    <div class="warning">
      Use code <strong>WELCOME10</strong> for 10% off your first order!
    </div>
    
    <p>Best regards,<br><strong>SHOTTYSHOP Team</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `"SHOTTYSHOP" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to SHOTTYSHOP!',
      html: getEmailTemplate('Welcome to SHOTTYSHOP', content, 'Start Shopping', process.env.FRONTEND_URL || 'http://localhost:3000')
    });
    console.log(`Welcome email sent to ${userEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

/**
 * Gửi email thông báo đơn hàng đã gửi
 */
async function sendOrderShippedNotification(order, userEmail) {
  if (!transporter) return;

  const content = `
    <h2>Your Order Has Been Shipped!</h2>
    <p>Dear <strong>${escapeHtml(order.customerName)}</strong>,</p>
    <p>Great news! Your order <strong>#${order.orderId}</strong> has been shipped and is on its way to you.</p>
    
    ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
    
    <p>Estimated delivery: 3-7 business days.</p>
    
    <p>You can track your order status in your account.</p>
    
    <p>Best regards,<br><strong>SHOTTYSHOP Team</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `"SHOTTYSHOP" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Shipped #${order.orderId}`,
      html: getEmailTemplate('Order Shipped', content, 'Track Order', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/crud/tracking.html`)
    });
    console.log(`Shipping notification sent to ${userEmail}`);
  } catch (err) {
    console.error('Failed to send shipping email:', err);
  }
}

module.exports = { 
  sendOrderConfirmation, 
  sendPasswordResetEmail,
  sendOrderDeliveredNotification,
  sendWelcomeEmail,
  sendOrderShippedNotification
};