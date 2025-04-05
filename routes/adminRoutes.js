const express = require("express");
const router = express.Router();
const Seller = require("../models/sellerModel");
const Buyer = require("../models/user");

// Fetch all buyers & sellers
router.get("/fetch-users", async (req, res) => {
    try {
        const buyers = await Buyer.find();
        const sellers = await Seller.find();
        res.json({ success: true, buyers, sellers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Approve Seller API - Resets isRejected to false
router.post("/approve-seller", async (req, res) => {
    const { sellerId } = req.body;

    try {
        const seller = await Seller.findById(sellerId);
        if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

        seller.isCertified = true;
        seller.isRejected = false; // Reset rejection status when approving
        await seller.save();

        res.json({ success: true, message: "Seller approved successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Reject Seller API
router.post("/reject-seller", async (req, res) => {
    const { sellerId } = req.body;

    try {
        const seller = await Seller.findById(sellerId);
        if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

        seller.isCertified = false; 
        seller.isRejected = true; // Mark seller as rejected
        await seller.save();

        res.json({ success: true, message: "Seller rejected successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/user-stats", async (req, res) => {
    try {
      const totalSellers = await Seller.countDocuments();
      const totalBuyers = await Buyer.countDocuments();
  
      res.json({
        totalUsers: totalSellers + totalBuyers,
        totalSellers,
        totalBuyers,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
module.exports = router;
