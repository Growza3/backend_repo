const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  sellerEmail: { type: String, required: true, lowercase: true },  
  name: { type: String, required: true }, // Product name
  category: { type: String, required: true }, // Product category
  price: { type: Number, required: true }, // Price
  stock: { type: Number, required: true }, // Available stock
  status: { type: String, default: "pending" },
  // Allow multiple images instead of a single image
  images: { type: [String], required: true }, // Array of image URLs

  // New Fields
  overview: { type: String, required: true }, // Brief description of the product
  productFeatures: { type: [String], required: true }, // Features (e.g., organic, pesticide-free)
  nutritionalInfo: { type: String }, // Nutritional details for food products
  usageInstructions: { type: String }, // How to store, consume, or use the product

  // Farm-to-table process
  farmToTableProcess: [
    {
      step: { type: String, required: true }, // Step name (Farming, Harvesting, etc.)
      details: { type: String, required: true }, // Details about the step
    }
  ],

  createdAt: { type: Date, default: Date.now }, // Timestamp
});

// Exporting the model
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
