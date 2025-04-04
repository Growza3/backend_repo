const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/user");
const Seller = require("../models/sellerModel");
const Delivery = require("../models/Delivery");
const CancelledOrder = require("../models/CancelledOrder");
const sendEmail = require("../Utils/sendEmail"); // Utility function for sending emails

const nodemailer = require("nodemailer");

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL_USER,  // ⬅️ Replace with your email
      pass: process.env.EMAIL_PASS,  // ⬅️ Replace with your app password
  },
});
router.get("/orders/weekly-stats", async (req, res) => {
    try {
        const weeklyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 42)) // Last 6 weeks
                    }
                }
            },
            {
                $group: {
                    _id: { $week: "$createdAt" }, // Group by week number
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } } // Sort by week number
        ]);

        res.status(200).json(weeklyStats);
    } catch (error) {
        console.error("❌ Error fetching weekly order stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 Place an order
router.post("/orders", async (req, res) => {
    try {
        console.log("🔹 Incoming Order Request:", req.body);

        const { buyerEmail, paymentMethod, deliveryDetails, billingInfo, singleProduct, cartItems } = req.body;

        // Validate required fields
        if (!buyerEmail || !paymentMethod) {
            return res.status(400).json({ message: "Buyer email and payment method are required." });
        }

        // Validate payment method
        const validPaymentMethods = ["Scanner", "Credit Card", "Cash on Delivery"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method." });
        }

        // Validate billing details
        if (!billingInfo || !billingInfo.subtotal || !billingInfo.gstAmount || !billingInfo.deliveryCharge || !billingInfo.totalAmount) {
            return res.status(400).json({ message: "Billing details are required." });
        }

        let products = [];

        // 🟢 Handle Single Product Purchase
        if (singleProduct) {
            console.log("✅ Processing single product:", singleProduct);

            products = [{
                productId: singleProduct.productId,
                name: singleProduct.name,
                quantity: singleProduct.quantity || 0,
                price: singleProduct.price,
                images: singleProduct.images,
                sellerEmail: singleProduct.sellerEmail,
            }];
        } 
        // 🟢 Handle Cart Purchase
        else if (Array.isArray(cartItems) && cartItems.length > 0) {
            console.log("✅ Processing cart items:", cartItems);

            // 🟢 Ensure cart items are populated with sellerEmail
            const cartWithProducts = await Cart.find({ email: buyerEmail }).populate("productId");

            products = cartWithProducts.map(item => ({
                productId: item.productId?._id,
                name: item.productId?.name,
                quantity: item.quantity || 1,
                price: item.productId?.price,
                images: item.productId?.images,
                sellerEmail: item.productId?.sellerEmail,
            })).filter(item => item.sellerEmail); // Remove items without sellerEmail
        } else {
            return res.status(400).json({ message: "No product or cart items found in the request" });
        }

        // 🟢 Validate products
        const validProducts = products.filter(item => item.price > 0);
        console.log("🛒 Debugging validProducts:", JSON.stringify(validProducts, null, 2));

        if (validProducts.length === 0) {
            return res.status(400).json({ message: "All selected products are invalid or unavailable." });
        }

        // 🟢 Ensure delivery details for Cash on Delivery
        if (paymentMethod === "Cash on Delivery" && (!deliveryDetails || !deliveryDetails.address || !deliveryDetails.city || !deliveryDetails.state || !deliveryDetails.postalCode)) {
            return res.status(400).json({ message: "Complete delivery details are required for Cash on Delivery." });
        }

        // 🟢 Set Payment Status
        const paymentStatus = (paymentMethod === "Credit Card" || paymentMethod === "Scanner") ? "Paid" : "Pending";

        // 🟢 Create a new Order
        const newOrder = new Order({
            email: buyerEmail,
            paymentMethod,
            totalAmount: billingInfo.totalAmount,
            deliveryDetails: paymentMethod === "Cash on Delivery" ? deliveryDetails : undefined,
            products: validProducts,
            paymentStatus,
            billingInfo,
            status: "Pending",
        });

        await newOrder.save();

        // ✅ Fetch buyer details
        const buyer = await User.findOne({ email: buyerEmail });
        if (!buyer) {
            return res.status(400).json({ message: "Buyer not found." });
        }

        // ✅ Send confirmation email to buyer
        const buyerEmailContent = `
            <h2>Order Confirmation</h2>
            <p>Dear ${buyer.username || "Valued Customer"},</p>
            <p>Thank you for your order! Here are the details:</p>
            <ul>
                ${validProducts.map(item => `<li>${item.name} - ${item.quantity} pcs - ₹${item.price}</li>`).join("")}
            </ul>
            <p><strong>Total Amount:</strong> ₹${billingInfo.totalAmount.toFixed(2)}</p>
            <p>Payment Method: ${paymentMethod}</p>
            <p>Delivery Address: ${deliveryDetails?.address || "N/A"}</p>
            <p>Thank you for shopping with us!</p>`;

        await transporter.sendMail({
            from: '"Growza Organic" <growza0107@gmail.com>',
            to: buyer.email,
            subject: "Order Confirmation - Growza Organic",
            html: buyerEmailContent,
        });

        // ✅ Extract and validate seller emails
        const sellerEmails = [...new Set(validProducts.map(item => item.sellerEmail).filter(email => email))];
        console.log("📩 Extracted Seller Emails:", sellerEmails);

        if (sellerEmails.length === 0) {
            console.warn("⚠️ No seller emails found, skipping seller notifications.");
        } else {
            const sellers = await Seller.find({ email: { $in: sellerEmails } });
            console.log("👨‍🌾 Sellers Found in Database:", sellers.map(seller => seller.email));

            await Promise.all(sellers.map(async (seller) => {
                const sellerProducts = validProducts.filter(p => p.sellerEmail === seller.email);
                console.log(`📦 Products for Seller (${seller.email}):`, sellerProducts);

                if (!seller.email) {
                    console.error(`❌ Seller email missing for:`, seller);
                    return;
                }
                if (sellerProducts.length === 0) {
                    console.warn(`⚠️ No products found for seller:`, seller.email);
                    return;
                }

                console.log(`📧 Sending email to seller: ${seller.email}`);

                // Create seller-specific email content
                const sellerEmailContent = `
                    <h2>New Order Received</h2>
                    <p>Dear ${seller.username || "Seller"},</p>
                    <p>You have received an order for the following products:</p>
                    <ul>
                        ${sellerProducts.map(item => `<li>${item.name} - ${item.quantity} pcs - ₹${item.price}</li>`).join("")}
                    </ul>
                    <p><strong>Total Amount for Your Products:</strong> ₹${sellerProducts.reduce((sum, item) => sum + item.price * item.quantity, 0)}</p>
                    <p>Please prepare the order for shipment.</p>
                    <p>Best Regards,<br>Growza Organic Team</p>`;

                try {
                    await transporter.sendMail({
                        from: '"Growza Organic" <growza0107@gmail.com>',
                        to: seller.email,
                        subject: "New Order Received",
                        html: sellerEmailContent,
                    });

                    console.log(`✅ Email sent to ${seller.email}`);

                } catch (error) {
                    console.error(`❌ Failed to send email to ${seller.email}:`, error);
                }
            }));
        }

        // ✅ Clear the cart after successful order placement
        await Cart.deleteMany({ email: buyerEmail });

        console.log(`🗑 Cart cleared for buyer: ${buyerEmail}`);

        res.status(201).json({ message: "Order placed successfully!" });

    } catch (error) {
        console.error("❌ Error placing order:", error);
        res.status(500).json({ message: "Server error" });
    }
});


    router.get("/orders/:sellerEmail", async (req, res) => {
        try {
            const { sellerEmail } = req.params;
    
            if (!sellerEmail) {
                return res.status(400).json({ message: "Seller email is required." });
            }
    
            // Aggregation pipeline to fetch orders of a specific seller
            const orders = await Order.aggregate([
                {
                    $unwind: "$products" // Unwind the products array to join each product separately
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "products.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    $unwind: "$productDetails" // Unwind again to access product details
                },
                {
                    $match: { "productDetails.sellerEmail": sellerEmail } // Filter only products of this seller
                },
                {
                    $group: {
                        _id: "$_id", // Group back to order level
                        email: { $first: "$email" },
                        paymentMethod: { $first: "$paymentMethod" },
                        cartId: { $first: "$cartId" },
                        totalAmount: { $first: "$totalAmount" },
                        paymentStatus: { $first: "$paymentStatus" },
                        products: { $push: "$products" }, // Collect products per order
                        productDetails: { $push: "$productDetails" } // Keep product details
                    }
                }
            ]);
    
            res.json({ success: true, orders });
        } catch (error) {
            console.error("Error fetching seller orders:", error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    });
    
// ✅ Fetch Orders for a Buyer
router.get("/orders/:buyerEmail", async (req, res) => {
    try {
        const { buyerEmail } = req.params;
        console.log("✅ Received Request for Orders - Email:", buyerEmail);

        // Check if email exists in the database (CASE-INSENSITIVE)
        const orders = await Order.find({ email: { $regex: new RegExp(`^${buyerEmail}$`, "i") } });

        console.log("📌 Query Result from MongoDB:", orders); // Log what MongoDB returns

        if (!orders || orders.length === 0) {
            console.log("⚠️ No orders found for this email.");
            return res.status(404).json({ success: false, message: "No orders found for this buyer." });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("❌ Error fetching buyer orders:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// ✅ Fetch All Orders for Admin
router.get("/admin/orders", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("products.productId", "name price images") // Fetch product details
            .select("email paymentMethod totalAmount deliveryDetails products paymentStatus status");

        // Calculate billingInfo for each order
        const updatedOrders = orders.map(order => {
            const billingInfo = order.products
                .filter(product => product.productId) // ✅ Skip null products
                .map(product => {
                    const subtotal = product.productId.price * product.quantity;
                    const gst = subtotal * 0.18;
                    const deliveryCharge = 5;
                    const totalAmount = subtotal + gst + deliveryCharge;
                    const status = order.status; // ✅ Fix: Use `paymentStatus`

                    return {
                        productId: product.productId._id,
                        name: product.productId.name, // ✅ Include product name
                        image: product.productId.images, // ✅ Include product image
                        price: product.productId.price, // ✅ Include price
                        quantity: product.quantity, // ✅ Include quantity
                        subtotal,
                        gst,
                        deliveryCharge,
                        totalAmount,
                        status
                    };
                });

            return {
                ...order.toObject(),
                billingInfo
            };
        });

        res.json(updatedOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
});


  

// ✅ Fetch Single Order by ID
router.get("/orders/order/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("❌ Error fetching order:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Update Payment Status
router.get("/admin/orders", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("email") // Populate `email`
            .populate("products.productId", "name price images") // Fetch product details
            .select("email paymentMethod totalAmount deliveryDetails products paymentStatus");

        // Calculate billingInfo for the entire order
        const updatedOrders = orders.map(order => {
            let subtotal = 0;
            order.products.forEach(product => {
                subtotal += product.productId.price * product.quantity;
            });

            const gst = subtotal * 0.18;
            const deliveryCharge = 5;
            const totalAmount = subtotal + gst + deliveryCharge;

            return {
                ...order.toObject(),
                billingInfo: { // Now billingInfo is a single object
                    subtotal: subtotal.toFixed(2),
                    gst: gst.toFixed(2),
                    deliveryCharge: deliveryCharge.toFixed(2),
                    totalAmount: totalAmount.toFixed(2)
                }
            };
        });

        res.json(updatedOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
});



// ✅ Cancel Order
router.delete("/orders/cancel/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        await Order.findByIdAndDelete(id);
        res.status(200).json({ message: "Order canceled successfully." });
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/placeOrder", async (req, res) => {
    console.log("Order Request Body:", req.body);
    try {
        const { buyerEmail, billingInfo, paymentMethod, products } = req.body;
        
        if (!billingInfo || !billingInfo.subtotal || !billingInfo.gstAmount || !billingInfo.deliveryCharge || !billingInfo.totalAmount) {
            return res.status(400).json({ error: "Billing details are required." });
        }
        
        const newOrder = new Order({
            buyerEmail,
            billingInfo,
            paymentMethod,
            products
        });

        await newOrder.save();
        res.status(201).json({ message: "Order placed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ✅ Fetch Orders for Buyer Dashboard
router.get("/buyer/orders/:email", async (req, res) => {
    try {
        const { buyerEmail } = req.params;

        // Fetch orders for the buyer
        const orders = await Order.find({ email: buyerEmail }).populate("products.productId");

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found." });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error("❌ Error fetching buyer orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

//Fetch the order details on the buyer profile
router.get("/buyer/orders", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const orders = await Order.find({ email })
            .populate("products.productId", "name images price quantity"); // Populate product details

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found." });
        }

        // Extract the timestamp from ObjectId
        const ordersWithDate = orders.map(order => {
            const timestamp = parseInt(order._id.toString().substring(0, 8), 16) * 1000;
            const orderDate = new Date(timestamp);

            console.log(`🛠️ Debug - Order ID: ${order._id}, Date: ${orderDate}`);

            return {
                ...order._doc,
                orderDate: orderDate.toISOString() // Ensure it's in valid format
            };
        });

        res.status(200).json(ordersWithDate);
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//Pie chart in seller profile
router.get("/weekly-revenue", async (req, res) => {
    try {
      const orders = await Order.find({}, { totalAmount: 1, _id: 1 });
  
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  router.get("/daily-revenue", async (req, res) => {
    try {
      const orders = await Order.find({ paymentStatus: "Paid" });
  
      // Calculate daily revenue
      const dailyRevenue = {};
      orders.forEach((order) => {
        const date = new Date(order.createdAt).toLocaleDateString("en-US", {
          weekday: "short", // Get short day name (Mon, Tue, etc.)
        });
  
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += order.totalAmount;
      });
  
      // Convert to array format for charts
      const revenueData = Object.keys(dailyRevenue).map((day) => ({
        day,
        revenue: dailyRevenue[day],
      }));
  
      res.status(200).json(revenueData);
    } catch (error) {
      console.error("Error fetching daily revenue:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
// Update order status
router.put("/admin/orders/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.json({ message: "Order status updated successfully", order });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cancel Order Route
  router.post("/cancel/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { buyerEmail } = req.body;

    if (!buyerEmail || typeof buyerEmail !== "string" || !buyerEmail.includes("@")) {
        return res.status(400).json({ message: "Invalid buyer email address" });
    }

    try {
        const order = await Order.findById(orderId)
            .populate("products.productId")
            .populate({ path: "buyerId", strictPopulate: false })
            .exec();

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== "Pending") {
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }

        // Move order to CancelledOrders collection
        const cancelledOrder = new CancelledOrder({
            ...order.toObject(),
            cancelledAt: new Date(),
        });
        await cancelledOrder.save();

        // Remove order from Orders collection
        await Order.findByIdAndDelete(orderId);

        // ✅ Send Email to Buyer
        const buyerMessage = `
            <h2>Order Cancellation Confirmation</h2>
            <p>Your order <strong>#${orderId}</strong> has been successfully cancelled.</p>
            <p>Your refund of ₹${order.billingInfo.totalAmount} has been processed.</p>
        `;
        const buyerEmailSent = await sendEmail(buyerEmail, "Order Cancelled & Refund Processed", buyerMessage);
        if (!buyerEmailSent) console.error("Failed to send buyer email.");

        // ✅ Send Email to Seller
        for (const product of order.products) {
            const sellerEmail = product.productId.sellerEmail;
            const sellerMessage = `
                <h2>Order Cancelled</h2>
                <p>Your product <strong>${product.productId.name}</strong> has been cancelled by the buyer.</p>
            `;
            const sellerEmailSent = await sendEmail(sellerEmail, "Order Cancelled Notification", sellerMessage);
            if (!sellerEmailSent) console.error(`Failed to send email to seller: ${sellerEmail}`);
        }

        res.json({ message: "Order cancelled successfully and emails sent." });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

  

module.exports = router;
