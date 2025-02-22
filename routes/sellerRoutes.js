const express = require("express");
const { sendOtp, verifyOtp, completeSignup } = require("../controllers/authController");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", completeSignup);

module.exports = router;

