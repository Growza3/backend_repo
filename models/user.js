const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: function () {
      return !this.googleId; // Require phone only if not a Google user
    },
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Require password only if not a Google user
    },
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  otp: {
    type: String,
    required: false,
    expires: 120,
  },
  googleId: { type: String },
  verified: { type: Boolean, default: false },
  resetToken: String,
  resetTokenExpiry: Date,
}, { timestamps: true });


// Create User Model
const user = mongoose.model("user", UserSchema);
module.exports = user;




