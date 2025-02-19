const mongoose = require("mongoose");

const BuyerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpiration: { type: Date },
});

module.exports = mongoose.model("Buyer", BuyerSchema);
