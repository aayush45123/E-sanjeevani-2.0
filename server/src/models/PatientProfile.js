import mongoose from "mongoose";

const patientProfileSchema = new mongoose.Schema(
  {
    // linked user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // STEP 1 - Personal Details
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },

    maritalStatus: {
      type: String,
      required: true,
      enum: ["Single", "Married", "Divorced"],
    },

    // STEP 2 - Physical Vitals
    height: {
      type: Number,
      required: true,
    },

    weight: {
      type: Number,
      required: true,
    },

    bloodPressure: {
      type: String,
      default: "",
    },

    // STEP 3 - Lifestyle
    smoking: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },

    alcohol: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },

    diet: {
      type: String,
      required: true,
      enum: ["Vegetarian", "Non-Vegetarian", "Vegan"],
    },

    exercise: {
      type: String,
      required: true,
      enum: ["Daily", "Weekly", "Rarely", "Never"],
    },

    // STEP 4 - Medical History
    allergies: {
      type: String,
      default: "",
    },

    chronicConditions: {
      type: String,
      default: "",
    },

    currentMedications: {
      type: String,
      default: "",
    },

    pastSurgeries: {
      type: String,
      default: "",
    },

    // important for dashboard unlock
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// auto profile completion checker
patientProfileSchema.methods.checkCompletion = function () {
  const requiredFields = [
    "age",
    "gender",
    "bloodGroup",
    "maritalStatus",
    "height",
    "weight",
    "smoking",
    "alcohol",
    "diet",
    "exercise",
  ];

  return requiredFields.every((field) => {
    return (
      this[field] !== undefined && this[field] !== null && this[field] !== ""
    );
  });
};

// before save
patientProfileSchema.pre("save", function () {
  this.isProfileComplete = this.checkCompletion();
});

export default mongoose.model("PatientProfile", patientProfileSchema);
