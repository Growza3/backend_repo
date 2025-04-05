const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/order");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ✅ **Create Razorpay Order**
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, buyerEmail } = req.body;

    const options = {
      amount: amount, // Amount in paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ error: "Error creating Razorpay order" });
  }
};

// ✅ **Verify Razorpay Payment & Store Order**
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { buyerEmail, razorpay_order_id, razorpay_payment_id, razorpay_signature, products, billingInfo, deliveryDetails } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const newOrder = new Order({
      buyerEmail,
      paymentMethod: "Scanner",
      paymentStatus: "Paid",
      razorpay_payment_id,
      razorpay_order_id,
      products,
      billingInfo,
      deliveryDetails,
    });

    await newOrder.save();
    res.json({ message: "Payment verified & order stored", orderId: newOrder._id });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// ✅ **Store Credit Card & COD Orders**
exports.processNonRazorpayPayment = async (req, res) => {
  try {
    const { buyerEmail, paymentMethod, products, billingInfo, deliveryDetails } = req.body;

    const newOrder = new Order({
      buyerEmail,
      paymentMethod,
      paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      products,
      billingInfo,
      deliveryDetails,
    });

    await newOrder.save();
    res.json({ message: "Order placed successfully", orderId: newOrder._id });
  } catch (error) {
    console.error("Order processing error:", error);
    res.status(500).json({ error: "Order placement failed" });
  }
};
