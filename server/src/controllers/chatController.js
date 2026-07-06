import { OpenAI } from "openai";
import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import { chatMessages, consultations } from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, asc } from "drizzle-orm";

// No DB involved here — unchanged from the original implementation
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
    const senderId = req.user.id; // adjust to match your auth middleware (e.g. req.user.id)
    const senderRole = req.user.role;

    if (!consultationId || !text) {
      return res
        .status(400)
        .json({ message: "Consultation ID and message text required" });
    }

    // Verify consultation exists and user is part of it
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId));

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify user is part of this consultation
    if (
      consultation.patientId !== senderId &&
      consultation.doctorId !== senderId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to message in this consultation" });
    }

    const [message] = await db
      .insert(chatMessages)
      .values({
        consultationId,
        senderId,
        senderName: senderName || "User",
        senderRole,
        text,
        messageType: "text",
      })
      .returning();

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
    const userId = req.user.id; // adjust to match your auth middleware (e.g. req.user.id)

    // Verify consultation exists and user is part of it
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId));

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify user is part of this consultation
    if (consultation.patientId !== userId && consultation.doctorId !== userId) {
      return res.status(403).json({ message: "Unauthorized to view messages" });
    }

    const messages = await db
      .select({
        id: chatMessages.id,
        senderId: chatMessages.senderId,
        senderName: chatMessages.senderName,
        senderRole: chatMessages.senderRole,
        text: chatMessages.text,
        messageType: chatMessages.messageType,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.consultationId, consultationId))
      .orderBy(asc(chatMessages.createdAt)); // Oldest first

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
