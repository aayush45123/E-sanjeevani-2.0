import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";
import { users } from "../db/schema/index.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const token = authorization.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      .where(eq(users.id, decoded.userId))
      .limit(1);

    const user = result[0];

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    /*
      Compatibility shape.

      Existing controllers may use:
      req.user._id
      req.user.id
      req.user.id

      During migration, all three contain the PostgreSQL UUID.
    */
    req.user = {
      _id: user.id,
      id: user.id,
      userId: user.id,

      name: user.name,
      email: user.email,
      role: user.role,

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
