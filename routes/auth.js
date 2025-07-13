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
  body("email", "Please include a valid email").isEmail(),
  body("password", "Password is required").exists(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: "Email is invalid" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Password is invalid" });
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

      // TODO: Implement actual email sending with reset token
      // For now, just respond with success message
      console.log(`Password reset requested for user: ${user.email}`);
      
      res.json({ 
        message: "Password reset instructions have been sent to your email address." 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
