const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const { verifyTokenAndAdmin, verifyToken } = require("../middleware/auth");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// @ route GET api/products
// @ desc  Get all products
// @ access Public
router.get("/", async (req, res) => {
  const queryNew = req.query.new;
  const queryCategory = req.query.category;
  const queryFeatured = req.query.featured;
  
  try {
    let products;
    if (queryNew) {
      products = await Product.find({ is_active: true })
                              .sort({ createdAt: -1 })
                              .limit(5)
                              .populate('category_id');
    } else if (queryCategory) {
      products = await Product.find({ 
        category_id: queryCategory,
        is_active: true 
      }).populate('category_id');
    } else if (queryFeatured) {
      products = await Product.find({ 
        is_featured: true,
        is_active: true 
      }).populate('category_id');
    } else {
      products = await Product.find({ is_active: true }).populate('category_id');
    }
    
    // Get images for each product
    const productsWithImages = await Promise.all(products.map(async (product) => {
      const images = await ProductImage.find({ product_id: product._id });
      return {
        ...product._doc,
        images
      };
    }));
    
    res.status(200).json(productsWithImages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/products/:id
// @ desc  Get product by ID
// @ access Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category_id');
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    
    // Get images for the product
    const images = await ProductImage.find({ product_id: product._id });
    
    res.status(200).json({
      ...product._doc,
      images
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "product doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route POST api/products
// @ desc  Create new product
// @ access Private (Admin only)
router.post(
  "/",
  verifyTokenAndAdmin,
  [
    body("name", "Please enter a product name").not().isEmpty(),
    body("category_id", "Please select a category").not().isEmpty(),
    body("description", "Please enter a description").not().isEmpty(),
    body("price", "Please enter a valid price").isNumeric(),
    body("stock_quantity", "Please enter a valid quantity").isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // CREATE A NEW PRODUCT
      const product = new Product(req.body);
      const newProduct = await product.save();

      // Process images if provided
      if (req.body.images && Array.isArray(req.body.images)) {
        const imagePromises = req.body.images.map((image, index) => {
          return new ProductImage({
            product_id: newProduct._id,
            image_url: image.image_url,
            is_primary: index === 0 // Make first image primary by default
          }).save();
        });
        
        // Wait for all images to be saved
        const savedImages = await Promise.all(imagePromises);
        
        // Return product with images
        return res.status(201).json({
          ...newProduct._doc,
          images: savedImages
        });
      }
      
      // Return just the product if no images
      res.status(201).json(newProduct);
    } catch (err) {
      if (err.name === "CastError") {
        return res.status(400).json({ msg: "Invalid data format" });
      }
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
