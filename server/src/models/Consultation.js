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
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    urgencyScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    symptoms: [String],
    diagnosis: String,
    prescription: String,
    notes: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    consultationType: {
      type: String,
      enum: ["video", "audio", "chat"],
      default: "video",
    },
    meetingLink: String,
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ doctor: 1, status: 1 });

export default mongoose.model("Consultation", consultationSchema);
