const mongoose = require("mongoose");

const ProductImageSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    image_url: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductImage", ProductImageSchema);
