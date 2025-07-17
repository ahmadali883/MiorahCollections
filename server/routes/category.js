const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Category = require("../models/Category");
const { verifyTokenAndAdmin } = require("../middleware/auth");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// @ route GET api/categories
// @ desc  Get all categories
// @ access Public
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/categories/:id
// @ desc  Get category by ID
// @ access Public
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Category doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route POST api/categories
// @ desc  Create new category
// @ access Private (Admin only)
router.post(
  "/",
  verifyTokenAndAdmin,
  [body("name", "Please enter a category name").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newCategory = new Category(req.body);
      const savedCategory = await newCategory.save();
      res.status(201).json(savedCategory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route PUT api/categories/:id
// @ desc  Update category
// @ access Private (Admin only)
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ msg: "Category not found" });
    }
    
    res.status(200).json(updatedCategory);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Category doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route DELETE api/categories/:id
// @ desc  Delete category
// @ access Private (Admin only)
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    
    res.status(200).json({ msg: "Category successfully deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Category doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
