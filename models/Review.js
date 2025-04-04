const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    email: { type: String, required: true },
    review: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);