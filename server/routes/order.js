const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Order = require("../models/Order");
const User = require("../models/User");
const {
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
  verifyToken,
} = require("../middleware/auth");
const { sendOrderConfirmationEmail } = require("../utils/emailService");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// @ route GET api/order/admin
// @ desc  Get all orders with pagination, filtering, and search (for admin)
// @ access Private (Admin only)
router.get("/admin", verifyTokenAndAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    // Build query object
    const query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Search in customer name, email, or order ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'address.firstname': searchRegex },
        { 'address.lastname': searchRegex },
        { 'address.email': searchRegex },
        { paymentID: searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstname lastname email username')
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/order/admin/:id
// @ desc  Get single order details (for admin)
// @ access Private (Admin only)
router.get("/admin/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstname lastname email username phone')
      .lean();

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid order ID" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route PUT api/order/admin/:id/status
// @ desc  Update order status (for admin)
// @ access Private (Admin only)
router.put("/admin/:id/status", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status. Must be one of: " + validStatuses.join(', ') });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Update order status
    order.status = status;
    await order.save();

    // Populate user info for response
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstname lastname email username')
      .lean();

    res.status(200).json({
      msg: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid order ID" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/order/admin/stats
// @ desc  Get order statistics (for admin dashboard)
// @ access Private (Admin only)
router.get("/admin/stats", verifyTokenAndAdmin, async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await Order.countDocuments();
    
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get today's orders
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    // Get this month's revenue
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstname lastname')
      .lean();

    res.status(200).json({
      totalOrders,
      ordersByStatus,
      todaysOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      recentOrders
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/order
// @ desc  Get orders of all user (legacy endpoint)
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/order
// @ desc  Get user orders
// @ access Private
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const order = await Order.find({ user: req.params.id });
    res.status(200).json(order);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "order doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route GET api/order/income
// @ desc  Get monthly income
// @ access Private
router.get("/income", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const prevMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));
  try {
    const income = await Order.aggregate([
      { $match: { createdAt: { $gte: prevMonth } } },
      { $project: { month: { $month: "$createdAt" }, sales: "$amount" } },
      { $group: { _id: "$month", total: { $sum: "$sales" } } },
    ]);
    res.status(200).json(income);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});



// @ route POST api/order/guest
// @ desc  Create new guest order (no authentication required)
// @ access Public
router.post(
  "/guest",
  body("products", "Please enter atleast one product").not().isEmpty(),
  body("amount", "Please enter its amount").not().isEmpty(),
  body("address", "Please enter the address").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // For guest orders, user field can be null
      let order = new Order({
        ...req.body,
        user: null // Guest order doesn't have a user ID
      });

      let newOrder = await order.save();

      // Send order confirmation email for guest orders
      try {
        // For guest orders, use address email information
        if (req.body.address && req.body.address.email) {
          const guestUser = {
            firstname: req.body.address.firstname || 'Guest',
            lastname: req.body.address.lastname || 'Customer',
            email: req.body.address.email
          };
          await sendOrderConfirmationEmail(newOrder, guestUser);
          console.log(`Guest order confirmation email sent to ${guestUser.email}`);
        }
      } catch (emailError) {
        // Log email error but don't fail the order creation
        console.error('Failed to send guest order confirmation email:', emailError.message);
      }

      res.status(200).json(newOrder);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route POST api/order
// @ desc  Create new order (for authenticated users)
// @ access Private
router.post(
  "/",
  verifyToken,
  body("user", "Please enter a user id").not().isEmpty(),
  body("products", "Please enter atleast one product").not().isEmpty(),
  body("amount", "Please enter its amount").not().isEmpty(),
  body("address", "Please enter the address").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let order = new Order(req.body);

      let newOrder = await order.save();

      // Send order confirmation email
      try {
        // Get user details for email
        const user = await User.findById(req.body.user);
        if (user && user.email) {
          await sendOrderConfirmationEmail(newOrder, user);
          console.log(`Order confirmation email sent to ${user.email}`);
        }
      } catch (emailError) {
        // Log email error but don't fail the order creation
        console.error('Failed to send order confirmation email:', emailError.message);
        // Could optionally store this in a queue for retry
      }

      res.status(200).json(newOrder);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/order
// @desc      Update order
// @ access   Private
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Order doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/order
// @ desc     Delete order
// @ access   Private
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "order is successfully deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "order doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
