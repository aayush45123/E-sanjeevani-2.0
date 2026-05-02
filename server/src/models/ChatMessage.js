import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: String,
  senderRole: {
    type: String,
    enum: ["doctor", "patient"],
  },
  text: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "system"],
    default: "text",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
chatMessageSchema.index({ consultationId: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
