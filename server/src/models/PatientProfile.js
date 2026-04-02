import mongoose from "mongoose";

const patientProfileSchema = new mongoose.Schema(
  {
    // ── Linked to auth user ──────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user, enforced at DB level
    },

    // ── Step 1: Basic Info ───────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [1, "Age must be at least 1"],
      max: [120, "Age must be realistic"],
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["Male", "Female", "Other", "Prefer not to say"],
        message: "Invalid gender value",
      },
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number format"],
    },

    emergencyContact: {
      type: String,
      match: [/^[+]?[\d\s\-()]{7,15}$/, "Invalid emergency contact format"],
      default: null,
    },

    // ── Step 2: Medical History ──────────────────────────────
    conditions: {
      type: [String],
      enum: {
        values: [
          "Diabetes",
          "Hypertension (BP)",
          "Heart Disease",
          "Asthma",
          "Thyroid",
          "None of the above",
        ],
        message: "Invalid condition value: {VALUE}",
      },
      default: [],
    },

    allergies: {
      type: String,
      trim: true,
      maxlength: [500, "Allergies description too long"],
      default: "",
    },

    medications: {
      type: String,
      trim: true,
      maxlength: [500, "Medications description too long"],
      default: "",
    },

    // ── Step 3: Lifestyle ────────────────────────────────────
    smoking: {
      type: String,
      enum: {
        values: ["Never", "Occasionally", "Regularly", "Ex-smoker", ""],
        message: "Invalid smoking status",
      },
      default: "",
    },

    alcohol: {
      type: String,
      enum: {
        values: ["Never", "Occasionally", "Regularly", ""],
        message: "Invalid alcohol status",
      },
      default: "",
    },

    // ── Step 4: Preferences ──────────────────────────────────
    language: {
      type: String,
      required: [true, "Language preference is required"],
      enum: {
        values: [
          "English",
          "Hindi",
          "Bengali",
          "Tamil",
          "Telugu",
          "Marathi",
          "Other",
        ],
        message: "Invalid language value",
      },
    },

    city: {
      type: String,
      trim: true,
      maxlength: [100, "City name too long"],
      default: "",
    },

    state: {
      type: String,
      trim: true,
      maxlength: [100, "State name too long"],
      default: "",
    },

    // ── Profile completion flag ──────────────────────────────
    // Drives the dashboard lock/unlock logic on the frontend
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto-managed
  },
);


// ── Virtual: patient age group (used by triage model) ────────
patientProfileSchema.virtual("ageGroup").get(function () {
  if (this.age < 18) return "pediatric";
  if (this.age < 60) return "adult";
  return "senior";
});

// ── Instance method: check if all required fields are filled ─
patientProfileSchema.methods.checkCompletion = function () {
  const required = ["fullName", "age", "gender", "phone", "language"];
  return required.every((field) => {
    const val = this[field];
    return val !== undefined && val !== null && val !== "";
  });
};

// ── Pre-save: auto-set isProfileComplete ─────────────────────
patientProfileSchema.pre("save", function (next) {
  this.isProfileComplete = this.checkCompletion();
  next();
});

export default mongoose.model("PatientProfile", patientProfileSchema);
