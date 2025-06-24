require("dotenv").config();
const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send OTP
const sendOtp = async (mobile, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP code is ${otp}. Please do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER, // Twilio number
      to: `+${mobile}`, // Mobile number with country code
    });
    return message.sid; // Return Twilio message SID if sent successfully
  } catch (error) {
    console.error("Failed to send OTP:", error.message);
    throw new Error("Could not send OTP. Please try again.");
  }
};

module.exports = { sendOtp };
