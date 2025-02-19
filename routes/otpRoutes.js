const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const twilio = require("twilio");
const { Buyer, Seller } = require("./Buyer", "./Seller"); // Import Buyer and Seller models

// Twilio credentials (replace with your Twilio details)
const accountSid = "your_twilio_account_sid";
const authToken = "your_twilio_auth_token";
const client = twilio(accountSid, authToken);

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP
router.post("/:userType/send-otp", async (req, res) => {
  const { mobile } = req.body;
  const { userType } = req.params;

  if (!mobile) return res.status(400).json({ error: "Mobile number is required" });

  const otp = generateOtp();
  const otpExpiration = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  try {
    // Determine the user type (Buyer or Seller)
    const User = userType.toLowerCase() === "buyer" ? Buyer : Seller;

    // Save OTP and expiration in the database
    await User.findOneAndUpdate(
      { email: mobile },
      { otp, otpExpiration },
      { new: true, upsert: true }
    );

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: "+1234567890", // Replace with your Twilio phone number
      to: mobile,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/:userType/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;
  const { userType } = req.params;

  try {
    // Determine the user type (Buyer or Seller)
    const User = userType.toLowerCase() === "buyer" ? Buyer : Seller;

    const user = await User.findOne({ email: mobile });

    if (!user || user.otp !== otp || user.otpExpiration < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // OTP is valid, clear it from the database
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

module.exports = router;
