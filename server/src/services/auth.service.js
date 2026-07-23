import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { UserRepository } from "../repositories/user.repository.js";
import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { sendWelcomeEmail } from "../emails/sendWelcomeEmail.js";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository.js";

import { getCookieSettings } from "../helpers/cookieSettings.helper.js";

const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenType: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    },
  );
};

const createRefreshTokenRaw = () => {
  return crypto.randomBytes(48).toString("hex");
};

export class AuthService {
  static async register(reqBody, res) {
    const { name, email, password, role = "patient" } = reqBody;
    if (!name || !email || !password) {
      throw { status: 400, message: "Name, email, and password are required" };
    }

    if (!["patient", "doctor"].includes(role)) {
      throw { status: 400, message: "Invalid user role" };
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw { status: 409, message: "User already exists with this email" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isVerified: true,
    });

    // Send welcome email in background
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch((err) =>
      console.error("Welcome email background send error:", err),
    );

    const accessToken = createAccessToken(user);
    const refreshTokenRaw = createRefreshTokenRaw();
    const refreshTokenHash = RefreshTokenRepository.hashToken(refreshTokenRaw);

    const now = new Date();
    const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
    const expiresAt = new Date(
      now.getTime() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      rotatedFromHash: null,
      expiresAt,
    });

    const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const cookieSettings = getCookieSettings();

    res.cookie(accessCookieName, accessToken, {
      ...cookieSettings,
      maxAge: Number(process.env.ACCESS_COOKIE_TTL_MS || 15 * 60 * 1000),
    });
    res.cookie(refreshCookieName, refreshTokenRaw, {
      ...cookieSettings,
      maxAge: Number(
        process.env.REFRESH_COOKIE_TTL_MS ||
          refreshTtlDays * 24 * 60 * 60 * 1000,
      ),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted: false,
      },
    };
  }

  static async login(reqBody, res, req) {
    const { email, password } = reqBody;
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }

    if (!user.isActive) {
      throw { status: 403, message: "User account is inactive" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: "Invalid email or password" };
    }

    let profileCompleted = false;
    if (user.role === "patient") {
      const patientProfile = await PatientProfileRepository.findByUserId(
        user.id,
      );
      profileCompleted = patientProfile?.isProfileComplete ?? false;
    } else if (user.role === "doctor") {
      const doctorProfile = await DoctorProfileRepository.findRawProfileByUserId(
        user.id,
      );
      profileCompleted = doctorProfile?.profileCompleted ?? false;
    }

    const accessToken = createAccessToken(user);
    const refreshTokenRaw = createRefreshTokenRaw();
    const refreshTokenHash = RefreshTokenRepository.hashToken(refreshTokenRaw);

    const now = new Date();
    const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
    const expiresAt = new Date(
      now.getTime() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const cookieSettings = getCookieSettings();

    // Revoke any existing refresh token in the browser cookie (previous session)
    const existingRefreshToken = req?.cookies?.[refreshCookieName];
    if (existingRefreshToken) {
      try {
        const existingHash = RefreshTokenRepository.hashToken(existingRefreshToken);
        await RefreshTokenRepository.revokeByHash(existingHash);
      } catch (e) {
        // Ignore — old token may already be revoked or not exist
      }
    }

    // Revoke all other stored sessions for this user (clean slate on login)
    await RefreshTokenRepository.revokeAllForUser(user.id);

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      rotatedFromHash: null,
      expiresAt,
    });

    res.cookie(accessCookieName, accessToken, {
      ...cookieSettings,
      maxAge: Number(process.env.ACCESS_COOKIE_TTL_MS || 15 * 60 * 1000),
    });
    res.cookie(refreshCookieName, refreshTokenRaw, {
      ...cookieSettings,
      maxAge: Number(
        process.env.REFRESH_COOKIE_TTL_MS ||
          refreshTtlDays * 24 * 60 * 60 * 1000,
      ),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted,
      },
    };
  }

  static async refresh(req, res) {
    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const token = req.cookies?.[refreshCookieName];

    if (!token) {
      throw { status: 401, message: "No refresh token" };
    }

    const tokenHash = RefreshTokenRepository.hashToken(token);
    const refreshRow = await RefreshTokenRepository.findByHash(tokenHash);

    if (!refreshRow || refreshRow.isRevoked) {
      throw { status: 401, message: "Invalid refresh token" };
    }

    if (
      refreshRow.expiresAt &&
      new Date(refreshRow.expiresAt).getTime() <= Date.now()
    ) {
      throw { status: 401, message: "Refresh token expired" };
    }

    // Rotation
    await RefreshTokenRepository.revokeByHash(tokenHash);

    const user = await UserRepository.findById(refreshRow.userId);
    if (!user || !user.isActive) {
      throw { status: 401, message: "User not found or inactive" };
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshRaw = createRefreshTokenRaw();
    const newRefreshHash = RefreshTokenRepository.hashToken(newRefreshRaw);

    const now = new Date();
    const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
    const expiresAt = new Date(
      now.getTime() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash: newRefreshHash,
      rotatedFromHash: tokenHash,
      expiresAt,
    });

    const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
    const refreshCookieNameOut =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const cookieSettings = getCookieSettings();

    res.cookie(accessCookieName, newAccessToken, {
      ...cookieSettings,
      maxAge: Number(process.env.ACCESS_COOKIE_TTL_MS || 15 * 60 * 1000),
    });
    res.cookie(refreshCookieNameOut, newRefreshRaw, {
      ...cookieSettings,
      maxAge: Number(
        process.env.REFRESH_COOKIE_TTL_MS ||
          refreshTtlDays * 24 * 60 * 60 * 1000,
      ),
    });

    return { userId: user.id, accessToken: newAccessToken };
  }

  static async logout(req, res) {
    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const token = req.cookies?.[refreshCookieName];

    if (token) {
      const tokenHash = RefreshTokenRepository.hashToken(token);
      await RefreshTokenRepository.revokeByHash(tokenHash);
    }

    const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
    const refreshCookieNameOut =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const cookieSettings = getCookieSettings();
    res.clearCookie(accessCookieName, cookieSettings);
    res.clearCookie(refreshCookieNameOut, cookieSettings);

    return { ok: true };
  }

  static async me(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    let profileCompleted = false;
    if (user.role === "patient") {
      const patientProfile = await PatientProfileRepository.findByUserId(
        user.id,
      );
      profileCompleted = patientProfile?.isProfileComplete ?? false;
    } else if (user.role === "doctor") {
      const doctorProfile = await DoctorProfileRepository.findRawProfileByUserId(
        user.id,
      );
      profileCompleted = doctorProfile?.profileCompleted ?? false;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      isActive: user.isActive,
      profileCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async fixDoctorPassword({ email, plainPassword, adminSecret }) {
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw { status: 403, message: "Unauthorized" };
    }

    if (!email || !plainPassword) {
      throw { status: 400, message: "email and plainPassword are required" };
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const isAlreadyHashed = user.passwordHash?.startsWith("$2");
    if (isAlreadyHashed) {
      return { message: "Password is already hashed — no change made" };
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await UserRepository.update(user.id, { passwordHash });

    return { message: `Password hashed successfully for ${normalizedEmail}` };
  }
}
