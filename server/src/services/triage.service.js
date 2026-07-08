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
      aiResponse: aiResponse || null,
      assignedDoctor,
    };
  }
}
