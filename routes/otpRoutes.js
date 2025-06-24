const express = require("express");
const twilio = require("twilio");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/user"); // Import User Model
const router = express.Router();

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

// 📌 Send OTP using Twilio
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: "Invalid phone number." });
  }

  try {
    const formattedPhone = `+91${phone}`;

    // Send OTP using Twilio
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: formattedPhone, channel: "sms" });

    // Store user details in DB (if not exists)
    await User.findOneAndUpdate(
      { phone: formattedPhone },
      { verified: false }, // Reset verification status
      { upsert: true, new: true }
    );

    res.json({ message: "OTP sent successfully.", sid: verification.sid });
  } catch (error) {
    console.error("Twilio Error:", error);
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

// 📌 Verify OTP using Twilio
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: "Invalid OTP." });
  }

  try {
    const formattedPhone = `+91${phone}`;

    // Verify OTP using Twilio
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: formattedPhone, code: otp });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ error: "Incorrect or expired OTP." });
    }

    // Update user status in DB
    await User.findOneAndUpdate(
      { phone: formattedPhone },
      { verified: true } // Mark as verified
    );

    res.json({ message: "OTP verified successfully!" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ error: "OTP verification failed." });
  }
});

// 📌 Step 4: Login with Email & Username
router.post("/login", async (req, res) => {
    const { email, username } = req.body;

    try {
        const user = await User.findOne({ email, username });

        if (!user) {
            return res.status(400).json({ error: "Invalid email or username." });
        }

        res.json({ message: "Login successful!", user });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed." });
    }
});

module.exports = router;
