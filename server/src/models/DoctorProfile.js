import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    superSpecialization: {
      type: String,
      default: "",
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    medicalRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    languagesSpoken: [
      {
        type: String,
        trim: true,
      },
    ],

    workingDays: [
      {
        type: String,
      },
    ],

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    consultationModes: [
      {
        type: String,
        enum: ["video", "call", "chat"],
      },
    ],

    medicalLicense: {
      type: String,
      default: "",
    },

    degreeCertificate: {
      type: String,
      default: "",
    },

    governmentIdProof: {
      type: String,
      default: "",
    },

    aboutDoctor: {
      type: String,
      default: "",
    },

    shortBio: {
      type: String,
      default: "",
    },

    // Clinic Information
    hasClinic: {
      type: Boolean,
      default: false,
    },

    clinicAddress: {
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
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Create geospatial index for location queries
doctorProfileSchema.index({ "clinicAddress.coordinates": "2dsphere" });

export default mongoose.model("DoctorProfile", doctorProfileSchema);
