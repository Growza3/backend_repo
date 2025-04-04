const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        // ✅ Validate that 'to' is properly defined
        if (!to || typeof to !== "string" || !to.includes("@")) {
            throw new Error("Invalid recipient email address");
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to, // Ensure this is a valid email string
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
        return true;
    } catch (error) {
        console.error("❌ Email error:", error.message);
        return false;
    }
};

module.exports = sendEmail;
