import { ConsultationRepository } from "../repositories/consultation.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import { AiTriageRepository } from "../repositories/aiTriage.repository.js";
import { PatientHistoryService } from "./patientHistory.service.js";
import { OpenAI } from "openai";

export class DoctorAssistantService {
  static async getDoctorAssistantData(consultationId) {
    const consultation = await ConsultationRepository.findById(consultationId);

    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    const patientInfo = await UserRepository.findById(consultation.patientId);
    let patientBasicInfo = null;
    if (patientInfo) {
      patientBasicInfo = {
        id: patientInfo.id,
        name: patientInfo.name,
        email: patientInfo.email,
        phone: patientInfo.phone,
        profileImage: patientInfo.profileImage,
        role: patientInfo.role,
        isVerified: patientInfo.isVerified,
        isActive: patientInfo.isActive,
        createdAt: patientInfo.createdAt,
        updatedAt: patientInfo.updatedAt,
      };
    }

    const doctorInfo = await UserRepository.findById(consultation.doctorId);
    let doctorBasicInfo = null;
    if (doctorInfo) {
      doctorBasicInfo = {
        id: doctorInfo.id,
        name: doctorInfo.name,
        email: doctorInfo.email,
        phone: doctorInfo.phone,
        profileImage: doctorInfo.profileImage,
        role: doctorInfo.role,
        isVerified: doctorInfo.isVerified,
        isActive: doctorInfo.isActive,
        createdAt: doctorInfo.createdAt,
        updatedAt: doctorInfo.updatedAt,
      };
    }

    const patientProfile = await PatientProfileRepository.findByUserId(consultation.patientId);
    const latestAITriage = await AiTriageRepository.findLatestByUserId(consultation.patientId);

    // Full longitudinal medical history including previous visits with this doctor,
    // all past prescriptions, and uploaded medical records/documents
    let patientHistory = null;
    try {
      patientHistory = await PatientHistoryService.getPatientHistory(
        consultation.patientId,
        consultation.doctorId,
      );
    } catch (histErr) {
      console.warn("Could not load full patient history for assistant:", histErr);
    }

    return {
      patientBasicInfo,
      consultationDetails: {
        ...consultation,
        patient: patientBasicInfo,
        doctor: doctorBasicInfo,
      },
      patientProfile,
      latestAITriage,
      patientHistory,
    };
  }

  static async chatWithDoctorAssistant(doctorId, consultationId, query, conversationHistory = []) {
    if (!consultationId || !query?.trim()) {
      throw { status: 400, message: "Consultation ID and query are required" };
    }

    const data = await this.getDoctorAssistantData(consultationId);

    // Verify requesting doctor
    if (data.consultationDetails.doctorId !== doctorId) {
      throw { status: 403, message: "Unauthorized access to this consultation assistant" };
    }

    const patientName = data.patientBasicInfo?.name || "Patient";
    const doctorName = data.consultationDetails?.doctor?.name || "Doctor";
    const profile = data.patientProfile || {};
    const consultation = data.consultationDetails || {};
    const triage = data.latestAITriage || {};
    const history = data.patientHistory || {};

    // 1. Visit History with this Doctor specifically
    const docStats = history.patientOverview?.doctorStats;
    const hasVisitedThisDocBefore = docStats && docStats.consultationCount > 1;
    const priorVisitsWithThisDoctor = (history.previousConsultations || [])
      .filter((c) => c.doctorId === doctorId && c.id !== consultationId);

    const docVisitHistoryText = priorVisitsWithThisDoctor.length > 0
      ? priorVisitsWithThisDoctor.map((c, i) =>
          `  - Visit ${i + 1} on ${c.consultationDate}: Symptoms: "${c.symptoms || "N/A"}", Diagnosis: "${c.diagnosis || "N/A"}", Follow-up: "${c.followUp || "None"}"`
        ).join("\n")
      : "  - This is the first recorded consultation between this patient and Dr. " + doctorName;

    // 2. All past prescriptions
    const prescriptionsText = (history.prescriptions || []).length > 0
      ? history.prescriptions.map((rx, i) => {
          const medList = (rx.items || [])
            .map((m) => `${m.medicineName} (${m.dosage}, ${m.frequency}, ${m.duration})`)
            .join("; ");
          return `  - Rx #${i + 1} (${rx.createdAt?.toISOString?.()?.slice(0, 10) || "Past"} by Dr. ${rx.doctorName || "Doctor"}): Diagnosis: ${rx.diagnosis || "N/A"}. Medicines: [${medList}]. Advice: ${rx.advice || "None"}`;
        }).join("\n")
      : "  - No prior prescriptions recorded in the system.";

    // 3. Uploaded medical documents / lab reports
    const docsText = (history.documents || []).length > 0
      ? history.documents.map((d, i) =>
          `  - Document #${i + 1} (${d.recordDate || "Date N/A"}): [${d.recordType || "Medical Record"}] ${d.recordTitle || d.description || "Uploaded by patient"}`
        ).join("\n")
      : "  - No external lab reports/documents uploaded.";

    // 4. Clinical profile details
    const clinicalDossier = `
=========================================
PATIENT CLINICAL DOSSIER
=========================================
Patient Name: ${patientName}
Age: ${profile.age || "N/A"}
Gender: ${profile.gender || "N/A"}
Blood Group: ${profile.bloodGroup || "N/A"}
Blood Pressure: ${profile.bloodPressure || "Not measured"}
Height: ${profile.height ? `${profile.height} cm` : "N/A"} | Weight: ${profile.weight ? `${profile.weight} kg` : "N/A"}
Smoking: ${profile.smoking || "N/A"} | Alcohol: ${profile.alcohol || "N/A"} | Diet: ${profile.diet || "N/A"} | Exercise: ${profile.exercise || "N/A"}

CHRONIC CONDITIONS:
${profile.chronicConditions || "None recorded"}

PAST SURGERIES / PROCEDURES:
${profile.pastSurgeries || "None recorded"}

KNOWN ALLERGIES:
${profile.allergies || "None reported"}

CURRENT REGULAR MEDICATIONS:
${profile.currentMedications || "None recorded"}

RELATIONSHIP WITH DR. ${doctorName.toUpperCase()}:
${docVisitHistoryText}

ALL PAST PRESCRIPTIONS ISSUED TO PATIENT:
${prescriptionsText}

SUPPORTING MEDICAL RECORDS & LAB TESTS:
${docsText}

CURRENT CONSULTATION (LIVE NOW):
Consultation ID: ${consultationId}
Consultation Type: ${consultation.consultationType || "video"}
Presenting Complaints / Symptoms: ${consultation.symptoms || consultation.problemDescription || "Routine consultation"}
Patient Problem Description: ${consultation.problemDescription || "None recorded"}
AI Triage Evaluation: Predicted Condition "${triage.predictedDisease || "N/A"}", Urgency: "${triage.urgency || "Normal"}", Recommended Specialty: "${triage.doctorType || "General Physician"}"
=========================================
`;

    const systemPrompt = `You are a world-class Clinical Decision Support System (CDSS) AI Assistant for Dr. ${doctorName}.
You are assisting Dr. ${doctorName} during an ongoing live telemedicine consultation with patient ${patientName}.

${clinicalDossier}

GUIDELINES FOR YOUR RESPONSE:
1. You are speaking doctor-to-doctor. Use professional clinical medical terminology.
2. Be direct, concise, and clinically actionable.
3. Fully consider the patient's complete history above:
   - Check if this patient has visited Dr. ${doctorName} before and their past diagnoses.
   - Cross-check all medicines against patient's KNOWN ALLERGIES (${profile.allergies || "None reported"}) and CHRONIC CONDITIONS (${profile.chronicConditions || "None recorded"}).
   - Note any drug-drug interactions with CURRENT MEDICATIONS (${profile.currentMedications || "None"}).
   - Reference previous prescriptions issued if relevant.
4. Structure your response with clear clinical headings:
   - **Clinical Impression / Differential Diagnosis**
   - **Recommended Management & Pharmacotherapy** (including precise dosages, route, and frequency)
   - **Investigations & Labs to Order**
   - **Patient Monitoring & Red Flags**`;

    // Try AI generation via HuggingFace or OpenAI
    let reply = "";
    if (process.env.HF_TOKEN) {
      try {
        const client = new OpenAI({
          baseURL: "https://router.huggingface.co/v1",
          apiKey: process.env.HF_TOKEN,
        });

        const messages = [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-6).map((m) => ({
            role: m.role === "doctor" ? "user" : m.role === "assistant" ? "assistant" : "user",
            content: m.content || m.text,
          })),
          { role: "user", content: query.trim() },
        ];

        const chatCompletion = await client.chat.completions.create({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages,
          temperature: 0.3,
          max_tokens: 1000,
        });

        reply = chatCompletion.choices[0]?.message?.content?.trim();
      } catch (llmErr) {
        console.warn("LLM API generation failed, generating smart clinical response:", llmErr.message);
      }
    }

    if (!reply) {
      // Deterministic clinical decision support fallback
      const qLower = query.toLowerCase();
      let focus = "";
      if (qLower.includes("rx") || qLower.includes("medicine") || qLower.includes("drug") || qLower.includes("prescrib")) {
        focus = "medication";
      } else if (qLower.includes("test") || qLower.includes("investigat") || qLower.includes("lab")) {
        focus = "tests";
      } else if (qLower.includes("hist") || qLower.includes("before") || qLower.includes("past")) {
        focus = "history";
      }

      reply = `### Clinical Assessment for Dr. ${doctorName}

**Patient:** ${patientName} (${profile.age || "Age not specified"}, ${profile.gender || "Gender not specified"})
**Relationship:** ${priorVisitsWithThisDoctor.length > 0 ? `Patient has consulted you ${priorVisitsWithThisDoctor.length} time(s) previously.` : "First visit with you."}

#### 1. Clinical Review & Relevant History
- **Presenting Complaint:** ${consultation.symptoms || consultation.problemDescription || "General medical consultation"}
- **Chronic Conditions:** ${profile.chronicConditions || "None recorded"}
- **Allergies:** ${profile.allergies || "None reported"}
- **Previous Prescriptions on File:** ${history.prescriptions?.length || 0} previous prescription(s) found.
${priorVisitsWithThisDoctor.length > 0 ? `- **Last Visit with You:** ${priorVisitsWithThisDoctor[0].consultationDate} (Diagnosis: ${priorVisitsWithThisDoctor[0].diagnosis || "General evaluation"})` : ""}

#### 2. Clinical Recommendations regarding: "${query}"
- **Differential Considerations:** ${triage.predictedDisease ? `${triage.predictedDisease} (triage severity: ${triage.urgency || "Moderate"})` : "Evaluation based on presenting symptoms and vital stability"}
- **Pharmacotherapy Consideration:** Ensure selection accounts for allergies (${profile.allergies || "None reported"}) and current medications (${profile.currentMedications || "None"}).
- **Suggested Investigations:** CBC, basic metabolic panel, and symptom-specific imaging or serology if indicated.
- **Precautionary Notes:** Verify follow-up compliance in 5–7 days or immediately if alarm symptoms develop.`;
    }

    return {
      reply,
      patientContext: {
        patientName,
        age: profile.age,
        gender: profile.gender,
        hasVisitedBefore: priorVisitsWithThisDoctor.length > 0,
        priorVisitCount: priorVisitsWithThisDoctor.length,
        prescriptionsCount: (history.prescriptions || []).length,
        documentsCount: (history.documents || []).length,
        chronicConditions: profile.chronicConditions,
        allergies: profile.allergies,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
