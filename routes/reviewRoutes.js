//reviewRoutes.jsx
const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// Add a review
router.post("/", async (req, res) => {
    try {
        const { email, review } = req.body;

        if (!email || !review) {
            return res.status(400).json({ error: "Email and review are required" });
        }

        const newReview = new Review({ email, review });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (error) {
        console.error("Error saving review:", error);  // Log error
        res.status(500).json({ error: "Error saving review" });
    }
});
router.get("/auth", async (req, res) => {
    try {
      const reviews = await Review.find();
      console.log("Fetched Reviews:", reviews); // Log fetched reviews  
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

// Fetch reviews by email
router.get("/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const reviews = await Review.find({ email }).sort({ createdAt: -1 }); // Fetch reviews for a specific buyer
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Error fetching reviews" });
    }
});

//sellerReview
router.post("/reviews", async (req, res) => {
    try {
        const { email, review } = req.body;
        const newReview = new Review({ email, review });
        await newReview.save();

        console.log("✅ Review saved:", newReview);
        res.status(201).json({
            success: true,
            message: "Review stored successfully",  
            review: newReview,
        });
    } catch (error) {
        console.error("❌ Error saving review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to store review",
            error: error.message,  // ✅ Send the actual error
        });
    }
});

module.exports = router;