import { AuthService } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body, res);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.user,
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
    const result = await AuthService.login(req.body, res, req);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
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

export const refresh = async (req, res) => {
  try {
    const result = await AuthService.refresh(req, res);
    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 401).json({
      success: false,
      message: error.message || "Refresh failed",
      error: error.error || error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    await AuthService.logout(req, res);
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Logout failed",
      error: error.error || error.message,
    });
  }
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
    message:
      "Patient profile endpoint is temporarily unavailable during PostgreSQL migration",
  });
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
