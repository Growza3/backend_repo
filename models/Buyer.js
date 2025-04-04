const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true, // Ensure only one mobile number per user
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique for buyer identification
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
