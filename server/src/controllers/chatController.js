import { OpenAI } from "openai";
import ChatMessage from "../models/ChatMessage.js";
import Consultation from "../models/Consultation.js";

export const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN environment variable is not set");
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please contact support.",
      });
    }

    // Initialize client inside the controller
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "Intelligent-Internet/II-Medical-8B:featherless-ai",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: {
        reply: chatCompletion.choices[0].message.content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI response. Please try again.",
      error: error.message,
    });
  }
};

// Save a consultation message
export const saveConsultationMessage = async (req, res) => {
  try {
    const { consultationId, text, senderName } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (!consultationId || !text) {
      return res
        .status(400)
        .json({ message: "Consultation ID and message text required" });
    }

    // Verify consultation exists and user is part of it
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify user is part of this consultation
    if (
      consultation.patientId.toString() !== senderId.toString() &&
      consultation.doctorId.toString() !== senderId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to message in this consultation" });
    }

    const message = new ChatMessage({
      consultationId,
      senderId,
      senderName: senderName || "User",
      senderRole,
      text,
      messageType: "text",
    });

    await message.save();

    res.status(201).json({
      message: "Message saved successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    res
      .status(500)
      .json({ message: "Error saving message", error: error.message });
  }
};

// Get consultation messages
export const getConsultationMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user._id;

    // Verify consultation exists and user is part of it
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify user is part of this consultation
    if (
      consultation.patientId.toString() !== userId.toString() &&
      consultation.doctorId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to view messages" });
    }

    const messages = await ChatMessage.find({ consultationId })
      .select("senderId senderName senderRole text messageType createdAt")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res
      .status(500)
      .json({ message: "Error retrieving messages", error: error.message });
  }
};
