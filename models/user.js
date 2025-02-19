const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google OAuth users
    googleId: { type: String }, // For Google OAuth users
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);
module.exports = user;
