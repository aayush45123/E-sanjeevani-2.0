import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "patient" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      profileCompleted: false,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ✅ Must use .select("+password") because password has select:false in schema
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Logout (stateless JWT — just acknowledge on client side)
export const logout = async (req, res) => {
  res.json({ success: true, message: "Logout successful" });
};

// Get current user (GET /api/auth/me)
export const me = async (req, res) => {
  try {
    // ✅ authMiddleware sets req.user = decoded token payload (has .userId)
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// Get patient profile (GET /api/auth/patient/me)
export const getPatientProfile = async (req, res) => {
  try {
    // ✅ req.user is the decoded JWT payload — use .userId not ._id
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// Update patient profile (PUT /api/auth/patient/update)
export const updatePatientProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      gender,
      bloodType,
      allergies,
      medicalHistory,
      address,
      city,
      state,
      zipCode,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId, // ✅ decoded JWT has .userId
      {
        name,
        email,
        phone,
        age,
        gender,
        bloodType,
        allergies: Array.isArray(allergies)
          ? allergies
          : allergies?.split(",").map((a) => a.trim()),
        medicalHistory: Array.isArray(medicalHistory)
          ? medicalHistory
          : medicalHistory?.split(",").map((m) => m.trim()),
        address,
        city,
        state,
        zipCode,
      },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Complete patient profile (PUT /api/auth/patient/complete-profile)
export const completePatientProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      age,
      gender,
      bloodType,
      allergies,
      medicalHistory,
      address,
      city,
      state,
      zipCode,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId, // ✅ decoded JWT has .userId
      {
        name,
        phone,
        age,
        gender,
        bloodType,
        allergies: Array.isArray(allergies)
          ? allergies
          : allergies
              ?.split(",")
              .map((a) => a.trim())
              .filter(Boolean),
        medicalHistory: Array.isArray(medicalHistory)
          ? medicalHistory
          : medicalHistory
              ?.split(",")
              .map((m) => m.trim())
              .filter(Boolean),
        address,
        city,
        state,
        zipCode,
        profileCompleted: true,
      },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Profile completed successfully",
      user,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};

// ─── ADD TO BOTTOM OF authController.js ─────────────────────────────────────

/*
Fix plain-text passwords for doctors added directly via DB queries.

POST /api/auth/admin/fix-password
Body: { email, plainPassword, adminSecret }

Use once per doctor, then remove or gate behind env check.
adminSecret must match process.env.ADMIN_SECRET in your .env
*/
export const fixDoctorPassword = async (req, res) => {
  try {
    const { email, plainPassword, adminSecret } = req.body;

    // Basic protection — set ADMIN_SECRET in your .env
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

    // Load user WITH password to check if it's already hashed
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If password is already a bcrypt hash, skip
    const isAlreadyHashed = user.password?.startsWith("$2");
    if (isAlreadyHashed) {
      return res.json({
        success: true,
        message: "Password is already hashed — no change made",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: `Password hashed successfully for ${email}`,
    });
  } catch (error) {
    console.error("fixDoctorPassword error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fix password",
      error: error.message,
    });
  }
};
