import TriageSession from "../models/TriageSession.js";
import TriageResponse from "../models/TriageResponse.js";
import User from "../models/User.js";
import {
  calculateUrgencyScore,
  getUrgencyLevel,
  getRecommendedTests,
  getRecommendedSpecialties,
  getImmediateRecommendations,
} from "../utils/urgencyScoring.js";
import {
  matchDoctorBySpecialty,
  createAutoMatchedConsultation,
} from "../utils/doctorMatching.js";

// Start/Create a new triage session
export const createTriageSession = async (req, res) => {
  try {
    const {
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      additionalNotes,
    } = req.body;
    const patientId = req.user._id;

    // Validate required data
    if (!symptoms || symptoms.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one symptom is required" });
    }

    // Create new triage session
    const triageSession = new TriageSession({
      patientId,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      additionalNotes,
      status: "pending",
    });

    await triageSession.save();

    res.status(201).json({
      message: "Triage session created successfully",
      triageSessionId: triageSession._id,
      session: triageSession,
    });
  } catch (error) {
    console.error("Error creating triage session:", error);
    res
      .status(500)
      .json({ message: "Error creating triage session", error: error.message });
  }
};

// Process triage and generate AI response
export const processTriageResponse = async (req, res) => {
  try {
    const { triageSessionId } = req.params;
    const patientId = req.user._id;

    // Get triage session
    const triageSession = await TriageSession.findById(triageSessionId);
    if (!triageSession) {
      return res.status(404).json({ message: "Triage session not found" });
    }

    // Verify ownership
    if (triageSession.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get patient details for age-based scoring
    const patient = await User.findById(patientId);
    const age = patient.age || 30;

    // Calculate urgency score
    const urgencyScore = calculateUrgencyScore(
      triageSession.symptoms,
      triageSession.medicalHistory,
      age,
    );
    const urgencyLevel = getUrgencyLevel(urgencyScore);

    // Generate preliminary assessment (in real scenario, this would call GPT or similar AI)
    const preliminaryAssessment = generateAIPreliminaryAssessment(
      triageSession.symptoms,
    );

    // Get possible conditions
    const possibleConditions = generatePossibleConditions(
      triageSession.symptoms,
    );

    // Get recommended tests
    const recommendedTests = getRecommendedTests(
      triageSession.symptoms,
      possibleConditions,
    );

    // Get recommended specialties
    const recommendedSpecialties = getRecommendedSpecialties(
      triageSession.symptoms,
      urgencyScore,
    );

    // Get immediate recommendations
    const immediateRecommendations = getImmediateRecommendations(
      urgencyScore,
      triageSession.symptoms,
    );

    // Create triage response
    const triageResponse = new TriageResponse({
      triageSessionId,
      patientId,
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

    await triageResponse.save();

    // Update triage session
    triageSession.aiResponse = triageResponse._id;
    triageSession.urgencyScore = urgencyScore;
    triageSession.recommendedSpecialty = recommendedSpecialties[0];
    triageSession.summaryTitle = `${urgencyLevel.toUpperCase()}: ${triageSession.symptoms[0].symptom}`;
    triageSession.summaryDescription = preliminaryAssessment;
    triageSession.status = "completed";

    // Auto-match doctor if urgency score > 8
    if (urgencyScore > 8) {
      try {
        const matchedDoctor = await matchDoctorBySpecialty(
          recommendedSpecialties,
          urgencyScore,
        );

        if (matchedDoctor) {
          const consultation = await createAutoMatchedConsultation(
            patientId,
            matchedDoctor,
            triageSessionId,
          );

          if (consultation) {
            triageSession.assignedDoctor = matchedDoctor.doctorId;
            triageSession.status = "assigned_doctor";
            triageResponse.shouldAutoMatchDoctor = true;

            await triageSession.save();

            return res.status(200).json({
              message:
                "Triage completed. Doctor auto-matched due to high urgency!",
              triageResponse,
              autoMatchedConsultation: {
                consultationId: consultation._id,
                doctorName: matchedDoctor.doctor.fullName,
                specialization: matchedDoctor.doctor.specialization,
                scheduledDate: consultation.scheduledDate,
                scheduledTime: consultation.scheduledTime,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error in auto-matching doctor:", error);
        // Continue without auto-match if there's an error
      }
    }

    await triageSession.save();

    res.status(200).json({
      message: "Triage processed successfully",
      triageResponse,
      triageSession,
    });
  } catch (error) {
    console.error("Error processing triage response:", error);
    res
      .status(500)
      .json({ message: "Error processing triage", error: error.message });
  }
};

// Get patient's triage history (summaries only)
export const getTriageHistory = async (req, res) => {
  try {
    const patientId = req.user._id;

    // Get all triage sessions for patient, showing only summary
    const triageSessions = await TriageSession.find({ patientId })
      .select(
        "summaryTitle summaryDescription urgencyScore urgencyLevel recommendedSpecialty createdAt status assignedDoctor",
      )
      .populate("assignedDoctor", "fullName specialization")
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 sessions

    res.status(200).json({
      message: "Triage history retrieved",
      triageHistory: triageSessions,
    });
  } catch (error) {
    console.error("Error getting triage history:", error);
    res.status(500).json({
      message: "Error retrieving triage history",
      error: error.message,
    });
  }
};

// Get specific triage session details
export const getTriageSessionDetails = async (req, res) => {
  try {
    const { triageSessionId } = req.params;
    const patientId = req.user._id;

    // Get triage session
    const triageSession = await TriageSession.findById(triageSessionId)
      .populate("aiResponse")
      .populate(
        "assignedDoctor",
        "fullName specialization rating yearsOfExperience",
      );

    if (!triageSession) {
      return res.status(404).json({ message: "Triage session not found" });
    }

    // Verify ownership
    if (triageSession.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      message: "Triage session details",
      triageSession,
    });
  } catch (error) {
    console.error("Error getting triage session details:", error);
    res.status(500).json({
      message: "Error retrieving session details",
      error: error.message,
    });
  }
};

// Generate AI preliminary assessment
const generateAIPreliminaryAssessment = (symptoms) => {
  const symptomList = symptoms.map((s) => s.symptom).join(", ");

  return `Based on the reported symptoms (${symptomList}), this appears to be a medical condition that warrants professional evaluation. 
The combination of symptoms suggests possible conditions ranging from common illnesses to more specific disorders. 
Professional medical consultation is recommended to rule out serious conditions and determine the appropriate treatment plan.`;
};

// Generate possible conditions based on symptoms
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

  // Find matching conditions
  for (const [key, conds] of Object.entries(conditionMappings)) {
    if (
      key.split(" and ").every((part) => symptomLower.includes(part)) ||
      symptomLower.includes(key)
    ) {
      conditions.push(...conds);
      return conditions;
    }
  }

  // Default generic condition
  conditions.push({
    condition: "Medical Evaluation Required",
    probability: 0.5,
    description:
      "Professional medical evaluation needed to determine exact condition",
  });

  return conditions;
};
