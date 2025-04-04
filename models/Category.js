const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true } // This adds created_at and updated_at automatically
);

module.exports = mongoose.model("Category", CategorySchema);
