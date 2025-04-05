const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');
const Wishlist = require('../models/Wishlist');

// Middleware for authentication (Replace with actual auth logic)
const authenticateUser = (req, res, next) => {
    req.user = { email: 'testbuyer@example.com' }; // Replace with real authentication
    next();
};

// Fetch Buyer Orders
router.get('/buyer/orders', authenticateUser, async (req, res) => {
    try {
        const orders = await Order.find({ buyerEmail: req.user.email });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Fetch Buyer Profile
router.get('/buyer/profile', authenticateUser, async (req, res) => {
    try {
        const profile = await User.findOne({ email: req.user.email });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Fetch Wishlist
router.get('/buyer/wishlist', authenticateUser, async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ buyerEmail: req.user.email });
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist' });
    }
});

// Update Buyer Profile (Name & Mobile)
// Update Buyer Profile (Name & Mobile)
router.put("/update", async (req, res) => {
    try {
        const { email, name, phone } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Buyer email is required" });
        }

        // Ensure fields are not undefined
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;

        // Find and update the buyer
        const updatedBuyer = await User.findOneAndUpdate(
            { email }, 
            { $set: updateFields }, // ✅ Correct update syntax
            { new: true, runValidators: true } // ✅ Return updated document
        );

        if (!updatedBuyer) {
            return res.status(404).json({ error: "Buyer not found" });
        }

        console.log("Updated Buyer:", updatedBuyer); // Debugging log
        res.status(200).json({ message: "Profile updated successfully", buyer: updatedBuyer });
    } catch (error) {
        console.error("Error updating buyer profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
