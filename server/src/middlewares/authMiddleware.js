// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.error("❌ User not found for userId:", decoded.userId);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ FIX: Properly set req.user with all necessary fields
    req.user = {
      _id: user._id, // MongoDB ObjectId for database queries
      id: user._id.toString(), // String version
      userId: decoded.userId, // From token
      email: decoded.email,
      role: decoded.role,
      name: user.name,
    };

    console.log("✅ Auth successful for user:", req.user._id);
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: err.message,
    });
  }
};

export default authMiddleware;
