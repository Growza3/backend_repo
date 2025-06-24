/* Backend: routes/deliveryRoutes.js */
const express = require("express");
const router = express.Router();
const Delivery = require("../models/Delivery");

router.post("/", async (req, res) => {
    try {
        const newDelivery = new Delivery(req.body);
        await newDelivery.save();
        res.status(201).json({ message: "Delivery details stored successfully!" });
    } catch (error) {
        console.error("Error storing delivery details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email is required" });
        const deliveries = await Delivery.find({ email });
        res.status(200).json(deliveries);
    } catch (error) {
        console.error("Error fetching delivery details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Get user's saved address by email
router.get("/api/user-address/:email", async (req, res) => {
    try {
        const userAddress = await Delivery.findOne({ email: req.params.email });

        if (!userAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.json({
            address: userAddress.address,
            city: userAddress.city,
            state: userAddress.state,
            postalCode: userAddress.postalCode,
            landmark: userAddress.landmark || "",
        });

    } catch (error) {
        console.error("Error fetching address:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update or Save user address
router.post("/api/user-address", async (req, res) => {
    try {
        const { email, address, city, state, postalCode, landmark } = req.body;

        let userAddress = await Delivery.findOne({ email });

        if (userAddress) {
            // Update existing address
            userAddress.address = address;
            userAddress.city = city;
            userAddress.state = state;
            userAddress.postalCode = postalCode;
            userAddress.landmark = landmark || "";

            await userAddress.save();
            return res.json({ message: "Address updated successfully", userAddress });
        }

        // Create new address entry
        const newAddress = new Delivery({ email, address, city, state, postalCode, landmark });
        await newAddress.save();

        res.json({ message: "Address saved successfully", newAddress });

    } catch (error) {
        console.error("Error saving address:", error);
        res.status(500).json({ message: "Server error" });
    }
});

//Fetch address for buyer profile
router.get("/api/delivery/:email", async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const address = await Delivery.findOne({ email });
        if (!address) return res.status(404).json({ message: "No address found" });

        res.status(200).json(address);
    } catch (error) {
        console.error("Error fetching address:", error);
        res.status(500).json({ message: "Server error" });
    }
});

//Save/Update address for Buyer Profile
router.post("/api/delivery/save", async (req, res) => {
    try {
        const { email, address, city, state, postalCode, landmark } = req.body;
        if (!email || !address || !city || !state || !postalCode) {
            return res.status(400).json({ message: "All fields are required except landmark" });
        }

        let userAddress = await Delivery.findOne({ email });

        if (userAddress) {
            // Update existing address
            userAddress.address = address;
            userAddress.city = city;
            userAddress.state = state;
            userAddress.postalCode = postalCode;
            userAddress.landmark = landmark;
        } else {
            // Create new address
            userAddress = new Delivery({ email, address, city, state, postalCode, landmark });
        }

        await userAddress.save();
        res.status(200).json({ message: "Address saved successfully" });
    } catch (error) {
        console.error("Error saving address:", error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;