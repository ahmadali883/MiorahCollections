const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: "../config/config.env" });

// Create transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
};

// Alternative SMTP configuration for other email providers
const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate order confirmation email HTML template
const generateOrderConfirmationHTML = (order, user) => {
  const { products, amount, address, createdAt, _id } = order;
  const orderDate = new Date(createdAt).toLocaleDateString();
  
  // Handle nested array structure - flatten if needed
  const productItems = Array.isArray(products[0]) ? products[0] : products;
  
  // Calculate total items
  const totalItems = productItems.reduce((total, item) => total + (item.quantity || 1), 0);
  
  // Get server base URL for images
  const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5000';
  
  // Generate product list HTML with images
  const productListHTML = productItems.map((item, index) => {
    // Cart item structure: {id, product, quantity, itemTotal}
    const product = item.product;
    const quantity = item.quantity || 1;
    const unitPrice = product?.price || 0; // Only use regular price
    const itemTotal = item.itemTotal || (unitPrice * quantity);
    
    // Get product image URL - convert relative paths to absolute URLs
    let imageUrl = '';
    let hasImage = false;
    
    if (product?.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      const relativeUrl = primaryImage.image_url;
      // Convert relative path to absolute URL
      imageUrl = relativeUrl.startsWith('http') ? relativeUrl : `${serverBaseUrl}${relativeUrl}`;
      hasImage = true;
    } else {
      // Use a simple 1x1 transparent pixel as placeholder
      imageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      hasImage = false;
    }
    
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #fff;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 80px; height: 80px; border-radius: 6px; border: 1px solid #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center; ${hasImage ? '' : 'background: #f3f4f6;'}">
            ${hasImage ? 
              `<img src="${imageUrl}" alt="${product?.name || 'Product'}" 
                   style="width: 100%; height: 100%; object-fit: cover;" 
                   onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'color: #6b7280; font-size: 12px; text-align: center; padding: 10px;\\'>📷<br>Image</div>'">` :
              `<div style="color: #6b7280; font-size: 12px; text-align: center; padding: 10px;">📷<br>Image</div>`
            }
          </div>
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #1f2937; font-weight: 600;">
              ${product?.name || 'Product Name'}
            </h4>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
              Unit Price: Rs ${unitPrice.toFixed(2)}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Quantity: ${quantity}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #059669;">
              Rs ${itemTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation - Miorah Collections</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 10px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
          ✨ Miorah Collections ✨
        </h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">
          Luxury Jewelry & Accessories
        </p>
      </div>
      
      <!-- Order Confirmation -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px;">
          🎉 Order Confirmation
        </h2>
        <p style="margin: 0 0 10px 0; font-size: 16px;">
          Hello <strong>${user.firstname} ${user.lastname}</strong>,
        </p>
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #4b5563;">
          Thank you for your order! We're excited to prepare your beautiful jewelry pieces.
        </p>
        <p style="margin: 0; font-size: 12px; color: #6b7280; font-style: italic;">
          📧 If product images don't load, please enable images in your email client or contact us for product details.
        </p>
      </div>
      
      <!-- Order Details Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">📋 Order Details</h3>
          <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Order ID:</strong> #${_id.toString().slice(-8).toUpperCase()}</p>
          <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Date:</strong> ${orderDate}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Items:</strong> ${totalItems}</p>
        </div>
        
        <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">💳 Payment Info</h3>
          <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Method:</strong> Cash on Delivery</p>
          <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Total:</strong> Rs ${amount.toFixed(2)}</p>
          <p style="margin: 0; font-size: 14px; color: #059669;"><strong>Status:</strong> Confirmed ✅</p>
        </div>
      </div>
      
      <!-- Product List -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">
          🛍️ Your Items
        </h3>
        ${productListHTML}
      </div>
      
      <!-- Delivery Address -->
      <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #0ea5e9;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
          🚚 Delivery Address
        </h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.5;">
          ${address?.street || 'N/A'}<br>
          ${address?.city || 'N/A'}, ${address?.state || 'N/A'} ${address?.postalCode || ''}<br>
          ${address?.country || 'Pakistan'}
        </p>
      </div>
      
      <!-- Order Summary -->
      <div style="background: #065f46; color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px;">💰 Order Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Subtotal:</span>
          <span>Rs ${amount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <hr style="border: none; border-top: 1px solid #10b981; margin: 15px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
          <span>Total:</span>
          <span>Rs ${amount.toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 20px; background: #1f2937; color: white; border-radius: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #f59e0b;">Thank You for Choosing Miorah Collections!</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px;">
          We'll process your order within 24 hours and contact you for delivery coordination.
        </p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Questions? Contact us at support@miorahcollections.com
        </p>
      </div>
      
    </body>
    </html>
  `;
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Handle nested array structure - flatten if needed (for text email)
    const productItems = Array.isArray(order.products[0]) ? order.products[0] : order.products;
    const { address } = order;
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Miorah Collections',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `Order Confirmation #${order._id} - Miorah Collections`,
      html: generateOrderConfirmationHTML(order, user),
      text: `
        Hello ${user.firstname} ${user.lastname},
        
        ✨ Thank you for your order from Miorah Collections! ✨
        
        ORDER DETAILS:
        =============
        Order ID: #${order._id.toString().slice(-8).toUpperCase()}
        Order Date: ${new Date(order.createdAt).toLocaleDateString()}
        Total Amount: Rs ${order.amount.toFixed(2)}
        Payment Method: Cash on Delivery
        
        ITEMS ORDERED:
        =============
        ${productItems.map(item => {
          // Cart item structure: {id, product, quantity, itemTotal}
          const product = item.product;
          const quantity = item.quantity || 1;
          const unitPrice = product?.price || 0; // Only use regular price
          const itemTotal = item.itemTotal || (unitPrice * quantity);
          return `- ${product?.name || 'Product'}: Rs ${unitPrice.toFixed(2)} x ${quantity} = Rs ${itemTotal.toFixed(2)}`;
        }).join('\n        ')}
        
        DELIVERY ADDRESS:
        ================
        ${address?.street || 'N/A'}
        ${address?.city || 'N/A'}, ${address?.state || 'N/A'} ${address?.postalCode || ''}
        ${address?.country || 'Pakistan'}
        
        PAYMENT SUMMARY:
        ===============
        Subtotal: Rs ${order.amount.toFixed(2)}
        Shipping: Free
        Total: Rs ${order.amount.toFixed(2)}
        
        🎉 What's Next?
        - We'll process your order within 24 hours
        - You'll receive a call to confirm delivery details
        - Payment will be collected on delivery
        - Delivery within 3-7 business days
        
        Thank you for choosing Miorah Collections!
        
        Questions? Contact us at support@miorahcollections.com
        
        ---
        Miorah Collections - Your trusted jewelry partner
        This is an automated email. Please do not reply.
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

// Send general email (for future use)
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Miorah Collections',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, firstName, resetUrl, resetToken) => {
  const subject = 'Reset Your Password - Miorah Collections';
  const html = generatePasswordResetHTML(firstName, resetUrl, resetToken);
  const text = generatePasswordResetText(firstName, resetUrl);
  
  return await sendEmail(email, subject, html, text);
};

// Generate HTML template for password reset
const generatePasswordResetHTML = (firstName, resetUrl, resetToken) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 30px; }
            .reset-button { background-color: #ff7e5f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .reset-button:hover { background-color: #ff6b47; }
            .footer { background-color: #f0f0f0; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .token-box { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Reset Your Password</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName},</h2>
                
                <p>We received a request to reset your password for your Miorah Collections account. If you didn't make this request, you can safely ignore this email.</p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> This reset link will expire in 1 hour for your security.
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <div class="token-box">
                    ${resetUrl}
                </div>
                
                <p><strong>Alternative method:</strong> If you're having trouble with the link, you can also use this reset token directly on our password reset page:</p>
                <div class="token-box">
                    Reset Token: ${resetToken}
                </div>
                
                <h3>🛡️ Security Tips:</h3>
                <ul>
                    <li>Choose a strong password with at least 8 characters</li>
                    <li>Include a mix of letters, numbers, and symbols</li>
                    <li>Don't reuse passwords from other accounts</li>
                    <li>Never share your password with anyone</li>
                </ul>
                
                <p>If you continue to have problems, please contact our support team.</p>
                
                <p>Best regards,<br>
                <strong>The Miorah Collections Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent because a password reset was requested for your account.</p>
                <p>If you didn't request this, please contact us immediately.</p>
                <p>&copy; ${new Date().getFullYear()} Miorah Collections. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate plain text version for password reset
const generatePasswordResetText = (firstName, resetUrl) => {
  return `
Hi ${firstName},

We received a request to reset your password for your Miorah Collections account.

To reset your password, click the link below or copy and paste it into your browser:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons, please don't share this link with anyone.

Best regards,
The Miorah Collections Team

---
If you're having trouble clicking the link, copy and paste the URL below into your web browser:
${resetUrl}
  `.trim();
};

// Email verification functions
const sendEmailVerificationEmail = async (email, firstName, verificationUrl, verificationToken) => {
  try {
    const subject = 'Verify Your Email Address - Miorah Collections';
    const htmlContent = generateEmailVerificationHTML(firstName, verificationUrl, verificationToken);
    const textContent = generateEmailVerificationText(firstName, verificationUrl);
    
    await sendEmail(email, subject, htmlContent, textContent);
    console.log(`Email verification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email verification:', error);
    throw error;
  }
};

const generateEmailVerificationHTML = (firstName, verificationUrl, verificationToken) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Miorah Collections</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .content {
          margin-bottom: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          color: #374151;
          margin-bottom: 25px;
        }
        .verify-button {
          text-align: center;
          margin: 30px 0;
        }
        .verify-button a {
          display: inline-block;
          background-color: #3b82f6;
          color: white !important;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        .verify-button a:hover {
          background-color: #2563eb;
        }
        .security-info {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .security-info h3 {
          color: #0369a1;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .security-info ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .security-info li {
          margin: 8px 0;
          color: #0c4a6e;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .token-info {
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
          font-size: 14px;
        }
        .warning strong {
          color: #78350f;
        }
        
        /* Mobile responsive */
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .verify-button a {
            padding: 12px 25px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">💎 Miorah Collections</div>
          <div class="subtitle">Exquisite Jewelry & Accessories</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${firstName}!</div>
          
          <div class="message">
            Welcome to Miorah Collections! We're excited to have you join our community of jewelry enthusiasts.
          </div>
          
          <div class="message">
            To complete your registration and start exploring our exquisite collection, please verify your email address by clicking the button below:
          </div>
          
          <div class="verify-button">
            <a href="${verificationUrl}">Verify My Email Address</a>
          </div>
          
          <div class="security-info">
            <h3>🔒 Security Information</h3>
            <ul>
              <li>This verification link will expire in <strong>24 hours</strong></li>
              <li>If you didn't create an account, please ignore this email</li>
              <li>Never share this verification link with anyone</li>
              <li>Once verified, you'll be able to access all features of your account</li>
            </ul>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> You must verify your email address to log in to your account. If you don't verify within 24 hours, you'll need to register again.
          </div>
          
          <div class="message">
            If you're having trouble clicking the button, copy and paste the following link into your browser:
          </div>
          
          <div class="token-info">
            ${verificationUrl}
          </div>
          
          <div class="message">
            Once your email is verified, you'll be able to:
            <ul>
              <li>Browse our complete jewelry collection</li>
              <li>Save items to your wishlist</li>
              <li>Track your orders and delivery status</li>
              <li>Receive exclusive offers and updates</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>
            Best regards,<br>
            The Miorah Collections Team
          </p>
          <p>
            <strong>Verification Token:</strong> ${verificationToken.substring(0, 8)}...
          </p>
          <p>
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateEmailVerificationText = (firstName, verificationUrl) => {
  return `
Hi ${firstName},

Welcome to Miorah Collections! We're excited to have you join our community of jewelry enthusiasts.

To complete your registration and start exploring our exquisite collection, please verify your email address by clicking the link below or copying and pasting it into your browser:

${verificationUrl}

IMPORTANT SECURITY INFORMATION:
- This verification link will expire in 24 hours
- If you didn't create an account, please ignore this email
- Never share this verification link with anyone
- Once verified, you'll be able to access all features of your account

WARNING: You must verify your email address to log in to your account. If you don't verify within 24 hours, you'll need to register again.

Once your email is verified, you'll be able to:
- Browse our complete jewelry collection
- Save items to your wishlist
- Track your orders and delivery status
- Receive exclusive offers and updates

Best regards,
The Miorah Collections Team

---
If you're having trouble clicking the link, copy and paste the URL below into your web browser:
${verificationUrl}
  `.trim();
};

module.exports = {
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  generateOrderConfirmationHTML,
  generatePasswordResetHTML,
  generatePasswordResetText
}; 