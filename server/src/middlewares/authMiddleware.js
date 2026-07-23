import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";
import { users } from "../database/schema/index.js";

const authMiddleware = async (req, res, next) => {
  try {
    const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
    let token;

    // 1. Prioritize Authorization Bearer header over cookies (for port isolation on localhost)
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // 2. Fall back to cookie if no Bearer header present
    if (!token) {
      token = req.cookies?.[accessCookieName];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No access token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Always fetch fresh user identity and current role directly from PostgreSQL
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = result[0];

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : "patient";

    req.user = {
      _id: user.id,
      id: user.id,
      userId: user.id,

      name: user.name,
      email: user.email,
      role: normalizedRole,

      isVerified: user.isVerified,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authMiddleware;
