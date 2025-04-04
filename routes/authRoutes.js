const express = require("express");
const { sendOtp, verifyOtp ,completeSignup} = require("../controllers/authController");
const User = require("../models/user"); // Ensure correct model path
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sellerModel = require("../models/sellerModel"); // Import your User model

const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const router = express.Router();
const passport = require("passport");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", completeSignup);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id,
      email: user.email, }, process.env.JWT_SECRET, { expiresIn: "7d" });

      res.json({
        
        userEmail: user.email,
        sellerId: user.sellerId || null, // Send only if applicable
        authToken : token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect frontend with token
    res.redirect(`http://localhost:5173/ProductPage?accessToken=${token}&email=${req.user.email}`);
  }
);

//check seller email 
router.post("/check-email", async (req, res) => {
  try {
      const { email } = req.body;

      if (!email) {
          return res.status(400).json({ success: false, message: "Email is required" });
      }

      // Check if email exists in the database
      const existingUser = await sellerModel.findOne({ email });

      if (existingUser) {
          return res.json({ exists: true });  // If email is found
      } else {
          return res.json({ exists: false }); // If email is not found
      }

  } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
  
  
module.exports = router;
