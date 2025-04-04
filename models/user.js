const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true},
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  otp: {
    type: String,
    required: false, 
    expires: 120, // ⏳ Auto-delete after 2 minutes (120 seconds)
  },
  googleId: { type: String }, // For Google OAuth users
  verified: { type: Boolean, default: false },
  resetToken: String, // Stores token for password reset
  resetTokenExpiry: Date, // Expiry for reset token
}, { timestamps: true });

// Create User Model
const user = mongoose.model("user", UserSchema);
module.exports = user;




