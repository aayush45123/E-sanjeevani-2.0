import { TriageRepository } from "../repositories/triage.repository.js";
import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  calculateUrgencyScore,
  getUrgencyLevel,
  getRecommendedTests,
  getRecommendedSpecialties,
  getImmediateRecommendations,
} from "../helpers/urgencyScoring.js";
import {
  matchDoctorBySpecialty,
  createAutoMatchedConsultation,
} from "../helpers/doctorMatching.js";

const generateAIPreliminaryAssessment = (symptoms) => {
  const symptomList = symptoms.map((s) => s.symptom).join(", ");
  return `Based on the reported symptoms (${symptomList}), this appears to be a medical condition that warrants professional evaluation. 
The combination of symptoms suggests possible conditions ranging from common illnesses to more specific disorders. 
Professional medical consultation is recommended to rule out serious conditions and determine the appropriate treatment plan.`;
};

const generatePossibleConditions = (symptoms) => {
  const symptomLower = symptoms.map((s) => s.symptom.toLowerCase()).join(" ");
  const conditions = [];

  const conditionMappings = {
    "fever and cough and body ache": [
      {
        condition: "Influenza (Flu)",
        probability: 0.7,
        description: "Viral infection causing fever, cough, and body aches",
      },
      {
        condition: "Common Cold",
        probability: 0.5,
        description: "Upper respiratory tract infection",
      },
      {
        condition: "COVID-19",
        probability: 0.6,
        description: "Coronavirus infection",
      },
    ],
    "chest pain": [
      {
        condition: "Heart Attack",
        probability: 0.8,
        description: "Acute coronary syndrome - EMERGENCY",
      },
      {
        condition: "Angina",
        probability: 0.6,
        description: "Chest pain due to reduced blood flow",
      },
      {
        condition: "Muscle Strain",
        probability: 0.4,
        description: "Chest wall pain",
      },
    ],
    "difficulty breathing": [
      {
        condition: "Pneumonia",
        probability: 0.7,
        description: "Lung infection",
      },
      {
        condition: "Asthma Attack",
        probability: 0.6,
        description: "Airway constriction",
      },
      {
        condition: "Bronchitis",
        probability: 0.5,
        description: "Airway inflammation",
      },
    ],
    headache: [
      {
        condition: "Migraine",
        probability: 0.6,
        description: "Severe headache with other symptoms",
      },
      {
        condition: "Tension Headache",
        probability: 0.5,
        description: "Common headache type",
      },
      {
        condition: "Meningitis",
        probability: 0.3,
        description: "Brain membrane infection - serious",
      },
    ],
    "abdominal pain": [
      {
        condition: "Appendicitis",
        probability: 0.5,
        description: "Appendix inflammation",
      },
      {
        condition: "Gastroenteritis",
        probability: 0.6,
        description: "Stomach infection",
      },
      { condition: "Ulcer", probability: 0.4, description: "Stomach ulcer" },
    ],
  };

  for (const [key, conds] of Object.entries(conditionMappings)) {
    if (
      key.split(" and ").every((part) => symptomLower.includes(part)) ||
      symptomLower.includes(key)
    ) {
      conditions.push(...conds);
      return conditions;
    }
  }

  conditions.push({
    condition: "Medical Evaluation Required",
    probability: 0.5,
    description: "Professional medical evaluation needed to determine exact condition",
  });

  return conditions;
};

export class TriageService {
  static async createTriageSession(userId, requestBody) {
    const {
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      additionalNotes,
    } = requestBody;

    if (!userId) {
      throw { status: 401, message: "User authentication failed. Please log in again." };
    }

    if (!symptoms || symptoms.length === 0) {
      throw { status: 400, message: "At least one symptom is required" };
    }

    const triageSession = await TriageRepository.createSession({
      patientId: userId,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      additionalNotes,
      status: "pending",
    });

    return {
      triageSessionId: triageSession.id,
      session: triageSession,
    };
  }

  static async processTriageResponse(userId, triageSessionId) {
    const triageSession = await TriageRepository.findSessionById(triageSessionId);

    if (!triageSession) {
      throw { status: 404, message: "Triage session not found" };
    }

    if (triageSession.patientId !== userId) {
      throw { status: 403, message: "Unauthorized" };
    }

    const profile = await PatientProfileRepository.findByUserId(userId);
    const age = profile?.age || 30;

    const urgencyScore = calculateUrgencyScore(
      triageSession.symptoms,
      triageSession.medicalHistory,
      age,
    );
    const urgencyLevel = getUrgencyLevel(urgencyScore);

    const preliminaryAssessment = generateAIPreliminaryAssessment(triageSession.symptoms);
    const possibleConditions = generatePossibleConditions(triageSession.symptoms);
    const recommendedTests = getRecommendedTests(triageSession.symptoms, possibleConditions);
    const recommendedSpecialties = getRecommendedSpecialties(triageSession.symptoms, urgencyScore);
    const immediateRecommendations = getImmediateRecommendations(urgencyScore, triageSession.symptoms);

    const triageResponse = await TriageRepository.createResponse({
      triageSessionId,
      patientId: userId,
      symptoms: triageSession.symptoms,
      preliminaryAssessment,
      possibleConditions,
      recommendedTests,
      recommendedSpecialties,
      urgencyScore,
      urgencyLevel,
      immediateRecommendations,
      shouldAutoMatchDoctor: urgencyScore > 8,
    });

    const updateData = {
      urgencyScore,
      urgencyLevel,
      recommendedSpecialty: recommendedSpecialties[0],
      summaryTitle: `${urgencyLevel.toUpperCase()}: ${triageSession.symptoms[0].symptom}`,
      summaryDescription: preliminaryAssessment,
      status: "completed",
    };

    if (urgencyScore > 8) {
      try {
        const matchedDoctor = await matchDoctorBySpecialty(recommendedSpecialties, urgencyScore);
        if (matchedDoctor) {
          const consultation = await createAutoMatchedConsultation(
            userId,
            matchedDoctor,
            triageSessionId,
          );

          if (consultation) {
            updateData.assignedDoctorId = matchedDoctor.doctorId;
            updateData.status = "assigned_doctor";

            const updatedSession = await TriageRepository.updateSession(triageSessionId, updateData);

            return {
              autoMatched: true,
              message: "Triage completed. Doctor auto-matched due to high urgency!",
              triageResponse,
              autoMatchedConsultation: {
                consultationId: consultation.id,
                doctorName: matchedDoctor.doctor.fullName,
                specialization: matchedDoctor.doctor.specialization,
                scheduledDate: consultation.scheduledDate,
                scheduledTime: consultation.scheduledTime,
              },
              triageSession: updatedSession,
            };
          }
        }
      } catch (error) {
        console.error("Error in auto-matching doctor:", error);
      }
    }

    const updatedSession = await TriageRepository.updateSession(triageSessionId, updateData);

    return {
      autoMatched: false,
      message: "Triage processed successfully",
      triageResponse,
      triageSession: updatedSession,
    };
  }

  static async getTriageHistory(userId) {
    if (!userId) {
      throw { status: 401, message: "Unauthorized" };
    }

    const rows = await TriageRepository.findHistoryByPatientId(userId, 10);

    const triageHistory = rows.map((row) => ({
      _id: row.id,
      summaryTitle: row.summaryTitle,
      summaryDescription: row.summaryDescription,
      urgencyScore: row.urgencyScore,
      urgencyLevel: row.urgencyLevel,
      recommendedSpecialty: row.recommendedSpecialty,
      createdAt: row.createdAt,
      status: row.status,
      assignedDoctor: row.assignedDoctorId
        ? {
            _id: row.assignedDoctorId,
            fullName: row.assignedDoctorName,
            specialization: row.assignedDoctorSpecialization,
          }
        : null,
    }));

    return triageHistory;
  }

  static async getTriageSessionDetails(userId, triageSessionId) {
    const triageSession = await TriageRepository.findSessionById(triageSessionId);

    if (!triageSession) {
      throw { status: 404, message: "Triage session not found" };
    }

    if (triageSession.patientId !== userId) {
      throw { status: 403, message: "Unauthorized" };
    }

    const aiResponse = await TriageRepository.findResponseBySessionId(triageSessionId);
    const messages = await TriageRepository.findMessagesBySessionId(triageSessionId);

    let assignedDoctor = null;
    if (triageSession.assignedDoctorId) {
      const doctorRow = await DoctorProfileRepository.findByUserId(triageSession.assignedDoctorId);
      assignedDoctor = doctorRow
        ? {
            _id: doctorRow.user.id,
            fullName: doctorRow.user.name,
            specialization: doctorRow.profile.specialization,
            yearsOfExperience: doctorRow.profile.experience,
          }
        : null;
    }

    return {
      ...triageSession,
      messages: messages || [],
      aiResponse: aiResponse || null,
      assignedDoctor,
    };
  }

  static async sendChatMessage(userId, { triageSessionId, prompt, model }) {
    if (!userId) {
      throw { status: 401, message: "User authentication failed. Please log in again." };
    }

    if (!prompt || !prompt.trim()) {
      throw { status: 400, message: "Message content cannot be empty" };
    }

    let session;
    if (triageSessionId) {
      session = await TriageRepository.findSessionById(triageSessionId);
      if (!session) {
        throw { status: 404, message: "Triage session not found" };
      }
      if (session.patientId !== userId) {
        throw { status: 403, message: "Unauthorized to access this triage session" };
      }
    } else {
      const summaryTitle = prompt.trim().length > 60
        ? prompt.trim().substring(0, 57) + "..."
        : prompt.trim();

      const modelNameMap = {
        "ii-medical-8b": "II-Medical-8B Chat",
        "custom-triage-ai": "E-Sanjeevani ML Triage",
        "fever-assessment": "Fever Differential Assessment",
      };
      const modelLabel = modelNameMap[model] || "AI Medical Triage";

      session = await TriageRepository.createSession({
        patientId: userId,
        symptoms: [],
        summaryTitle,
        summaryDescription: `${modelLabel} Conversation`,
        status: "pending",
      });
      triageSessionId = session.id;
    }

    // 1. Save user message to PostgreSQL
    const userMessage = await TriageRepository.createMessage({
      triageSessionId,
      patientId: userId,
      role: "user",
      content: prompt.trim(),
    });

    // 2. Fetch recent conversation messages to maintain AI context
    const previousMessages = await TriageRepository.findMessagesBySessionId(triageSessionId);

    // 3. Generate AI response
    let aiResponseText = "";
    if (model === "custom-triage-ai") {
      try {
        const { predictTriageDisease } = await import("../ai/aiTriageClient.js");
        const res = await predictTriageDisease(prompt);
        const predictionData = res.data?.data || res.data;
        aiResponseText = `## AI Triage Report\n\n### Predicted Disease\n${predictionData.predictedDisease || "General Evaluation"}\n\n### Urgency Level\n${predictionData.urgency || "Moderate"}\n\n### Recommended Specialist\n${predictionData.doctorType || "General Physician"}\n\nPlease consult a qualified doctor for a complete medical diagnosis.`;
      } catch (err) {
        console.error("Custom ML triage model error:", err.message);
        aiResponseText = "I have recorded your symptoms. Based on current AI analysis, please monitor your condition and consult a healthcare professional if symptoms persist.";
      }
    } else {
      try {
        const { OpenAI } = await import("openai");
        if (process.env.HF_TOKEN) {
          const client = new OpenAI({
            baseURL: "https://router.huggingface.co/v1",
            apiKey: process.env.HF_TOKEN,
          });

          const formattedHistory = previousMessages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          }));

          const chatCompletion = await client.chat.completions.create({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [
              {
                role: "system",
                content: "You are a professional, empathetic clinical AI assistant for E-Sanjeevani. Provide helpful, accurate medical triage advice, ask relevant follow-up questions, and educate patients. Always advise consulting a doctor for severe symptoms.",
              },
              ...formattedHistory,
            ],
          });

          aiResponseText = chatCompletion.choices[0]?.message?.content || "Thank you for sharing your symptoms. Please consult a doctor for advice.";
        } else {
          aiResponseText = "I have received your message. Please describe any additional symptoms so I can assist you better.";
        }
      } catch (err) {
        console.error("HuggingFace OpenAI chat error:", err.message);
        aiResponseText = "I received your message. Please share details on symptom duration and severity so I can provide guidance.";
      }
    }

    // 4. Save AI response to PostgreSQL
    const aiMessage = await TriageRepository.createMessage({
      triageSessionId,
      patientId: userId,
      role: "assistant",
      content: aiResponseText,
    });

    // 5. Update session title if default
    if (!session.summaryTitle || session.summaryTitle === "AI Triage Session") {
      const summaryTitle = prompt.trim().length > 60
        ? prompt.trim().substring(0, 57) + "..."
        : prompt.trim();

      await TriageRepository.updateSession(triageSessionId, {
        summaryTitle,
        updatedAt: new Date(),
      });
    } else {
      await TriageRepository.updateSession(triageSessionId, {
        updatedAt: new Date(),
      });
    }

    return {
      triageSessionId,
      userMessage,
      aiMessage,
    };
  }

  static async deleteTriageSession(userId, triageSessionId) {
    if (!userId) {
      throw { status: 401, message: "Unauthorized" };
    }

    const deleted = await TriageRepository.deleteSession(triageSessionId, userId);
    if (!deleted) {
      throw { status: 404, message: "Triage session not found or unauthorized" };
    }

    return { success: true, message: "Triage session deleted successfully" };
  }
}

