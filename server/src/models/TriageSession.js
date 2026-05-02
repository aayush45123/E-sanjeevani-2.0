import mongoose from "mongoose";

const triageSessionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symptoms: [
    {
      symptom: String,
      duration: String, // e.g., "2 days", "1 week"
      severity: String, // mild, moderate, severe
      description: String,
    },
  ],
  medicalHistory: String,
  currentMedications: String,
  allergies: String,
  additionalNotes: String,
  aiResponse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TriageResponse",
  },
  urgencyScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  urgencyLevel: {
    type: String,
    enum: ["low", "moderate", "high", "critical"],
    default: "low",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "awaiting_doctor", "assigned_doctor"],
    default: "pending",
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recommendedSpecialty: String,
  summaryTitle: String,
  summaryDescription: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update timestamp
triageSessionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("TriageSession", triageSessionSchema);
