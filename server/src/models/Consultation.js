import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    consultationType: {
      type: String,
      enum: ["video", "call", "chat"],
      required: true,
    },

    symptoms: {
      type: String,
      required: true,
      trim: true,
    },

    currentProblem: {
      type: String,
      required: true,
      trim: true,
    },

    currentMedication: {
      type: String,
      default: "",
      trim: true,
    },

    medicalHistory: {
      type: String,
      default: "",
      trim: true,
    },

    allergies: {
      type: String,
      default: "",
      trim: true,
    },

    reports: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    consultationDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "missed"],
      default: "scheduled",
    },

    doctorNotes: {
      type: String,
      default: "",
    },

    prescription: {
      type: String,
      default: "",
    },

    followUpRequired: {
      type: Boolean,
      default: false,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

consultationSchema.index({
  doctor: 1,
  consultationDate: 1,
});

consultationSchema.index({
  patient: 1,
  consultationDate: -1,
});

export default mongoose.model("Consultation", consultationSchema);
