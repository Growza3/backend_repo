const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: false }, // ✅ OTP should be optional
    isVerified: { type: Boolean, default: false },
    phone: { type: String , required:true },
    username: { type: String,required:true },
    
}, { collection: "sellerdata" });  // ✅ Explicitly set collection name

const Seller = mongoose.model("Seller", sellerSchema, "sellerdata"); // ✅ Force collection name
module.exports = Seller;
