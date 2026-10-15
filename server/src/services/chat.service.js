import { OpenAI } from "openai";
import { ChatRepository } from "../repositories/chat.repository.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";
import { TriageService } from "./triage.service.js";
import { findBestDoctorForPatient } from "../helpers/remediesAndDoctorRecommender.js";

export class ChatService {
  static async handleChat(userId, { prompt, triageSessionId, model, latitude, longitude, city, userLocation }) {
    if (!prompt) {
      throw { status: 400, message: "Prompt is required" };
    }

    if (userId) {
      const chatResult = await TriageService.sendChatMessage(userId, {
        triageSessionId,
        prompt,
        model,
        latitude,
        longitude,
        city,
        userLocation,
      });

      return {
        reply: chatResult.aiMessage.content,
        triageSessionId: chatResult.triageSessionId,
        userMessage: chatResult.userMessage,
        aiMessage: chatResult.aiMessage,
        recommendedDoctor: chatResult.recommendedDoctor || null,
        timestamp: new Date().toISOString(),
      };
    }

    const recResult = await findBestDoctorForPatient({
      symptoms: prompt,
      latitude: latitude || userLocation?.latitude,
      longitude: longitude || userLocation?.longitude,
      city: city || userLocation?.city,
    });

    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN environment variable is not set");
      let reply = "I received your medical inquiry. Please consult a qualified specialist for comprehensive assessment.";
      if (recResult?.recommendationText) {
        reply += `\n\n${recResult.recommendationText}`;
      }
      return {
        reply,
        recommendedDoctor: recResult?.doctor || null,
        timestamp: new Date().toISOString(),
      };
    }

    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "system",
          content: "You are a professional, empathetic clinical AI assistant. Provide helpful, accurate medical triage and health education. Always advise the patient to consult a doctor for serious symptoms.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let reply = chatCompletion.choices[0].message.content;
    if (recResult?.recommendationText && !reply.toLowerCase().includes("recommended doctor")) {
      reply += `\n\n${recResult.recommendationText}`;
    }

    return {
      reply,
      recommendedDoctor: recResult?.doctor || null,
      timestamp: new Date().toISOString(),
    };
  }


  static async saveConsultationMessage(userId, userRole, { consultationId, text, senderName }) {
    if (!consultationId || !text) {
      throw { status: 400, message: "Consultation ID and message text required" };
    }

    const consultation = await ConsultationRepository.findById(consultationId);
    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    if (consultation.patientId !== userId && consultation.doctorId !== userId) {
      throw { status: 403, message: "Unauthorized to message in this consultation" };
    }

    const message = await ChatRepository.createMessage({
      consultationId,
      senderId: userId,
      senderName: senderName || "User",
      senderRole: userRole,
      text,
      messageType: "text",
    });

    return message;
  }

  static async getConsultationMessages(userId, consultationId) {
    const consultation = await ConsultationRepository.findById(consultationId);
    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    if (consultation.patientId !== userId && consultation.doctorId !== userId) {
      throw { status: 403, message: "Unauthorized to view messages" };
    }

    return ChatRepository.findMessagesByConsultationId(consultationId);
  }
}
