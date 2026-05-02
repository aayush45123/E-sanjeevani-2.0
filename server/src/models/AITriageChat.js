import mongoose from "mongoose";

const aiTriageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    symptoms: {
      type: String,
      required: true,
    },

    predictedDisease: {
      type: String,
      required: true,
    },

    urgency: {
      type: String,
      required: true,
    },

    doctorType: {
      type: String,
      required: true,
    },

    finalDoctorDiagnosis: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("AITriageChat", aiTriageSchema);
