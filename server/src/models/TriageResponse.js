import mongoose from "mongoose";

const triageResponseSchema = new mongoose.Schema({
  triageSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TriageSession",
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symptoms: [
    {
      symptom: String,
      severity: String,
    },
  ],
  preliminaryAssessment: String,
  possibleConditions: [
    {
      condition: String,
      probability: Number,
      description: String,
    },
  ],
  recommendedTests: [String],
  recommendedSpecialties: [String],
  urgencyScore: {
    type: Number,
    min: 0,
    max: 10,
    required: true,
  },
  urgencyLevel: {
    type: String,
    enum: ["low", "moderate", "high", "critical"],
    required: true,
  },
  immediateRecommendations: [String],
  lifeStyleAdvice: [String],
  aiNotes: String,
  shouldAutoMatchDoctor: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("TriageResponse", triageResponseSchema);
