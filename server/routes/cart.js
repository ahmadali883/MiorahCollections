const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Cart = require("../models/Cart");
const {
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
  verifyToken,
} = require("../middleware/auth");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// @ route GET api/cart
// @ desc  Get carts of all user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json(carts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route GET api/cart
// @ desc  Get user cart
// @ access Private
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.id });
    if (!cart) {
      return res.status(200).json(null); // Return null if no cart exists
    }
    res.status(200).json(cart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route POST api/cart
// @ desc  Create new cart
// @ access Private
router.post(
  "/",
  verifyToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if cart already exists for this user
      const existingCart = await Cart.findOne({ userId: req.body.userId });
      if (existingCart) {
        return res.status(400).json({ msg: "Cart already exists for this user" });
      }

      // Validate and clean cart products
      const validatedProducts = validateCartProducts(req.body.products || []);

      let cart = new Cart({
        ...req.body,
        products: validatedProducts
      });
      let newCart = await cart.save();

      res.status(200).json(newCart);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Helper function to validate and clean cart products
const validateCartProducts = (products) => {
  if (!Array.isArray(products)) return [];
  
  return products
    .filter(item => {
      return (
        item &&
        typeof item === 'object' &&
        item.id &&
        item.product &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        typeof item.itemTotal === 'number' &&
        item.itemTotal >= 0
      );
    })
    .map(item => ({
      id: item.id,
      product: item.product,
      quantity: Math.min(100, Math.max(1, Math.floor(item.quantity))), // Cap at 100, minimum 1
      itemTotal: parseFloat(item.itemTotal.toFixed(2))
    }));
};

// @ route    PUT api/cart
// @desc      Update cart
// @ access   Private
router.put("/:id", verifyTokenAndAuthorization , async (req, res) => {
  try {
    // Validate and clean cart products
    const validatedProducts = validateCartProducts(req.body.products || []);
    
    const cart = await Cart.findOne({ userId: req.params.id });
    
    if (!cart) {
      // Create new cart if it doesn't exist
      const newCart = new Cart({
        userId: req.params.id,
        products: validatedProducts
      });
      const savedCart = await newCart.save();
      return res.status(200).json(savedCart);
    }
    
    // Update existing cart with validated products
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.params.id },
      { $set: { ...req.body, products: validatedProducts } },
      { new: true, upsert: false }
    );
    res.status(200).json(updatedCart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/cart
// @ desc     Delete cart
// @ access   Private
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const result = await Cart.findOneAndDelete({ userId: req.params.id });
    if (!result) {
      return res.status(404).json({ msg: "Cart not found" });
    }
    res.status(200).json({ msg: "Cart is successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
