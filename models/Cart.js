const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    email: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    images: { type: [String], required: true }, // ✅ Must be an array
    quantity: { type: Number, required: true, default: 1, min: 1 } // ✅ Added quantity field
});

const Cart = mongoose.model("carts", cartSchema);
module.exports = Cart;
