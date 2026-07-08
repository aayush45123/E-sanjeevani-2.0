import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository.js";
import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import { sendWelcomeEmail } from "../emails/sendWelcomeEmail.js";

const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
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

export class AuthService {
  static async register({ name, email, password, role = "patient" }) {
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
    });

    // Send welcome email in background
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch((err) => console.error("Welcome email background send error:", err));

    const token = createToken(user);

    return {
      token,
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

  static async login({ email, password }) {
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
      const patientProfile = await PatientProfileRepository.findByUserId(user.id);
      profileCompleted = patientProfile?.isProfileComplete ?? false;
    }

    const token = createToken(user);

    return {
      token,
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

  static async me(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
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
