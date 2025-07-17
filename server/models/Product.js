const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount_price: { type: Number },
    stock_quantity: { type: Number, required: true, default: 0 },
    sku: { type: String },
    is_featured: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true } // This adds created_at and updated_at automatically
);

module.exports = mongoose.model("Product", ProductSchema);
