const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true ,lowercase: true},
    otp: { type: String, required: false }, // ✅ OTP should be optional
    isVerified: { type: Boolean, default: false },
    phone: { type: String, required: function () { return this.isVerified; } },
    username: { type: String,required: function () { return this.isVerified; } },
    certificate: { type: String, required: function () { return this.isVerified; } },// ✅ Ensure certificate is uploaded 
    isCertified: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false }, // New field to track rejection
    
}, { collection: "sellerdata" });  // ✅ Explicitly set collection name

const Seller = mongoose.model("Seller", sellerSchema, "sellerdata"); // ✅ Force collection name
module.exports = Seller;