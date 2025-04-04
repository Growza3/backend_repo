const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product"); // Import Product model
const authenticateUser = require("../middleware/authMiddleware");

// ✅ Add Product to Cart with Stock Validation
router.post("/update-quantity", async (req, res) => {
    try {
        const { email, productId, quantity } = req.body;

        if (!email || !productId || quantity == null) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        // Fetch the product stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if quantity does not exceed stock
        if (quantity > product.stock) {
            return res.status(400).json({ error: "Not enough stock available" });
        }

        // Update the cart item
        const updatedCart = await Cart.findOneAndUpdate(
            { email, productId },
            { $set: { quantity } },
            { new: true, upsert: true } // Upsert ensures a cart item is created if it doesn’t exist
        );

        res.json({ success: true, cart: updatedCart });
    } catch (error) {
        console.error("❌ Error updating quantity:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch Cart Items with Product Details
router.get("/:email", async (req, res) => {
    const { email } = req.params;

    try {
        // 🛒 Fetch cart items and populate product details
        const cartItems = await Cart.find({ email }).populate("productId");

        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ message: "No cart items found for this email" });
        }

        res.json(cartItems);
    } catch (error) {
        console.error("❌ Error fetching cart:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Update Cart Item Quantity with Stock Validation
router.put("/update-quantity", async (req, res) => {
    try {
        const { email, productId, quantity } = req.body;

        console.log("🟢 Received request to update quantity:", { email, productId, quantity });

        if (!email || !productId || quantity < 1) {
            console.log("❌ Invalid request data", { email, productId, quantity });
            return res.status(400).json({ message: "Invalid input data" });
        }

        // 🔍 Find the cart item
        const cartItem = await Cart.findOne({ email, productId });

        if (!cartItem) {
            console.log("❌ Cart item not found for email:", email, "and productId:", productId);
            return res.status(404).json({ message: "Cart item not found" });
        }

        // 🔍 Get the stock from products collection
        const product = await Product.findById(productId);
        if (!product) {
            console.log("❌ Product not found:", productId);
            return res.status(404).json({ message: "Product not found" });
        }

        // 🔴 Prevent exceeding available stock
        if (quantity > product.stock) {
            console.log(`❌ Requested quantity (${quantity}) exceeds available stock (${product.stock})`);
            return res.status(400).json({ message: "Requested quantity exceeds available stock" });
        }

        // ✅ Update only quantity in Cart
        cartItem.quantity = quantity;
        await cartItem.save();

        console.log("✅ Quantity updated successfully:", quantity);
        res.status(200).json({ message: "✅ Quantity updated successfully", cartItem });
    } catch (error) {
        console.error("❌ Error updating quantity:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Update product quantity
    router.post('/single/update', async (req, res) => {
        try {
        const { productId, quantity } = req.body;
    
        // Validate the request body
        if (!productId || quantity == null || quantity < 1) {
            return res.status(400).json({ message: "Invalid input data" });
        }
    
        // Fetch the product from the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
    
        // Check if the requested quantity is within stock limit
        if (quantity > product.stock) {
            return res.status(400).json({ message: `Cannot update quantity. Available stock is ${product.stock}` });
        }
    
        // Update the quantity (assuming you have a cart or order logic tied to the product)
        
        // Here, I'm just assuming this update is related to a cart or order quantity.
        product.quantity = quantity;  // If there's a cart model or order item, update its quantity here instead
    
        // Save the updated product
        await product.save();
    
        res.json({ message: "Quantity updated successfully", updatedProduct: product });
    
        } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ message: "Failed to update quantity", error: error.message });
        }
    });
  

module.exports = router;
