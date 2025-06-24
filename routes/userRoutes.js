const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { email, password, phone } = req.body;

    if (!email || !password || !phone) {
      console.log("Missing fields:", { email, password, phone });
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if the email already exists (but allow duplicate phone numbers)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash password
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to database (even if the phone number is the same)
    console.log("Saving user to database...");
    const newUser = new User({ email, password: hashedPassword, phone });
    await newUser.save();

    console.log("User created successfully:", newUser);
    res.status(201).json({ message: "Account created successfully!" });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});





// Google OAuth Login Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth Callback Route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const { id, displayName, emails } = req.user;

      // Check if the user exists in MongoDB
      let user = await User.findOne({ googleId: id });
      if (!user) {
        // If user doesn't exist, create one
        user = new User({
          googleId: id,
         
          email: emails[0].value,
        });
        await user.save();
      }

      // Redirect to the frontend or return user data
      res.redirect("http://localhost:5173"); // Change this to your frontend URL
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error authenticating with Google" });
    }
  }
);
// Google OAuth Login Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth Callback Route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const { id, displayName, emails } = req.user;

      // Check if the user exists in MongoDB
      let user = await User.findOne({ googleId: id });
      if (!user) {
        // If user doesn't exist, create one
        user = new User({
          googleId: id,
         
          email: emails[0].value,
        });
        await user.save();
      }

      // Redirect to the frontend or return user data
      res.redirect("http://localhost:5173"); // Change this to your frontend URL
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error authenticating with Google" });
    }
  }
);
router.get("/buyer/:email", async (req, res) => {
  try {
      const buyer = await User.findOne({ email: req.params.email });
      if (!buyer) {
          return res.status(404).json({ error: "Buyer not found" });
      }
      res.json(buyer);
  } catch (error) {
      console.error("Error fetching buyer details:", error);
      res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
