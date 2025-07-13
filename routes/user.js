const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyTokenAndAdmin } = require("../middleware/auth");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// @ route GET api/user
// @ desc  Get registered user
// @ access Private
router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/user
// @ desc  Get registered user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const users = query
      ? await User.find().sort({ _id: -1 }).limit(5)
      : await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/user/stats
// @ desc  Get total number of users per month
// @ access Private
router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      { $project: { month: { $month: "$createdAt" } } },
      { $group: { _id: "$month", total: { $sum: 1 } } },
    ]);
    res.status(200).json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route POST api/user
// @ desc  Register user
// @ access Public
router.post(
  "/",
  body("firstname", "Please enter your first name")
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),
  body("lastname", "Please enter your last name")
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),
  body("username", "Please enter a username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email", "Please include a valid email").isEmail(),
  body("password", "Please enter a valid password")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { firstname, lastname, username, email, password } = req.body;

    try {
      // Check if user already exists by email
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "User with this email already exists" });
      }

      // Check if username already exists
      existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ msg: "Username already taken" });
      }

      // Generate email verification token
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // CREATE A NEW USER
      const user = new User({
        firstname,
        lastname,
        username,
        email,
        password,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationTokenExpiry
      });

      let salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Send email verification
      try {
        const emailService = require('../utils/emailService');
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        
        await emailService.sendEmailVerificationEmail(user.email, user.firstname, verificationUrl, verificationToken);
        
        res.status(201).json({ 
          message: "Registration successful! Please check your email to verify your account before logging in.",
          emailSent: true,
          email: user.email
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        
        // Delete the user if email fails to send
        await User.findByIdAndDelete(user._id);
        
        res.status(500).json({ 
          msg: "Registration failed. Unable to send verification email. Please try again." 
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route PUT api/users/:id/admin
// @ desc  Set or remove admin status for a user
// @ access Private (Admin only)
router.put("/:id/admin", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Toggle admin status
    user.isAdmin = !user.isAdmin;
    await user.save();
    
    res.status(200).json({ 
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      message: `User ${user.username} admin status set to ${user.isAdmin}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
