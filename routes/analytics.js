const express = require("express");
const Order = require("../models/order");
const router = express.Router();

router.get("/revenue", async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "Paid" });

    // Calculate monthly revenue
    const monthlyRevenue = {};
    orders.forEach((order) => {
      const month = new Date(order.createdAt).toLocaleString("default", { month: "short" });

      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
      monthlyRevenue[month] += order.totalAmount;
    });

    // Convert to array format for charts
    const revenueData = Object.keys(monthlyRevenue).map((month) => ({
      month,
      revenue: monthlyRevenue[month],
    }));

    res.status(200).json(revenueData);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
