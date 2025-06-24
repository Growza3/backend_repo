const express = require("express");
const router = express.Router();
const ContactMessage = require("../models/ContactMessage");

// Save contact form message
router.post("/add", async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        const newMessage = new ContactMessage({ name, email, phone, subject, message });
        await newMessage.save();
        res.status(201).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Fetch all messages for Super Admin
router.get("/all", async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

module.exports = router;
