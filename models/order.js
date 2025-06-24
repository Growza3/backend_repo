const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    enum: ["Scanner", "Credit Card", "Cash on Delivery"], 
    required: true 
  },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", required: false },
  totalAmount: { type: Number, required: true },

  // Delivery details (stored only for COD orders)
  deliveryDetails: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    landmark: { type: String }
  },
  billingInfo: {
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
},
  // Explicitly reference the Product model
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 }
  }],

  // Payment status logic handled in API
  paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  razorpay_payment_id: { type: String, default: null },
  status: { type: String, enum: ["Pending", "Delivered", "Cancelled"], default: "Pending" }
});

// Ensure delivery details are present if payment method is "Cash on Delivery"
OrderSchema.pre("save", function (next) {
  if (this.paymentMethod === "Cash on Delivery") {
    if (!this.deliveryDetails?.address || !this.deliveryDetails?.city || !this.deliveryDetails?.state || !this.deliveryDetails?.postalCode) {
      return next(new Error("Delivery details are required for Cash on Delivery."));
    }
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
