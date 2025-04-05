const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("❌ No token provided");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ Attach decoded token data (id & email)
        console.log("✅ Authenticated User:", decoded);
        next();
    } catch (error) {
        console.error("🔥 Token verification failed:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

module.exports = authenticateUser;
