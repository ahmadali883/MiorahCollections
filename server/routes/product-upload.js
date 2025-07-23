const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const { verifyTokenAndAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { cloudinary } = require("../config/cloudinary");

// Multer error handling middleware
const handleMulterError = (req, res, next) => {
  const uploadMiddleware = upload.array('product_images', 10);
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          msg: 'File size too large. Maximum allowed size is 15MB per file.',
          error: 'FILE_TOO_LARGE'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          msg: 'Too many files. Maximum allowed is 10 files.',
          error: 'TOO_MANY_FILES'
        });
      }
      
      if (err.message === 'Only JPG, PNG and WEBP images are allowed') {
        return res.status(400).json({ 
          msg: 'Invalid file type. Only JPG, PNG and WEBP images are allowed.',
          error: 'INVALID_FILE_TYPE'
        });
      }
      
      return res.status(400).json({ 
        msg: 'File upload error: ' + err.message,
        error: 'UPLOAD_ERROR'
      });
    }
    
    next();
  });
};

// @ route POST api/products/upload
// @ desc Create product with image upload
// @ access Private (Admin only)
router.post(
  "/upload",
  verifyTokenAndAdmin,
  handleMulterError, // Use our error handling wrapper
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
      // Delete uploaded files from Cloudinary if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(async (file) => {
          try {
            await cloudinary.uploader.destroy(file.public_id);
          } catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
          }
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Create product
      const productData = {
        name: req.body.name,
        category_id: req.body.category_id,
        description: req.body.description,
        price: req.body.price,
        stock_quantity: req.body.stock_quantity
      };
      
      // Optional fields
      if (req.body.discount_price) productData.discount_price = req.body.discount_price;
      if (req.body.sku) productData.sku = req.body.sku;
      if (req.body.is_featured) productData.is_featured = req.body.is_featured === 'true';
      
      const product = new Product(productData);
      const savedProduct = await product.save();

      // Process uploaded images
      const imagePromises = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          // Use Cloudinary URL for the image
          const imageUrl = file.path; // Cloudinary provides the full URL in file.path
          
          const productImage = new ProductImage({
            product_id: savedProduct._id,
            image_url: imageUrl,
            public_id: file.public_id, // Store Cloudinary public_id for deletion
            is_primary: index === 0 // First image is primary
          });
          
          imagePromises.push(productImage.save());
        });
      }

      // Save all images and return complete product data
      const savedImages = await Promise.all(imagePromises);
      
      res.status(201).json({
        product: savedProduct,
        images: savedImages
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route PUT api/products/:id/upload
// @ desc Add images to existing product
// @ access Private (Admin only)
router.put(
  "/:id/upload",
  verifyTokenAndAdmin,
  handleMulterError, // Use our error handling wrapper
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        // Delete uploaded files from Cloudinary if product not found
        if (req.files && req.files.length > 0) {
          req.files.forEach(async (file) => {
            try {
              await cloudinary.uploader.destroy(file.public_id);
            } catch (error) {
              console.error('Error deleting file from Cloudinary:', error);
            }
          });
        }
        return res.status(404).json({ msg: "Product not found" });
      }

      // Process uploaded images
      const imagePromises = [];
      if (req.files && req.files.length > 0) {
        const existingImages = await ProductImage.find({ product_id: product._id });
        const isFirstUpload = existingImages.length === 0;
        
        req.files.forEach((file, index) => {
          const imageUrl = file.path; // Cloudinary URL
          
          const productImage = new ProductImage({
            product_id: product._id,
            image_url: imageUrl,
            public_id: file.public_id, // Store Cloudinary public_id
            is_primary: isFirstUpload && index === 0 // Only set primary if it's the first image ever uploaded
          });
          
          imagePromises.push(productImage.save());
        });
      }

      const savedImages = await Promise.all(imagePromises);
      const allImages = await ProductImage.find({ product_id: product._id });
      
      res.status(200).json({
        product,
        newImages: savedImages,
        allImages: allImages
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route DELETE api/products/images/:id
// @ desc Delete product image
// @ access Private (Admin only)
router.delete("/images/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const image = await ProductImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ msg: "Image not found" });
    }

    // Delete file from Cloudinary if public_id exists
    if (image.public_id) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
      }
    }

    // If removing primary image, set another image as primary
    if (image.is_primary) {
      const otherImage = await ProductImage.findOne({ 
        product_id: image.product_id,
        _id: { $ne: image._id }
      });
      
      if (otherImage) {
        otherImage.is_primary = true;
        await otherImage.save();
      }
    }

    await image.remove();
    res.status(200).json({ msg: "Image removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route PUT api/products/images/:id/primary
// @ desc Set image as primary
// @ access Private (Admin only)
router.put("/images/:id/primary", verifyTokenAndAdmin, async (req, res) => {
  try {
    const image = await ProductImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ msg: "Image not found" });
    }

    // Remove primary flag from all other images of this product
    await ProductImage.updateMany(
      { product_id: image.product_id },
      { $set: { is_primary: false } }
    );

    // Set this image as primary
    image.is_primary = true;
    await image.save();

    res.status(200).json(image);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
