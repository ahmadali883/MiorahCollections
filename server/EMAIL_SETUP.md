# Email Functionality Setup Guide

## Overview

This guide explains how to set up and configure email functionality for sending order confirmation emails to customers when they place orders in the Miorah Collections e-commerce application.

## Features

- **Order Confirmation Emails**: Automatically sent when users place orders
- **Beautiful HTML Templates**: Professional, responsive email templates with order details
- **Error Handling**: Robust error handling that doesn't affect order processing
- **Flexible Configuration**: Support for Gmail and custom SMTP providers

## Setup Instructions

### 1. Email Provider Configuration

#### Option A: Using Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security > 2-Step Verification > App passwords
   - Select "Mail" and generate a password
   - Copy the 16-character password

3. **Update Environment Variables**:
   ```env
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

#### Option B: Using Custom SMTP Provider

For other email providers (Outlook, Yahoo, custom SMTP servers):

```env
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

Common SMTP settings:
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom**: Contact your provider for SMTP details

### 2. Environment Configuration

Update your `config/config.env` file with the email settings:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Base URL for email images and links
SERVER_BASE_URL=http://localhost:5000

# Optional SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Important**: For production deployment, update `SERVER_BASE_URL` to your actual domain:
- For Vercel: `https://your-app-name.vercel.app`
- For Heroku: `https://your-app-name.herokuapp.com`
- For custom domain: `https://yourdomain.com`

**Note**: The system will automatically use `http://localhost:5000` if `SERVER_BASE_URL` is not set.

### 3. Image Handling in Emails

The email system now properly handles product images by:

#### Image Loading Features:
- **Automatic URL Conversion**: Relative image paths are converted to absolute URLs
- **Fallback Handling**: If an image fails to load, a placeholder icon is shown
- **Graceful Degradation**: Email displays properly even when images are blocked

#### Email Client Considerations:
- Many email clients block images by default for security
- Users need to "enable images" or "load images" to see product photos
- The email includes a note about this to inform users

#### Production Setup:
- Ensure your server is publicly accessible
- Update `SERVER_BASE_URL` to your production domain
- Consider using a CDN for better image loading performance

### 4. Testing the Email Functionality

1. **Start the server**:
   ```bash
   npm run server
   ```

## Troubleshooting Email Images

### Common Issues and Solutions:

#### 1. Images Not Loading in Email
- **Cause**: Email client is blocking images by default
- **Solution**: Instruct users to "enable images" or "load images" in their email client
- **Note**: This is normal behavior - most email clients block images for security

#### 2. Images Show as Broken Links
- **Cause**: `SERVER_BASE_URL` is not set correctly
- **Solution**: 
  - For development: Set `SERVER_BASE_URL=http://localhost:5000`
  - For production: Set `SERVER_BASE_URL=https://yourdomain.com`
  - Ensure your server is publicly accessible

#### 3. No Images Display at All
- **Cause**: Product images not uploaded or missing
- **Solution**: 
  - Check that products have images uploaded
  - Verify images exist in `uploads/products/` directory
  - The system shows a placeholder icon when images are missing

#### 4. Email Template Issues
- **Cause**: HTML email rendering problems
- **Solution**: 
  - Test emails in different email clients
  - Use inline CSS (already implemented)
  - Avoid complex HTML structures

### Testing Email Images:

1. **Test locally**:
   ```bash
   # Set SERVER_BASE_URL=http://localhost:5000 in config.env
   # Place an order and check the email
   ```

2. **Test in production**:
   ```bash
   # Set SERVER_BASE_URL to your production domain
   # Deploy and test with actual orders
   ```

3. **Email client testing**:
   - Test in Gmail, Outlook, Apple Mail
   - Check both desktop and mobile versions
   - Test with images enabled/disabled

2. **Place a test order** through the application:
   - Register/login as a user
   - Add items to cart
   - Complete the checkout process

3. **Check server logs** for email sending confirmation:
   ```
   Order confirmation email sent to user@example.com
   ```

4. **Check the recipient's email** for the order confirmation

## Email Template Features

The order confirmation email includes:

- **Professional Design**: Miorah Collections branding with orange gradient header
- **Order Summary**: Order ID, date, total amount, and item count
- **Product Details**: Itemized list with quantities and prices
- **Shipping Information**: Complete delivery address
- **Next Steps**: Information about shipping and customer support
- **Responsive Design**: Works on desktop and mobile devices

## Code Structure

### Files Added/Modified

1. **`utils/emailService.js`** - Email service utility with:
   - Nodemailer configuration
   - HTML template generation
   - Email sending functions

2. **`routes/order.js`** - Modified to include email sending:
   - Import email service
   - Send email after order creation
   - Error handling for email failures

3. **`config/config.env`** - Added email environment variables

4. **`config/config.env.example`** - Template for environment setup

### Key Functions

- `sendOrderConfirmationEmail(order, user)` - Sends order confirmation
- `generateOrderConfirmationHTML(order, user)` - Creates HTML template
- `sendEmail(to, subject, html, text)` - General email sending function

## Error Handling

The email functionality is designed to be non-blocking:

- **Order processing continues** even if email sending fails
- **Errors are logged** but don't affect the user experience
- **Email failures are captured** for debugging and retry

## Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Ensure 2-factor authentication is enabled
   - Use App Password instead of regular password
   - Check email address is correct

2. **"Connection refused" error**:
   - Check SMTP host and port settings
   - Ensure firewall allows SMTP connections
   - Verify internet connectivity

3. **Emails not received**:
   - Check spam/junk folders
   - Verify recipient email address
   - Check server logs for sending confirmation

### Debug Mode

To enable detailed email debugging, modify `utils/emailService.js`:

```javascript
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true, // Enable debug mode
    logger: true // Enable logging
  });
};
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use App Passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor email sending** for suspicious activity
5. **Use environment variables** for all sensitive data

## Future Enhancements

Possible improvements to consider:

- **Email queue system** for reliable delivery
- **Template customization** through admin panel
- **Email analytics** and tracking
- **Multiple email templates** for different events
- **Bulk email functionality** for marketing
- **Email verification** for user registration

## Support

For issues with email functionality:

1. Check server logs for error messages
2. Verify environment configuration
3. Test SMTP connection manually
4. Contact support at support@miorahcollections.com

## Dependencies

- **nodemailer**: ^6.9.7 (automatically installed)
- **dotenv**: ^16.0.1 (existing dependency)

## API Integration

The email functionality integrates seamlessly with the existing order API:

```javascript
// Order creation automatically triggers email
POST /api/orders
{
  "user": "user_id",
  "products": [...],
  "amount": 100.00,
  "address": {...}
}
```

No additional API calls needed - emails are sent automatically when orders are created. 