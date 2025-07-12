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

module.exports = {
  sendOrderConfirmationEmail,
  sendEmail,
  generateOrderConfirmationHTML
}; 