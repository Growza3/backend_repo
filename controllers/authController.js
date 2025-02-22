const Seller = require("../models/sellerModel");
const { sendOtpEmail } = require("../Utils/emailService");

// Function to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/** 📌 Send OTP */
exports.sendOtp = async (req, res) => {
    try {
        console.log("📩 Received Request Body:", req.body);
        
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const otp = generateOtp();
        console.log(`🔢 Generated OTP for ${email}: ${otp}`);

        await sendOtpEmail(email, otp);

        // ✅ Find existing seller by email
        let seller = await Seller.findOne({ email });

        if (!seller) {
            // ✅ Create a new seller without requiring username or phone
            seller = new Seller({ email, otp, isVerified: false });
        } else {
            seller.otp = otp; // ✅ Update OTP if seller exists
        }

        await seller.save();
        res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/** 📌 Verify OTP */
exports.verifyOtp = async (req, res) => {
    try {
        console.log("📩 Received Request Body:", req.body);

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const seller = await Seller.findOne({ email });

        if (!seller) {
            return res.status(400).json({ success: false, message: "Seller not found" });
        }

        console.log(`🔍 Stored OTP: ${seller.otp}, Entered OTP: ${otp}`);

        if (seller.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // ✅ Correct method: Use `$unset` to remove the OTP field
        await Seller.updateOne({ email }, { $unset: { otp: 1 }, $set: { isVerified: true } });

        console.log("✅ OTP Verified Successfully!");
        res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error("❌ Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/** 📌 Complete Signup (Store Email, Username, and Phone) */
exports.completeSignup = async (req, res) => {
    try {
        console.log("📩 Received Signup Data:", req.body); // ✅ Debug log

        const { email, phone, username } = req.body;

        if (!email || !phone || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // ✅ Check if seller exists
        const existingSeller = await Seller.findOne({ email });

        if (!existingSeller) {
            return res.status(400).json({ success: false, message: "Seller not found" });
        }

        if (!existingSeller.isVerified) {
            return res.status(400).json({ success: false, message: "OTP verification required" });
        }

        // ✅ Ensure we are updating the seller
        const newSellerData = { 
            phone, 
            username, 
            isVerified: true // ✅ Set as verified
        };

        console.log("📝 Updating Seller in DB:", newSellerData); // ✅ Debug log

        const updatedSeller = await Seller.findOneAndUpdate(
            { email },
            { $set: newSellerData },
            { new: true } // ✅ Returns updated document
        );

        console.log("✅ Seller Updated Successfully:", updatedSeller); // ✅ Debug log

        res.json({ success: true, message: "Signup completed successfully", seller: updatedSeller });
    } catch (error) {
        console.error("❌ Error completing signup:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
