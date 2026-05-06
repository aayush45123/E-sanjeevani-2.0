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
// sparse: true ensures index only applies to documents with valid coordinates
doctorProfileSchema.index(
  { "clinicAddress.coordinates": "2dsphere" },
  { sparse: true },
);

// Pre-save middleware to clean up incomplete coordinates
doctorProfileSchema.pre("save", function (next) {
  try {
    // If clinicAddress exists but coordinates are incomplete, remove them
    if (this.clinicAddress && this.clinicAddress.coordinates) {
      const coords = this.clinicAddress.coordinates;
      // Remove coordinates if type is missing or coordinates array is empty
      if (
        !coords.type ||
        !Array.isArray(coords.coordinates) ||
        coords.coordinates.length === 0
      ) {
        delete this.clinicAddress.coordinates;
      }
    }
  } catch (err) {
    console.error("Pre-save hook error:", err);
  }
  return next();
});

export default mongoose.model("DoctorProfile", doctorProfileSchema);
