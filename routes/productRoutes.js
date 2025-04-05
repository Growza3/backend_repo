const express = require("express");
const Product = require("../models/Product");
const upload = require("../middleware/upload");

const router = express.Router();

/// Add to Cart



// Fetch all products for a specific seller
router.get("/seller/:sellerEmail", async (req, res) => {
  try {
    const products = await Product.find({ sellerEmail: req.params.sellerEmail });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch all products with correct image URLs
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}, "name category stock price images status overview usageInstructions productFeatures");
    const updatedProducts = products.map(product => ({
      ...product._doc,
      images: product.images.map(img => `http://localhost:5000/uploads/${img}`)
    }));
    res.json({ success: true, products: updatedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch single product with correct image URLs
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const images = product.images.map(img => `http://localhost:5000/uploads/${img}`);

    res.json({ ...product._doc, images });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Admin updates product status (approve/reject)
router.put("/update-status/:productId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      { status },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add a new product with image upload
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { sellerEmail, name, category, price, stock, overview, nutritionalInfo, usageInstructions, productFeatures, farmToTableProcess } = req.body;

    if (!sellerEmail || !name || !category || !price || !stock) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const images = req.files.map(file => file.filename);
    let parsedProductFeatures = [];
    let parsedFarmToTable = [];

    try {
      parsedProductFeatures = JSON.parse(productFeatures || "[]");
      parsedFarmToTable = JSON.parse(farmToTableProcess || "[]");
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON format in product features or farm-to-table process" });
    }

    const newProduct = new Product({
      sellerEmail,
      name,
      category,
      price,
      stock,
      overview,
      productFeatures: parsedProductFeatures,
      nutritionalInfo,
      usageInstructions,
      images,
      farmToTableProcess: parsedFarmToTable
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully!", product: newProduct });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update product details with image upload
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { name, category, price, stock, overview, nutritionalInfo, usageInstructions, productFeatures, farmToTableProcess } = req.body;

    let images = req.files.map(file => file.filename);
    let parsedProductFeatures = [];
    let parsedFarmToTable = [];

    try {
      parsedProductFeatures = JSON.parse(productFeatures || "[]");
      parsedFarmToTable = JSON.parse(farmToTableProcess || "[]");
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON format in product features or farm-to-table process" });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    if (!images.length) images = existingProduct.images; // Keep existing images if none uploaded

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        stock,
        overview,
        nutritionalInfo,
        usageInstructions,
        productFeatures: parsedProductFeatures,
        farmToTableProcess: parsedFarmToTable,
        images
      },
      { new: true }
    );

    res.json({ message: "Product updated successfully!", product: updatedProduct });

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


// Route to fetch farm-to-table details
router.get("/farm-details/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, farmDetails: product.farmToTableProcess || [] });
  } catch (error) {
    console.error("Error fetching farm details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/home/products-home", async (req, res) => {
  try {
    const products = await Product.find({}, "name price category stock images").lean(); // Convert Mongoose docs to JS objects
    const baseUrl = "https://growza.onrender.com/uploads/";

    const updatedProducts = products.map((product) => ({
      _id: product._id, // Ensure _id is included
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      images: product.images.map((img) => baseUrl + img),
    }));

    res.json(updatedProducts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
router.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert stored filenames to full URLs
    const baseUrl = "http://localhost:5000/uploads/"; // Change based on your server setup
    const productWithFullImages = {
      ...product._doc, 
      images: product.images.map(img => baseUrl + img),
    };

    res.json(productWithFullImages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
//admin
router.get("/analysis", async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(products.map(({ _id, count }) => ({ date: _id, count })));
  } catch (error) {
    console.error("Error fetching analysis data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
