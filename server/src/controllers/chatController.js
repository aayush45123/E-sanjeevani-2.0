import { ChatService } from "../services/chat.service.js";

export const handleChat = async (req, res) => {
  try {
    const result = await ChatService.handleChat(req.body);
    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to generate AI response. Please try again.",
      error: error.error || error.message,
    });
  }
};

export const saveConsultationMessage = async (req, res) => {
  try {
    const message = await ChatService.saveConsultationMessage(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(201).json({
      message: "Message saved successfully",
      data: message,
    });
  } catch (error) {
    console.error("Save message controller error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Error saving message",
      error: error.error || error.message,
    });
  }
};

export const getConsultationMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const messages = await ChatService.getConsultationMessages(req.user.id, consultationId);
    return res.status(200).json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get messages controller error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Error retrieving messages",
      error: error.error || error.message,
    });
  }
};
