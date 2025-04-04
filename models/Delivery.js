const mongoose = require("mongoose");
const DeliverySchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    landmark: { type: String },
}, { timestamps: true });
module.exports = mongoose.model("Delivery", DeliverySchema);