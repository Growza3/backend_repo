const express = require("express");
const { sendOtp, verifyOtp, completeSignup } = require("../controllers/authController");
const router = express.Router();
const Seller = require("../models/sellerModel"); // Assuming you have a Seller model
const Product = require("../models/Product"); // Assuming you have a Product model
const multer = require("multer");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", completeSignup);

router.put("/update-payment/:sellerId", async (req, res) => {
    try {
      const { sellerId } = req.params;
      await Seller.findByIdAndUpdate(sellerId, { isPaid: true, paymentExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      res.json({ message: "Payment updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all sellers with total product count
  

// Fetch all sellers with totalProducts count



router.get("/sellers", async (req, res) => {
  try {
    const sellers = await Seller.find({});
    const sellersWithProductCount = await Seller.aggregate([
      {
        $lookup: {
          from: "products", // Collection name
          localField: "email",
          foreignField: "sellerEmail",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          phone: 1,
          isVerified: 1,
          certificate: 1,
          totalProducts: { $size: "$products" }, // ✅ Directly count products
        },
      },
    ]);
    


    res.json({ success: true, sellers: sellersWithProductCount });
  } catch (error) {
    console.error("Error fetching sellers with product count:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


  
module.exports = router;

