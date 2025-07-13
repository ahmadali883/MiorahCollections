const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  tokenBlacklist,
} = require("../middleware/auth");
const User = require("../models/User");
const dotenv = require("dotenv");
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// tokenBlacklist is now imported from middleware/auth.js to avoid circular dependency

// @ route    GET api/auth
// @desc      Get logged in user
// @ access   Private
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    POST api/auth/refresh
// @desc      Refresh JWT token
// @ access   Private
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({ msg: "User doesn't exist" });
    }

    // Generate new token with extended expiration
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWTSECRET,
      {
        expiresIn: '24h', // Fresh 24 hour token
      },
      (error, token) => {
        if (error) {
          console.error('Token refresh error:', error);
          return res.status(500).json({ msg: "Token refresh failed" });
        }
        res.json({ 
          token,
          message: "Token refreshed successfully",
          expiresIn: '24h'
        });
      }
    );
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    POST api/auth/logout
// @desc      Logout user and invalidate token
// @ access   Private
router.post("/logout", verifyToken, async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    
    // Add token to blacklist
    if (token) {
      tokenBlacklist.add(token);
      
      // Optional: Clean up old tokens periodically
      // In production, implement proper cleanup mechanism
      if (tokenBlacklist.size > 10000) {
        tokenBlacklist.clear();
      }
    }

    res.json({ 
      message: "Logged out successfully",
      success: true 
    });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    POST api/auth
// @ desc     authenticate (Login) user & get token
// @ access   Public
router.post(
  "/",
  body("email", "Please enter your email or username").notEmpty(),
  body("password", "Password is required").exists(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      // Try to find user by email first, then by username
      let user = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      });

      if (!user) {
        return res.status(400).json({ 
          msg: "Invalid email/username or password. Please check your credentials and try again." 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          msg: "Invalid email/username or password. Please check your credentials and try again." 
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(400).json({ 
          msg: "Please verify your email address to complete login. Check your inbox for verification instructions.",
          emailVerified: false,
          email: user.email,
          username: user.username,
          requiresVerification: true
        });
      }

      const payload = {
        user: {
          id: user.id,
          isAdmin: user.isAdmin,
        },
      };
      jwt.sign(
        payload,
        process.env.JWTSECRET,
        {
          expiresIn: '24h',
        },
        (error, token) => {
          if (error) throw error;
          const { password, ...others } = user._doc; 
          res.json({
            token, 
            user: {
              ...others,
              isAdmin: user.isAdmin // Explicitly include isAdmin
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/auth
// @desc      Update user
// @ access   Private
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { password, currentPassword, ...others } = req.body;
    const user = await User.findById(req.params.id);
    let newPassword;
    // if (!user) {
    //   return res.status(400).json({ msg: "user doesn't exist" });
    // }
    if (password) {
      let salt = await bcrypt.genSalt(10);
      newPassword = await bcrypt.hash(req.body.password, salt);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password isn't correct" });
      }
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          ...others,
          password: newPassword,
        },
      },
      // To ensure it returns the updated User
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/auth
// @ desc     Delete user
// @ access   Private
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    res.status(200).json({ msg: "User is successfully deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    POST api/auth/check-availability
// @desc      Check if username or email is available
// @ access   Public
router.post("/check-availability",
  async (req, res) => {
    try {
      const { username, email } = req.body;
      const result = { available: true, message: "" };

      if (username) {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          result.available = false;
          result.message = "Username already taken";
          result.field = "username";
        }
      }

      if (email && result.available) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          result.available = false;
          result.message = "Email already exists";
          result.field = "email";
        }
      }

      res.json(result);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @ route    POST api/auth/forgot-password
// @desc      Send password reset email
// @ access   Public
router.post("/forgot-password", 
  body("email", "Please include a valid email").isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          message: "If an account with that email exists, you will receive password reset instructions." 
        });
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      // Store reset token in user document
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Send email with reset link
      const emailService = require('../utils/emailService');
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
      await emailService.sendPasswordResetEmail(user.email, user.firstname, resetUrl, resetToken);
      
      res.json({ 
        message: "Password reset instructions have been sent to your email address." 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @ route    POST api/auth/reset-password
// @desc      Reset password with token
// @ access   Public
router.post("/reset-password",
  body("token", "Reset token is required").not().isEmpty(),
  body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ msg: "Invalid or expired reset token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      
      // Clear reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();

      res.json({ message: "Password has been reset successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @ route    POST api/auth/verify-email
// @desc      Verify email with token
// @ access   Public
router.post("/verify-email",
  body("token", "Verification token is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { token } = req.body;

    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ msg: "Invalid or expired verification token" });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ msg: "Email is already verified" });
      }

      // Verify the email
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();

      res.json({ 
        message: "Email verified successfully! You can now log in to your account.",
        emailVerified: true,
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @ route    POST api/auth/resend-verification
// @desc      Resend email verification
// @ access   Public
router.post("/resend-verification",
  body("email", "Please include a valid email").isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ msg: "No account found with this email address" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ msg: "Email is already verified" });
      }

      // Generate new verification token
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Update user with new token
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = verificationTokenExpiry;
      await user.save();

      // Send verification email
      try {
        const emailService = require('../utils/emailService');
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        
        await emailService.sendEmailVerificationEmail(user.email, user.firstname, verificationUrl, verificationToken);
        
        res.json({ 
          message: "Verification email has been sent. Please check your email.",
          emailSent: true
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(500).json({ msg: "Failed to send verification email. Please try again." });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

module.exports = router;
