import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";
import { users, patientProfiles } from "../db/schema/index.js";

const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};

const getProfileCompletedStatus = async (user) => {
  if (user.role !== "patient") {
    return false;
  }

  const result = await db
    .select({
      isProfileComplete: patientProfiles.isProfileComplete,
    })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  return result[0]?.isProfileComplete ?? false;
};

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

/*
==================================================
REGISTER
POST /api/auth/register

PostgreSQL
==================================================
*/

export const register = async (req, res) => {
  try {
    const { name, email, password, role = "patient" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUsers = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertedUsers = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
      });

    const user = insertedUsers[0];

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,

        /*
          Temporary frontend compatibility.

          PostgreSQL users table no longer stores this field.
        */
        profileCompleted: false,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/*
==================================================
LOGIN
POST /api/auth/login

PostgreSQL
==================================================
*/

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = result[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /*
      Determine profile completion from relational profile tables later.

      Temporary compatibility value.
    */
    const profileCompleted = await getProfileCompletedStatus(user);
    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/*
==================================================
LOGOUT

Stateless JWT
==================================================
*/

export const logout = async (req, res) => {
  return res.json({
    success: true,
    message: "Logout successful",
  });
};

/*
==================================================
CURRENT USER
GET /api/auth/me

PostgreSQL
==================================================
*/

export const me = async (req, res) => {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        profileImage: users.profileImage,
        isVerified: users.isVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    const user = result[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Me error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

/*
==================================================
TEMPORARY MONGODB PATIENT PROFILE ENDPOINTS

Do not keep these after patient profile migration.
==================================================
*/

export const getPatientProfile = async (req, res) => {
  try {
    /*
      IMPORTANT:

      PostgreSQL UUID cannot find an old MongoDB ObjectId.

      Therefore this endpoint cannot safely use the PostgreSQL-authenticated
      req.user.id against MongoDB.

      We return a migration status response rather than silently querying
      the wrong database.
    */

    return res.status(503).json({
      success: false,
      message:
        "Patient profile endpoint is temporarily unavailable during PostgreSQL migration",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

export const updatePatientProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message:
      "Patient profile update is temporarily unavailable during PostgreSQL migration",
  });
};

export const completePatientProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message:
      "Patient profile completion is temporarily unavailable during PostgreSQL migration",
  });
};

/*
==================================================
FIX DOCTOR PASSWORD

PostgreSQL
==================================================
*/

export const fixDoctorPassword = async (req, res) => {
  try {
    const { email, plainPassword, adminSecret } = req.body;

    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!email || !plainPassword) {
      return res.status(400).json({
        success: false,
        message: "email and plainPassword are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = result[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isAlreadyHashed = user.passwordHash?.startsWith("$2");

    if (isAlreadyHashed) {
      return res.json({
        success: true,
        message: "Password is already hashed — no change made",
      });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return res.json({
      success: true,
      message: `Password hashed successfully for ${normalizedEmail}`,
    });
  } catch (error) {
    console.error("fixDoctorPassword error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fix password",
      error: error.message,
    });
  }
};
