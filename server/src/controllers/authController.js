import { AuthService } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    console.error("Register controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Registration failed",
      error: error.error || error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Login failed",
      error: error.error || error.message,
    });
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const me = async (req, res) => {
  try {
    const user = await AuthService.me(req.user.id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Me controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch user",
      error: error.error || error.message,
    });
  }
};

export const getPatientProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: "Patient profile endpoint is temporarily unavailable during PostgreSQL migration",
  });
};

export const updatePatientProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: "Patient profile update is temporarily unavailable during PostgreSQL migration",
  });
};

export const completePatientProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: "Patient profile completion is temporarily unavailable during PostgreSQL migration",
  });
};

export const fixDoctorPassword = async (req, res) => {
  try {
    const result = await AuthService.fixDoctorPassword(req.body);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("FixDoctorPassword controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fix password",
      error: error.error || error.message,
    });
  }
};
