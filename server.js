const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const Seller = require("./models/sellerModel"); 
const productRoutes = require("./routes/productRoutes");
const Product = require("./models/Product");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const sellerRoutes = require("./routes/sellerRoutes");
const otpRoutes = require("./routes/otpRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes"); // ✅ Ensure correct import
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const app = express();
const jwt = require("jsonwebtoken");
const Cart = require("./models/Cart"); // ✅ Make sure this path is correct
const deliveryRoutes = require("./routes/deliveryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const order=require("./models/order");
const buyerRoutes = require('./routes/buyerRoutes');
const salesRoutes = require("./routes/sales");
const crypto = require("crypto");
const User = require("./models/user"); // Ensure correct model path
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const passport=require("passport");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");

const admins = require("./routes/admins");
const Review=require("./models/Review");

require("./config/passport");
const session=require("express-session");
const serviceRoutes = require("./routes/serviceRoutes");
const vision = require('@google-cloud/vision');
const analyticsRoutes = require("./routes/analytics");
const superRoutes = require("./routes/superRoutes");



const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Use live PayPal API in production
const generateAccessToken = async () => {
    try {
        const response = await axios.post(
            `${PAYPAL_API}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_SECRET,
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting PayPal access token:", error.response.data);
        throw new Error("Failed to get access token");
    }
};
app.post("/create-order", async (req, res) => {
    try {
        const accessToken = await generateAccessToken();
        const { amount, currency } = req.body; // Get amount from request

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: currency || "USD",
                            value: amount,
                        },
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({ orderID: response.data.id });
    } catch (error) {
        console.error("Error creating PayPal order:", error.response.data);
        res.status(500).json({ error: "Failed to create order" });
    }
});
// Capture Payment
app.post("/capture-order", async (req, res) => {
    try {
        const accessToken = await generateAccessToken();
        const { orderID } = req.body;

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("Error capturing PayPal order:", error.response.data);
        res.status(500).json({ error: "Failed to capture order" });
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // ✅ Increase JSON payload limit
app.use(express.urlencoded({ limit: "10mb", extended: true })); // ✅ Increase URL-encoded data limit
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static images
app.use("/api/sellers", sellerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api", salesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", otpRoutes);
app.use("/api", productRoutes);
app.use("/api", sellerRoutes);
app.use("/api/contact", contactRoutes);
// Routes
app.use("/api/buyer", buyerRoutes);
app.use("/api/products/home", productRoutes);
app.use("/api/orders", orderRoutes);
 // Use OTP routes
 app.use(deliveryRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use("/api", orderRoutes);
app.use(deliveryRoutes);
app.use('/uploads', express.static('uploads'));

app.get("/api/get-api-key", (req, res) => {
    res.json({ apiKey: process.env.VITE_OPENAI_API_KEY });
});

// ✅ Ensure this route is correctly included
app.use("/api", sellerRoutes); 
app.use("/api", admins); 
app.use("/api", cartRoutes);
// 🛠 Mount cartRoutes correctly
app.use("/api/carts", cartRoutes);
app.use("/api", analyticsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", productRoutes);
app.use("/", productRoutes);
app.use("/api/auth", authRoutes); // ✅ Ensure this is set
app.use("/api/users", require("./routes/userRoutes")); // For user login
app.use("/api/reviews", reviewRoutes);
app.use("/api",reviewRoutes);
app.use("/api",superRoutes);
app.use("/api", orderRoutes);

app.use("/api", buyerRoutes);
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);

app.use(
    session({
      secret: process.env.SESSION_SECRET || "my_super_secret_key", // Ensure this exists in .env
      resave: false,
      saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
    },
  })
  );
  
  // Initialize passport *AFTER* session middleware
  app.use(passport.initialize());
  app.use(passport.session());
  app.use((req, res, next) => {
    console.log("Session Data:", req.session);
    next();
  });

  app.use(authRoutes);

// Default Route
app.get("/", (req, res) => {
    res.send("Server is running...");
});
app.get("/api/sellers/email/:email", async (req, res) => {
    const email = req.params.email;
    console.log("Fetching seller data for email:", email);  // Debugging log

    try {
        const seller = await Seller.findOne({ email: email });  // Ensure correct query

        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        res.json({ success: true, seller });
    } catch (error) {
        console.error("Error fetching seller:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await Seller.find(); // Adjust based on your database schema
      res.json({ success: true, sellers });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching sellers" });
    }
  });
  

// Multer Configuration for Multiple Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save files in "uploads" folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Unique filename
    },
});
const upload = multer({ storage: storage });

// Route to Add Product (with Multiple Image Upload)
app.post("/api/products", upload.array("images", 5), async (req, res) => {
    try {
        const { name, category, price, stock, sellerEmail, description } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image" });
        }

        const imageUrls = req.files.map((file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`);

        if (!name || !category || !price || !stock || !sellerEmail) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newProduct = new Product({
            name,
            category,
            price,
            stock,
            sellerEmail,
            description,
            images: imageUrls, // Store full image URLs
            status: "pending", // Default status
        });

        await newProduct.save();
        res.json({ success: true, message: "Product added successfully", product: newProduct });

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Fetch all products and format image URLs correctly
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find({});

        // Ensure image URLs are complete
        const updatedProducts = products.map(product => {
            console.log("Before formatting:", product.images);
            return {
                ...product.toObject(),
                images: product.images.map(image =>
                    image.startsWith("http") ? image : `${req.protocol}://${req.get("host")}/uploads/${image}`
                )
            };
        });
        console.log("🟢 Updated Products:", updatedProducts);
        

        console.log("🟢 Products fetched:", updatedProducts);
        res.json({ success: true, products: updatedProducts });
    } catch (error) {
        console.error("🔴 Error fetching products:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
app.put("/api/update-status/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const { status } = req.body;

        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { status },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, message: "Product status updated", product: updatedProduct });
    } catch (error) {
        console.error("Error updating product status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
app.get("/api/products/approved", async (req, res) => {
    try {
        const approvedProducts = await Product.find({ status: "approved" });
        console.log("Approved Products:", approvedProducts); // Debugging
        res.json({ success: true, products: approvedProducts });
    } catch (error) {
        console.error("Error fetching approved products:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }

});
app.get("/api/approved-products", async (req, res) => {
    try {
        const products = await Product.find({ status: "approved" });
        res.json(products);
    } catch (error) {
        console.error("Error fetching approved products:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Ensure backward compatibility
        res.json({
            ...product._doc,
            images: product.images || [], // Default to empty array if undefined
            imageUrl: product.imageUrl || "", // Default to empty string if undefined
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
app.get("/api/farm-details/:productId", async (req, res) => {
    const { productId } = req.params;
  
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      if (!product.farmToTableProcess || product.farmToTableProcess.length === 0) {
        return res.status(404).json({ error: "Farm-to-table details not found" });
      }
  
      res.json({ farmToTableProcess: product.farmToTableProcess });
    } catch (error) {
      console.error("Error fetching farm details:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.post("/api/cart", async (req, res) => {
    const { email, productId, name, price, images, quantity } = req.body;

    console.log("Received Data:", req.body); // ✅ Log received data

    if (!email || !productId || !name || !price || !images || !Array.isArray(images) || images.length === 0) {
        console.error("❌ Validation Failed - Missing fields:", { email, productId, name, price, images, quantity });
        return res.status(400).json({ message: "Missing required fields or images not provided" });
    }

    try {
        const newCartItem = new Cart({ email, productId, name, price, images, quantity });
        await newCartItem.save();
        res.status(201).json({ message: "Added to cart", cartItem: newCartItem });
    } catch (error) {
        console.error("❌ Error adding to cart:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});





app.post("/api/products/cart", async (req, res) => {
    const { buyerId, productId, name, price, images } = req.body;
  
    try {
      const newCartItem = new Cart({ buyerId, productId, name, price, images });
      await newCartItem.save();
      res.status(201).json({ message: "Added to cart", cartItem: newCartItem });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  app.get('/api/carts', async (req, res) => {  // Changed '/api/cart' to '/api/carts'
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const cartItems = await Cart.find({ email }).populate("productId");
        if (!cartItems.length) {
            return res.status(404).json({ message: "No cart items found" });
        }

        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});



  
  

  app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
  
      try {
          const user = await User.findOne({ email });
  
          if (!user || user.password !== password) {
              return res.status(401).json({ message: "Invalid credentials" });
          }
  
          const token = jwt.sign({ id: user._id, email: user.email }, "430766e713131bcd1f0eced5f98a23353c6646eaa989136b84690297dfde1394", { expiresIn: "1h" });
  res.json({ token });
  
          res.json({ message: "Login successful", token });
      } catch (error) {
          console.error("Login error:", error);
          res.status(500).json({ message: "Server error" });
      }
  });

  // ✅ DELETE a specific cart item by Buyer Email & Cart Item ID
app.delete("/api/carts/:buyerEmail/:cartItemId", async (req, res) => {
    const { buyerEmail, cartItemId } = req.params;

    try {
        const deletedItem = await Cart.findOneAndDelete({ _id: cartItemId, email: buyerEmail });

        if (!deletedItem) {
            return res.status(404).json({ message: "❌ Cart item not found" });
        }

        res.json({ message: "✅ Cart item removed successfully", deletedItem });
    } catch (error) {
        console.error("❌ Error deleting cart item:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.get("/api/process-payment", async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ message: "Buyer email required!" });
    }
  
    // Simulate payment success (Replace with real payment verification logic)
    setTimeout(async () => {
      await sendPaymentSuccessEmail(email);
      res.json({ status: "Success", message: "Payment processed successfully!" });
    }, 5000); // Simulating delay
  });
  
  const sendPaymentSuccessEmail = async (buyerEmail) => {
    // Use nodemailer to send an email (Configure SMTP)
    console.log(`Payment successful email sent to ${buyerEmail}`);
  };
  

  app.post("/api/auth/forgot-password", async (req, res) => {
      try {
          console.log("Forgot Password API Hit", req.body); // Debugging
  
          const { email } = req.body;
          if (!email) {
              return res.status(400).json({ error: "Email is required" });
          }
  
          console.log("Checking if email exists in DB:", email);
          const user = await User.findOne({ email });
  
          if (!user) {
              return res.status(404).json({ error: "User not found" });
          }
  
          console.log("User found, generating reset token...");
  
          // ✅ Generate Secure Reset Token
          const resetToken = crypto.randomBytes(32).toString("hex");
          user.resetToken = resetToken;
          user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // Token expires in 15 minutes
          await user.save();
  
          console.log("Generated reset token:", resetToken);
  
          // ✅ Send Email with Reset Link
          const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
              },
          });
  
          const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
  
          const mailOptions = {
              from: '"Growza Support" <your-email@gmail.com>',
              to: user.email,
              subject: "Reset Your Password",
              text: `Click the following link to reset your password: ${resetLink}`,
              html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`,
          };
  
          console.log("Sending email...");
          await transporter.sendMail(mailOptions);
          console.log("Email sent successfully!");
  
          res.json({ message: "Password reset link sent to your email" });
      } catch (err) {
          console.error("Server error:", err);
          res.status(500).json({ error: "Server error" });
      }
  });
         
  app.post("/api/auth/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params; // ✅ Get token from URL
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: "New password is required" });
        }

        // Verify token
        const user = await User.findOne({ resetToken: token });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in database
        user.password = hashedPassword;
        user.resetToken = undefined; // Clear token after reset
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ error: "Server error" });
    }
});
app.post("/api/auth/check-seller", async (req, res) => {
    const { email } = req.body;
    const seller = await Seller.findOne({ email });

    if (seller) {
        return res.json({ exists: true });
    }
    return res.json({ exists: false });
});
app.post("/api/product/cart", async (req, res) => {
    try {
      const { productId, name, price, images, quantity } = req.body;
      
      const newCartItem = new Cart({
        productId,
        name,
        price,
        images,
        quantity,
      });
  
      await newCartItem.save();
      res.status(201).json({ message: "Product added to cart", cartItem: newCartItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to add product to cart" });
    }
  });
  
  app.post("/api/update-cart", async (req, res) => {
    const { productId, quantity } = req.body;
  
    try {
      const updatedProduct = await Cart.findByIdAndUpdate(
        productId,
        { $set: { quantity } },
        { new: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.json({ message: "Quantity updated", updatedProduct });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  const FarmingRequestSchema = new mongoose.Schema({
    name: String,
    email: String,
    spaceAvailable: String,
    environmentType: String,
    budget: String,
    farmingGoals: String,
    createdAt: { type: Date, default: Date.now },
  });
  
  const FarmingRequest = mongoose.model("customized_farming_requests", FarmingRequestSchema);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  app.post("/api/custom-farming", async (req, res) => {
    try {
      const { name, email, spaceAvailable, environmentType, budget, farmingGoals } = req.body;
  
      // Store in database
      const newRequest = new FarmingRequest({
        name,
        email,
        spaceAvailable,
        environmentType,
        budget,
        farmingGoals,
      });
      await newRequest.save();
  
      // Send Email to Buyer
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Farming Appointment Confirmation",
        text: `Dear ${name},\n\nThank you for your interest in customized farming! Your appointment has been booked successfully. Our team will contact you soon.\n\nBest Regards,\nGrowza Team`,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ success: false, message: "Failed to send email" });
        }
        console.log("Email sent:", info.response);
        res.status(200).json({ success: true, message: "Form submitted successfully" });
      });
    } catch (error) {
      console.error("Error saving form data:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

// Multer setup (for image upload)
const str = multer.memoryStorage();
const upd = multer({ str });

// 🌱 API Route to Detect Plant Disease
app.post("/detect-disease", upd.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        // Convert image to Base64
        const imageBase64 = req.file.buffer.toString("base64");

        // Request payload
        const requestData = {
            api_key: process.env.PLANT_ID_API_KEY,  // Ensure the API key is correctly set
            modifiers: ["health=all"],  // ✅ Correctly formatted modifiers
            images: [`data:image/jpeg;base64,${imageBase64}`]
        };

        // 🔍 Log request data for debugging
        console.log("Request Data:", JSON.stringify(requestData, null, 2));

        // Send request to Plant.id API
        const response = await axios.post("https://api.plant.id/v3/health_assessment", requestData, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "axios/1.8.4"
            }
        });

        // 🌿 Send API response back to client
        res.json(response.data);
    } catch (error) {
        console.error("Error detecting disease:", error.response?.data || error.message);

        res.status(500).json({
            error: "Failed to detect disease",
            details: error.response?.data || error.message  // Provide detailed error message
        });
    }
});
app.get("/orders/:orderId", async (req, res) => {
    try {
        const order = await order.findById(req.params.orderId)
            .populate("products.productId", "name images price") // Populate specific fields
            .lean(); // Convert to plain JS object

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
  // ✅ Apply to protected routes

  app.post("/api/orders/cancel/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    try {
        const order = await order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== "Pending") return res.status(400).json({ message: "Only pending orders can be cancelled" });

        order.cancellationRequest = {
            isRequested: true,
            reason: reason,
            status: "Requested"
        };

        // Automatically mark order as "Cancelled"
        order.status = "Cancelled";

        await order.save();
        res.json({ message: "Order cancelled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        console.log(`✅ Connected to MongoDB Database: ${mongoose.connection.name}`);
    })
    .catch(err => console.error("MongoDB connection error:", err));

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Received Request: ${req.method} ${req.url}`);
    next();
});
