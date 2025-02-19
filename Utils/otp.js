const crypto = require("crypto");

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
}

module.exports = generateOtp;
