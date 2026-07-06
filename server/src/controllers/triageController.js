import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import {
  triageSessions,
  triageResponses,
  patientProfiles,
  users,
  doctorProfiles,
} from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
    // Request logging removed to reduce noise

    const {
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      additionalNotes,
    } = req.body;

    // Get patientId from req.user
    const patientId = req.user?.userId; // adjust to match your auth middleware (e.g. req.user.id)

    if (!patientId) {
      console.error("❌ ERROR: patientId not found. req.user:", req.user);
      return res.status(401).json({
        message: "User authentication failed. Please log in again.",
        user: req.user,
      });
    }

    // Validate required data
    if (!symptoms || symptoms.length === 0) {
      console.warn("⚠️ No symptoms provided");
      return res
        .status(400)
        .json({ message: "At least one symptom is required" });
    }

    // Creating triage session

    // Create new triage session
    const [triageSession] = await db
      .insert(triageSessions)
      .values({
        patientId,
        symptoms,
        medicalHistory,
        currentMedications,
        allergies,
        additionalNotes,
        status: "pending",
      })
      .returning();

    // Triage session saved

    res.status(201).json({
      message: "Triage session created successfully",
      triageSessionId: triageSession.id,
      session: triageSession,
    });
  } catch (error) {
    console.error("❌ Error creating triage session:", error.message);
    console.error("📍 Stack:", error.stack);
    res
      .status(500)
      .json({ message: "Error creating triage session", error: error.message });
  }
};

// Process triage and generate AI response
export const processTriageResponse = async (req, res) => {
  try {
    // processTriageResponse invoked
    const { triageSessionId } = req.params;
    const patientId = req.user?.userId; // adjust to match your auth middleware (e.g. req.user.id)

    // Processing triage

    // Get triage session
    const [triageSession] = await db
      .select()
      .from(triageSessions)
      .where(eq(triageSessions.id, triageSessionId));

    if (!triageSession) {
      console.warn("⚠️ Triage session not found");
      return res.status(404).json({ message: "Triage session not found" });
    }

    // Verify ownership
    if (triageSession.patientId !== patientId) {
      console.error("❌ Unauthorized access");
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get patient details for age-based scoring.
    // Note: "age" now lives on patient_profiles, not on the users table.
    const [profile] = await db
      .select({ age: patientProfiles.age })
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientId));

    const age = profile?.age || 30;

    // Patient age retrieved

    // Calculate urgency score
    const urgencyScore = calculateUrgencyScore(
      triageSession.symptoms,
      triageSession.medicalHistory,
      age,
    );
    const urgencyLevel = getUrgencyLevel(urgencyScore);

    // Urgency score calculated

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
    const [triageResponse] = await db
      .insert(triageResponses)
      .values({
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
      })
      .returning();

    // Prepare triage session update
    const updateData = {
      urgencyScore,
      urgencyLevel,
      recommendedSpecialty: recommendedSpecialties[0],
      summaryTitle: `${urgencyLevel.toUpperCase()}: ${triageSession.symptoms[0].symptom}`,
      summaryDescription: preliminaryAssessment,
      status: "completed",
      updatedAt: new Date(),
    };

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
            updateData.assignedDoctorId = matchedDoctor.doctorId;
            updateData.status = "assigned_doctor";

            const [updatedSession] = await db
              .update(triageSessions)
              .set(updateData)
              .where(eq(triageSessions.id, triageSessionId))
              .returning();

            return res.status(200).json({
              message:
                "Triage completed. Doctor auto-matched due to high urgency!",
              triageResponse,
              autoMatchedConsultation: {
                consultationId: consultation.id,
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

    const [updatedSession] = await db
      .update(triageSessions)
      .set(updateData)
      .where(eq(triageSessions.id, triageSessionId))
      .returning();

    res.status(200).json({
      message: "Triage processed successfully",
      triageResponse,
      triageSession: updatedSession,
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
    // getTriageHistory invoked
    const patientId = req.user?.userId; // adjust to match your auth middleware (e.g. req.user.id)

    if (!patientId) {
      console.error("❌ No patientId found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Aliases so we can join "users" and "doctor_profiles" for the assigned doctor
    const assignedDoctorUser = alias(users, "assigned_doctor_user");
    const assignedDoctorProfile = alias(
      doctorProfiles,
      "assigned_doctor_profile",
    );

    // Get all triage sessions for patient, showing only summary
    const rows = await db
      .select({
        id: triageSessions.id,
        summaryTitle: triageSessions.summaryTitle,
        summaryDescription: triageSessions.summaryDescription,
        urgencyScore: triageSessions.urgencyScore,
        urgencyLevel: triageSessions.urgencyLevel,
        recommendedSpecialty: triageSessions.recommendedSpecialty,
        createdAt: triageSessions.createdAt,
        status: triageSessions.status,
        assignedDoctorId: triageSessions.assignedDoctorId,
        assignedDoctorName: assignedDoctorUser.name,
        assignedDoctorSpecialization: assignedDoctorProfile.specialization,
      })
      .from(triageSessions)
      .leftJoin(
        assignedDoctorUser,
        eq(assignedDoctorUser.id, triageSessions.assignedDoctorId),
      )
      .leftJoin(
        assignedDoctorProfile,
        eq(assignedDoctorProfile.userId, triageSessions.assignedDoctorId),
      )
      .where(eq(triageSessions.patientId, patientId))
      .orderBy(desc(triageSessions.createdAt))
      .limit(10); // Get last 10 sessions

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

    // Triage history prepared

    res.status(200).json({
      message: "Triage history retrieved",
      triageHistory,
    });
  } catch (error) {
    console.error("❌ Error getting triage history:", error.message);
    res.status(500).json({
      message: "Error retrieving triage history",
      error: error.message,
    });
  }
};

// Get specific triage session details
export const getTriageSessionDetails = async (req, res) => {
  try {
    // getTriageSessionDetails invoked
    const { triageSessionId } = req.params;
    const patientId = req.user?.userId; // adjust to match your auth middleware (e.g. req.user.id)

    // Fetching triage session details

    // Get triage session
    const [triageSession] = await db
      .select()
      .from(triageSessions)
      .where(eq(triageSessions.id, triageSessionId));

    if (!triageSession) {
      console.warn("⚠️ Triage session not found");
      return res.status(404).json({ message: "Triage session not found" });
    }

    // Verify ownership
    if (triageSession.patientId !== patientId) {
      console.error("❌ Unauthorized access");
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Equivalent of the old .populate("aiResponse") — the response now lives
    // in its own table, keyed by triageSessionId.
    const [aiResponse] = await db
      .select()
      .from(triageResponses)
      .where(eq(triageResponses.triageSessionId, triageSessionId));

    // Equivalent of the old .populate("assignedDoctor", "fullName specialization rating yearsOfExperience")
    let assignedDoctor = null;
    if (triageSession.assignedDoctorId) {
      const [doctorRow] = await db
        .select({
          id: users.id,
          fullName: users.name,
          specialization: doctorProfiles.specialization,
          experience: doctorProfiles.experience,
        })
        .from(users)
        .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
        .where(eq(users.id, triageSession.assignedDoctorId));

      // Note: "rating" does not exist on doctor_profiles in the current schema,
      // so it isn't included here. "experience" is exposed as yearsOfExperience
      // to keep the response shape close to the original.
      assignedDoctor = doctorRow
        ? {
            _id: doctorRow.id,
            fullName: doctorRow.fullName,
            specialization: doctorRow.specialization,
            yearsOfExperience: doctorRow.experience,
          }
        : null;
    }

    // Returning triage session details
    res.status(200).json({
      message: "Triage session details",
      triageSession: {
        ...triageSession,
        aiResponse: aiResponse || null,
        assignedDoctor,
      },
    });
  } catch (error) {
    console.error("❌ Error getting triage session details:", error.message);
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
