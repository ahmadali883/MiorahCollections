const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const { logUserActivity } = require("../utils/errorLogger");

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate contact form email HTML
const generateContactEmailHTML = (formData) => {
  const { name, email, phone, subject, message, marketingConsent } = formData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission - Miorah Collections</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff7d1a, #ff9a42); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .field { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .field-label { font-weight: bold; color: #ff7d1a; margin-bottom: 5px; }
        .field-value { color: #333; }
        .message-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-top: 10px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Contact Form Submission</h1>
          <p>Miorah Collections - Contact Form</p>
        </div>
        
        <div class="content">
          <h2>Contact Details</h2>
          
          <div class="field">
            <div class="field-label">👤 Name:</div>
            <div class="field-value">${name}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📧 Email:</div>
            <div class="field-value">${email}</div>
          </div>
          
          ${phone ? `
          <div class="field">
            <div class="field-label">📞 Phone:</div>
            <div class="field-value">${phone}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="field-label">📋 Subject:</div>
            <div class="field-value">${subject}</div>
          </div>
          
          <div class="field">
            <div class="field-label">💬 Message:</div>
            <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📬 Marketing Consent:</div>
            <div class="field-value">${marketingConsent ? '✅ Yes - Agreed to receive marketing communications' : '❌ No - Did not agree to marketing communications'}</div>
          </div>
          
          <div class="field">
            <div class="field-label">🕒 Submitted At:</div>
            <div class="field-value">${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent from the Miorah Collections contact form on your website.</p>
          <p>Please respond to the customer at: <strong>${email}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate customer confirmation email
const generateCustomerConfirmationHTML = (customerName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thank You for Contacting Miorah Collections</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff7d1a, #ff9a42); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .contact-info { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background: #ff7d1a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💎 Thank You for Contacting Us!</h1>
          <p>Miorah Collections - Premium Artificial Jewelry</p>
        </div>
        
        <div class="content">
          <h2>Dear ${customerName},</h2>
          
          <p>Thank you for reaching out to <strong>Miorah Collections</strong>! We have received your message and truly appreciate your interest in our premium artificial jewelry collection.</p>
          
          <p>Our team will review your inquiry and respond within <strong>24 hours</strong>. We're committed to providing you with the best customer service and helping you find the perfect jewelry pieces.</p>
          
          <div class="contact-info">
            <h3>📞 Need Immediate Assistance?</h3>
            <p><strong>Phone:</strong> <a href="tel:+923448066483">+92 344 8066483</a></p>
            <p><strong>Email:</strong> <a href="mailto:miorahcollectionsofficial@gmail.com">miorahcollectionsofficial@gmail.com</a></p>
            <p><strong>Business Hours:</strong><br>
            Monday - Saturday: 9:00 AM - 8:00 PM<br>
            Sunday: 10:00 AM - 6:00 PM</p>
          </div>
          
          <p>In the meantime, feel free to browse our latest collections on our website and follow us on social media for updates on new arrivals and special offers.</p>
          
          <p>Thank you for choosing Miorah Collections!</p>
          
          <p>Best regards,<br>
          <strong>The Miorah Collections Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 Miorah Collections. All rights reserved.</p>
          <p>This is an automated confirmation email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// @ route POST /api/contact
// @ desc Handle contact form submission
// @ access Public
router.post(
  "/",
  [
    body("name", "Name is required").notEmpty().trim().isLength({ min: 2, max: 100 }),
    body("email", "Please provide a valid email").isEmail().normalizeEmail(),
    body("phone").optional({ nullable: true }).trim(),
    body("subject", "Subject is required").notEmpty().trim(),
    body("message", "Message is required").notEmpty().trim().isLength({ min: 10, max: 1000 }),
    body("marketingConsent", "Marketing consent must be a boolean").isBoolean()
  ],
  async (req, res) => {
    console.log('Contact form data received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Please check your input and try again.",
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message, marketingConsent } = req.body;

    try {
      // Create transporter
      const transporter = createTransporter();

      // Verify transporter
      await transporter.verify();

      // Send email to business
      const businessEmailHtml = generateContactEmailHTML(req.body);
      const businessEmailOptions = {
        from: process.env.EMAIL_USER,
        to: 'miorahcollectionsofficial@gmail.com',
        subject: `New Contact Form: ${subject} - From ${name}`,
        html: businessEmailHtml,
        text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${subject}\nMessage: ${message}\nMarketing Consent: ${marketingConsent ? 'Yes' : 'No'}`
      };

      await transporter.sendMail(businessEmailOptions);

      // Send confirmation email to customer
      const customerEmailHtml = generateCustomerConfirmationHTML(name);
      const customerEmailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank You for Contacting Miorah Collections',
        html: customerEmailHtml,
        text: `Dear ${name},\n\nThank you for contacting Miorah Collections! We have received your message and will respond within 24 hours.\n\nFor immediate assistance, please call us at +92 344 8066483.\n\nBest regards,\nThe Miorah Collections Team`
      };

      await transporter.sendMail(customerEmailOptions);

      // Log the contact form submission
      logUserActivity(null, 'CONTACT_FORM_SUBMITTED', {
        name,
        email,
        subject,
        hasPhone: !!phone,
        marketingConsent,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: "Thank you for your message! We'll get back to you within 24 hours."
      });

    } catch (error) {
      console.error('Contact form error:', error);
      
      // Log the error
      logUserActivity(null, 'CONTACT_FORM_ERROR', {
        error: error.message,
        name,
        email,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: "Sorry, there was an error sending your message. Please try again or contact us directly at +92 344 8066483."
      });
    }
  }
);

// @ route GET /api/contact/test
// @ desc Test email configuration
// @ access Private (for testing purposes)
router.get("/test", async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ success: true, message: "Email configuration is working!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Email configuration error", error: error.message });
  }
});

module.exports = router; 