const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/user");

const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
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
          username: displayName,
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

module.exports = router;
