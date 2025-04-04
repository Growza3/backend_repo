const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");

router.get("/sales", async (req, res) => {
    try {
        const salesData = await Sales.find();
        if (!salesData.length) {
            return res.status(404).json({ message: "No sales data available" });
        }
        res.json(salesData);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
