const mongoose = require("mongoose");

const CancelledOrderSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
        },
    ],
    totalAmount: Number,
    paymentStatus: String,
    cancelledAt: Date,
});

module.exports = mongoose.model("CancelledOrder", CancelledOrderSchema);
