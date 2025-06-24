const mongoose = require("mongoose");

const SalesSchema = new mongoose.Schema({
    productName: String,
    quantity: Number,
    totalPrice: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sales", SalesSchema);
