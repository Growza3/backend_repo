const Seller = require("../models/sellerModel");
const { sendOtpEmail } = require("../Utils/emailService");
const multer = require("multer");
const path = require("path");
// Function to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
// ✅ Configure Multer for file storage
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No token provided" });

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    console.log("Verified Google User:", email, name);

    // Check if user exists or create a new one
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, profilePic: picture });
      await user.save();
    }

    // Generate JWT Token
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: authToken, user });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: "Google authentication failed" });
  }
};
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
            seller = new Seller({ email, otp, isVerified: false});
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

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "uploads/certificates/");
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // ✅ 5MB File Size Limit
  }).single("certificate");

/** 📌 Complete Signup (Store Email, Username, and Phone) */
exports.completeSignup = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "File upload failed" });
      }
  
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
  
        // ✅ Capture certificate file path if uploaded
        const certificatePath = req.file ? `${req.protocol}://${req.get("host")}/${req.file.path}` : existingSeller.certificate;
        if (!existingSeller.certificate && !req.file) {
          return res.status(400).json({ success: false, message: "Organic certificate is required" });
        }
        
        // ✅ Ensure we are updating the seller
        const newSellerData = { 
          phone, 
          username, 
          isVerified: true, // ✅ Set as verified
          certificate: certificatePath // ✅ Store certificate
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
        res.status(500).json({ 
          success: false, 
          message: "Something went wrong while completing signup. Please try again.", 
          error: error.message 
        });
      }
      
    });
  };
