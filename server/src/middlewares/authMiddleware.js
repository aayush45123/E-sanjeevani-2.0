import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load user document
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = {
      ...decoded,
      id: decoded.userId,
    }; // Normalize payload for controllers that expect req.user.id
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: err.message,
    });
  }
};

export default authMiddleware;
