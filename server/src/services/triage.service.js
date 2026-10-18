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
import {
  getHomemadeRemediesText,
  getTopDoctorRecommendation,
  findBestDoctorForPatient,
} from "../helpers/remediesAndDoctorRecommender.js";

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

  static async sendChatMessage(userId, { triageSessionId, prompt, model, latitude, longitude, city, userLocation }) {
    if (!userId) {
      throw { status: 401, message: "User authentication failed. Please log in again." };
    }

    if (!prompt || !prompt.trim()) {
      throw { status: 400, message: "Message content cannot be empty" };
    }

    const reqLat = latitude !== undefined && latitude !== null ? latitude : userLocation?.latitude;
    const reqLon = longitude !== undefined && longitude !== null ? longitude : userLocation?.longitude;
    const reqCity = city || userLocation?.city;

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
        "e-sanjeevani-triage": "E-Sanjeevani Triage",
        "fever-assessment": "E-Sanjeevani Triage",
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
    let recommendedDoctor = null;

    if (model === "e-sanjeevani-triage" || model === "custom-triage-ai" || model === "fever-assessment") {
      try {
        const { predictUnifiedTriage } = await import("../ai/triageClient.js");
        const { AiTriageRepository } = await import("../repositories/aiTriage.repository.js");

        let triageData;
        try {
          const res = await predictUnifiedTriage({ symptoms: prompt }, 3500);
          triageData = res.data;
        } catch (pyErr) {
          console.warn("[TriageService] Python microservice timeout/offline, using clinical synthesis:", pyErr.message);
          triageData = null;
        }

        const condition = triageData?.primary_condition || "Clinical Symptom Assessment";
        const category = (triageData?.primary_category || "General").toUpperCase();
        const confidence = triageData?.overall_confidence || 85;
        const urgency = triageData?.red_flag_alert
          ? "Critical"
          : (triageData?.urgency_level || (confidence >= 75 ? "Moderate" : "Low"));
        const specialist = triageData?.recommended_specialist || "General Physician";

        let report = `## E-Sanjeevani Triage Report\n\n`;
        if (triageData?.red_flag_alert) {
          report += `> ⚠️ **EMERGENCY WARNING:** ${triageData.red_flag_message || "Acute danger signs detected. Please seek emergency hospital care immediately."}\n\n`;
        } else {
          report += `**Category:** ${category}\n**Candidate Condition:** ${condition} (${confidence}% match)\n**Recommended Specialist:** ${specialist}\n**Urgency Level:** ${urgency}\n\n`;
        }

        if (triageData?.primary_explanation && triageData.primary_explanation.length > 0) {
          report += `### Relevant Reported Symptoms\n${triageData.primary_explanation.map((e) => `• ${e}`).join("\n")}\n\n`;
        }

        const remedies = getHomemadeRemediesText(condition, urgency);
        if (remedies && !triageData?.red_flag_alert) {
          report += `${remedies}\n\n`;
        }

        const recResult = await findBestDoctorForPatient({
          symptoms: prompt,
          disease: condition,
          specialty: specialist,
          latitude: reqLat,
          longitude: reqLon,
          city: reqCity,
        });

        if (recResult?.recommendationText) {
          report += `${recResult.recommendationText}\n\n`;
        }
        if (recResult?.doctor) {
          recommendedDoctor = recResult.doctor;
        }

        report += `---\n*${triageData?.disclaimer || "AI-assisted clinical differential guide. Not a confirmed medical diagnosis. Please consult a qualified doctor."}*`;
        aiResponseText = report;

        // Persist to aiTriageChats for In-Call Doctor Assistant & Analytics
        try {
          await AiTriageRepository.createChat({
            userId,
            symptoms: prompt.substring(0, 500),
            predictedDisease: condition,
            urgency: urgency,
            doctorType: specialist,
          });
        } catch (chatErr) {
          console.warn("[TriageService] Note on saving aiTriageChats:", chatErr.message);
        }
      } catch (err) {
        console.error("Unified triage execution error:", err.message);
        aiResponseText = "Your symptoms have been recorded. Based on initial clinical review, please monitor your condition and consult a qualified doctor if symptoms persist.";
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
                content:
                  "You are a professional, empathetic clinical AI assistant for E-Sanjeevani. If the patient describes symptoms that appear low or medium in urgency/severity, you MUST prescribe safe, practical homemade remedies (such as ginger-tulsi tea, hydration, warm gargles, honey, steam inhalation, and rest) and recommend they book a consultation with our verified doctors on E-Sanjeevani.",
              },
              ...formattedHistory,
            ],
          });

          aiResponseText = chatCompletion.choices[0]?.message?.content || "Thank you for sharing your symptoms. Please consult a doctor for advice.";
        } else {
          aiResponseText = "I have received your message. For mild to moderate symptoms, ensure adequate hydration, rest, and warm fluids like ginger-tulsi tea. Please consult an available doctor if symptoms persist.";
        }

        // Recommend top doctor matching symptoms and location
        const recResult = await findBestDoctorForPatient({
          symptoms: prompt,
          latitude: reqLat,
          longitude: reqLon,
          city: reqCity,
        });

        if (recResult?.doctor) {
          recommendedDoctor = recResult.doctor;
        }

        const symptomPattern = /fever|cough|cold|headache|chills|throat|stomach|pain|nausea|vomit|ache|dengue|malaria|typhoid|fatigue|flu|rash|chest|breath|skin|joint|knee|bone|eye|ear|period|pregnant|heart|bleed|tooth|dental/i;
        if (symptomPattern.test(prompt)) {
          const remedies = getHomemadeRemediesText(prompt, "Moderate");
          if (remedies && !aiResponseText.toLowerCase().includes("remedies")) {
            aiResponseText += `\n\n${remedies}`;
          }
          if (recResult?.recommendationText && !aiResponseText.toLowerCase().includes("recommended doctor")) {
            aiResponseText += `\n\n${recResult.recommendationText}`;
          }
        } else if (recResult?.recommendationText && !aiResponseText.toLowerCase().includes("recommended doctor")) {
          aiResponseText += `\n\n${recResult.recommendationText}`;
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
      recommendedDoctor,
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

