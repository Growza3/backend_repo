const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/user");
const Order = require("../models/order");
const SellerModel = require("../models/sellerModel"); // Ensure correct path
const CancelledOrder = require("../models/CancelledOrder");


// Fetch Products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});
router.get("/sellerdata", async (req, res) => {
    try {
      const sellers = await SellerModel.find(); // Use correct model name
      console.log("Fetched sellers:", sellers);
      res.json(sellers);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      res.status(500).json({ message: "Error fetching sellers", error });
    }
  });
// Fetch Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    console.log("Fetched users:", users); // Log data
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// Fetch Orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    console.log("Fetched Orders:", orders); // Log data
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});
router.get("/cancel", async (req, res) => {
  try {
    const orders = await CancelledOrder.find();
    console.log("Fetched Orders:", orders); // Log data
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

module.exports = router;
