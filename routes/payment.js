const express = require("express");
const router = express.Router();
const Order = require("./models/Order");
const nodemailer = require("nodemailer");

// Fake Email Configuration (Replace with real credentials)
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "growza0107@gmail.com",
        pass: "omwi mndq fvry iikh",
    },
});

// Helper function to send email
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({ from: "your-email@gmail.com", to, subject, text });
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

// Simulate Payment Processing
router.post("/process-payment", async (req, res) => {
    const { buyerId, productId, amount, paymentMethod, buyerEmail } = req.body;
    try {
        const transactionId = "TXN" + Math.floor(100000 + Math.random() * 900000);
        
        const newOrder = new Order({ buyerId, productId, amount, paymentMethod, transactionId, status: "Paid" });
        await newOrder.save();

        // Notify Buyer
        await sendEmail(buyerEmail, "Payment Successful - Growza", 
            `Your payment of ₹${amount} using ${paymentMethod} was successful! Transaction ID: ${transactionId}`
        );

        // Notify Admin
        await sendEmail("admin-email@gmail.com", "New Payment Received", 
            `Payment of ₹${amount} via ${paymentMethod} received. Transaction ID: ${transactionId}.`
        );

        res.status(200).json({ success: true, message: "Payment Successful", transactionId });

    } catch (error) {
        res.status(500).json({ success: false, message: "Payment failed", error });
    }
});

module.exports = router;
