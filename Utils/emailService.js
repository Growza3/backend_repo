const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOtpEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
        });
        console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;
    }
};

module.exports = { sendOtpEmail };