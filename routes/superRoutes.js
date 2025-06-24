const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/Product");
const User = require("../models/user");
const Seller = require("../models/sellerModel");

router.get("/analytics", async (req, res) => {
  try {
    // **1️⃣ Summary Metrics**
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
    console.log("🟢 Total Revenue:", totalRevenue); // Debugging

    const totalOrders = await Order.countDocuments();
    console.log("🟢 Total Orders:", totalOrders);

    const totalProducts = await Product.countDocuments();
    console.log("🟢 Total Products:", totalProducts);

    const totalBuyers = await User.countDocuments();
    console.log("🟢 Total Buyers:", totalBuyers);

    // **2️⃣ Revenue Trend (Last 6 months)**
    const revenueTrend = await Order.aggregate([
      {
        $group: {
          _id: { $month: { $toDate: "$_id" } }, // Extract month from ObjectId
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log("🟢 Revenue Trend:", revenueTrend);

    // **3️⃣ Order Status Distribution**
    const orderStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    console.log("🟢 Order Status Distribution:", orderStatus);

    // **4️⃣ Top 5 Selling Products**
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    console.log("🟢 Top 5 Selling Products:", topProducts);

    // **5️⃣ Buyer Growth (Last 6 months)**
    const buyerGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: { $toDate: "$_id" } }, // Extract month from ObjectId
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log("🟢 Buyer Growth:", buyerGrowth);

    // **6️⃣ Seller Performance (Orders & Revenue)**
    const sellerPerformance = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.sellerEmail",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    console.log("🟢 Seller Performance:", sellerPerformance);

    // **7️⃣ Rejected Products**
    const rejectedProducts = await Product.find({ status: "Rejected" }).select("name category reason");
    console.log("🟢 Rejected Products:", rejectedProducts);

    // **Final Response**
    res.json({
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalBuyers,
      },
      revenueTrend,
      orderStatus,
      topProducts,
      buyerGrowth,
      sellerPerformance,
      rejectedProducts,
    });

  } catch (error) {
    console.error("❌ Error in Analytics API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
