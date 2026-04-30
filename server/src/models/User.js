import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    phone: String,
    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },

    // Patient-specific fields
    age: Number,
    gender: String,
    bloodType: String,
    allergies: [String],
    medicalHistory: [String],
    address: String,
    city: String,
    state: String,
    zipCode: String,
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Doctor-specific fields
    specialization: String,
    qualification: String,
    experience: Number,
    averageRating: {
      type: Number,
      default: 0,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },

    // Common fields
    profileImage: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
