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

// @ route PUT api/products/:id
// @ desc  Update product
// @ access Private (Admin only)
router.put(
  "/:id",
  verifyTokenAndAdmin,
  [
    body("name", "Please enter a product name").optional().not().isEmpty(),
    body("category_id", "Please select a category").optional().not().isEmpty(),
    body("description", "Please enter a description").optional().not().isEmpty(),
    body("price", "Please enter a valid price").optional().isNumeric(),
    body("stock_quantity", "Please enter a valid quantity").optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).populate('category_id');

      // Handle image updates if provided
      if (req.body.images && Array.isArray(req.body.images)) {
        // Remove existing images
        await ProductImage.deleteMany({ product_id: req.params.id });
        
        // Add new images
        const imagePromises = req.body.images.map((image, index) => {
          return new ProductImage({
            product_id: req.params.id,
            image_url: image.image_url,
            is_primary: index === 0
          }).save();
        });
        
        const savedImages = await Promise.all(imagePromises);
        
        return res.status(200).json({
          ...updatedProduct._doc,
          images: savedImages
        });
      }

      // Get existing images
      const images = await ProductImage.find({ product_id: req.params.id });
      
      res.status(200).json({
        ...updatedProduct._doc,
        images
      });
    } catch (err) {
      if (err.name === "CastError") {
        return res.status(400).json({ msg: "Product doesn't exist" });
      }
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route DELETE api/products/:id
// @ desc  Delete product (soft delete by setting is_active to false)
// @ access Private (Admin only)
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Soft delete by setting is_active to false
    await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { is_active: false } },
      { new: true }
    );

    res.status(200).json({ msg: "Product deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Product doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/products/inventory/low-stock
// @ desc  Get products with low stock
// @ access Private (Admin only)
router.get("/inventory/low-stock", verifyTokenAndAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10; // Default threshold of 10
    
    const lowStockProducts = await Product.find({
      stock_quantity: { $lte: threshold },
      is_active: true
    }).populate('category_id').sort({ stock_quantity: 1 });

    // Get images for each product
    const productsWithImages = await Promise.all(lowStockProducts.map(async (product) => {
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

// @ route GET api/products/inventory/stats
// @ desc  Get inventory statistics
// @ access Private (Admin only)
router.get("/inventory/stats", verifyTokenAndAdmin, async (req, res) => {
  try {
    // Get total products
    const totalProducts = await Product.countDocuments({ is_active: true });
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { is_active: true } },
      { $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $group: {
          _id: '$category.name',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock_quantity'] } }
        }
      }
    ]);

    // Get low stock count
    const lowStockThreshold = 10;
    const lowStockCount = await Product.countDocuments({
      stock_quantity: { $lte: lowStockThreshold },
      is_active: true
    });

    // Get out of stock count
    const outOfStockCount = await Product.countDocuments({
      stock_quantity: 0,
      is_active: true
    });

    // Get total inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { is_active: true } },
      { $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$stock_quantity'] } },
          totalItems: { $sum: '$stock_quantity' }
        }
      }
    ]);

    // Get recently added products (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      is_active: true
    });

    res.status(200).json({
      totalProducts,
      productsByCategory,
      lowStockCount,
      outOfStockCount,
      lowStockThreshold,
      inventoryValue: inventoryValue[0] || { totalValue: 0, totalItems: 0 },
      recentProducts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route PUT api/products/inventory/bulk-update
// @ desc  Bulk update products
// @ access Private (Admin only)
router.put("/inventory/bulk-update", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { productIds, updates, operation } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ msg: "Please provide product IDs" });
    }

    if (!updates || !operation) {
      return res.status(400).json({ msg: "Please provide updates and operation type" });
    }

    let result;
    const filter = { _id: { $in: productIds }, is_active: true };

    switch (operation) {
      case 'price_update':
        if (updates.priceType === 'percentage') {
          // Percentage increase/decrease
          const multiplier = 1 + (updates.percentage / 100);
          result = await Product.updateMany(
            filter,
            [{ $set: { price: { $multiply: ['$price', multiplier] } } }]
          );
        } else if (updates.priceType === 'fixed') {
          // Fixed amount increase/decrease
          result = await Product.updateMany(
            filter,
            [{ $set: { price: { $add: ['$price', updates.amount] } } }]
          );
        } else if (updates.priceType === 'set') {
          // Set specific price
          result = await Product.updateMany(
            filter,
            { $set: { price: updates.newPrice } }
          );
        }
        break;

      case 'category_update':
        result = await Product.updateMany(
          filter,
          { $set: { category_id: updates.categoryId } }
        );
        break;

      case 'stock_update':
        if (updates.stockType === 'add') {
          result = await Product.updateMany(
            filter,
            [{ $set: { stock_quantity: { $add: ['$stock_quantity', updates.quantity] } } }]
          );
        } else if (updates.stockType === 'subtract') {
          result = await Product.updateMany(
            filter,
            [{ $set: { stock_quantity: { $max: [{ $subtract: ['$stock_quantity', updates.quantity] }, 0] } } }]
          );
        } else if (updates.stockType === 'set') {
          result = await Product.updateMany(
            filter,
            { $set: { stock_quantity: updates.quantity } }
          );
        }
        break;

      case 'feature_update':
        result = await Product.updateMany(
          filter,
          { $set: { is_featured: updates.featured } }
        );
        break;

      case 'status_update':
        result = await Product.updateMany(
          filter,
          { $set: { is_active: updates.active } }
        );
        break;

      default:
        return res.status(400).json({ msg: "Invalid operation type" });
    }

    res.status(200).json({
      msg: "Bulk update completed successfully",
      modifiedCount: result.modifiedCount,
      operation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/products/admin
// @ desc  Get all products for admin (including inactive)
// @ access Private (Admin only)
router.get("/admin/all", verifyTokenAndAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      stockStatus
    } = req.query;

    // Build query
    const query = {};
    
    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category_id = category;
    }

    // Status filter
    if (status === 'active') {
      query.is_active = true;
    } else if (status === 'inactive') {
      query.is_active = false;
    }

    // Stock status filter
    if (stockStatus === 'low') {
      query.stock_quantity = { $lte: 10 };
    } else if (stockStatus === 'out') {
      query.stock_quantity = 0;
    } else if (stockStatus === 'available') {
      query.stock_quantity = { $gt: 10 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .populate('category_id', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get images for products
    const productsWithImages = await Promise.all(products.map(async (product) => {
      const images = await ProductImage.find({ product_id: product._id });
      return {
        ...product,
        images
      };
    }));

    // Get total count
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products: productsWithImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
