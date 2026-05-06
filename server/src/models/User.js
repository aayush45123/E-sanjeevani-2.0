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

    // Structured Patient Address
    patientAddress: {
      type: {
        apartment: String,
        street: String,
        district: String,
        city: String,
        pinCode: String,
        state: String,
        coordinates: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
          },
        },
      },
      default: null,
    },

    // Legacy address fields (backward compatibility)
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
  { timestamps: true },
);

// Create geospatial index for location queries
// sparse: true ensures index only applies to documents with valid coordinates
userSchema.index(
  { "patientAddress.coordinates": "2dsphere" },
  { sparse: true },
);

export default mongoose.model("User", userSchema);
