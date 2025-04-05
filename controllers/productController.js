const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("image");

// Add a product
const addProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ message: "Image upload failed", error: err });
    }

    try {
      const { sellerEmail, name, category, price, stock } = req.body;
      if (!sellerEmail || !name || !category || !price || !stock) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Image URL handling
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

      const newProduct = new Product({
        sellerEmail,
        name,
        category,
        price,
        stock,
        imageUrl,
      });

      await newProduct.save();
      res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ message: "Server Error", error });
    }
  });
};

// Export the function
module.exports = { addProduct };
