const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import OTP Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);  // This should match Postman requests

// Default Route
app.get("/", (req, res) => {
    res.send("Server is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error("MongoDB connection error:", err));
    app.use((req, res, next) => {
      console.log(`Received Request: ${req.method} ${req.url}`);
      next();
  });
  