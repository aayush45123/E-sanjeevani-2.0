import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  users,
  patientProfiles,
  consultations,
  prescriptions,
  prescriptionItems,
  medicalRecords,
  medicalRecordAttachments,
  triageSessions,
} from "../database/schema/index.js";

export class PatientHistoryService {
  /**
   * Verify that the requesting doctor has at least one consultation
   * with the patient. Returns false if no relationship exists.
   */
  static async verifyDoctorPatientRelationship(doctorId, patientId) {
    const [row] = await db
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.patientId, patientId)
        )
      )
      .limit(1);
    return !!row;
  }

  /**
   * Full longitudinal patient history.
   * @param {string} patientId
   * @param {string|null} doctorId  – if provided, adds doctor-specific stats
   */
  static async getPatientHistory(patientId, doctorId = null) {
    // ── 1. Patient demographics ────────────────────────────────────────────
    const [patientUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1);

    if (!patientUser) throw { status: 404, message: "Patient not found" };

    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientId))
      .limit(1);

    const patientProfile = profile || {};

    // ── 2. All consultations ───────────────────────────────────────────────
    const allConsultations = await db
      .select({ consultation: consultations, doctorName: users.name })
      .from(consultations)
      .leftJoin(users, eq(consultations.doctorId, users.id))
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate));

    // ── 3. All prescriptions (first-class entity) ─────────────────────────
    const allPrescriptions = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));

    // Hydrate each prescription with its items
    const hydratedPrescriptions = await Promise.all(
      allPrescriptions.map(async (rx) => {
        const items = await db
          .select()
          .from(prescriptionItems)
          .where(eq(prescriptionItems.prescriptionId, rx.id));

        const now = new Date();
        const itemsWithStatus = items.map((item) => {
          let currentStatus = item.status;
          if (item.status === "active" && item.endDate && new Date(item.endDate) < now) {
            currentStatus = "completed";
          }
          return { ...item, currentStatus };
        });

        return { ...rx, items: itemsWithStatus };
      })
    );

    // ── 4. Supporting documents (patient uploads, lab reports etc.) ────────
    const allDocuments = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordDate));

    const hydratedDocuments = await Promise.all(
      allDocuments.map(async (rec) => {
        const attachments = await db
          .select()
          .from(medicalRecordAttachments)
          .where(eq(medicalRecordAttachments.medicalRecordId, rec.id));
        return { ...rec, attachments };
      })
    );

    // ── 5. Build consultation objects linked to prescriptions ──────────────
    const previousConsultations = allConsultations.map(({ consultation, doctorName }) => {
      const linkedPrescription = hydratedPrescriptions.find(
        (rx) => rx.consultationId === consultation.id && rx.status === "finalized"
      );
      return {
        id: consultation.id,
        consultationDate: consultation.consultationDate,
        doctorName: doctorName ? `Dr. ${doctorName}` : "Doctor",
        doctorId: consultation.doctorId,
        consultationType: consultation.consultationType,
        symptoms: consultation.symptoms,
        currentProblem: consultation.currentProblem,
        status: consultation.status,
        diagnosis: linkedPrescription?.diagnosis || "",
        treatment: linkedPrescription
          ? { advice: linkedPrescription.advice, medicines: linkedPrescription.items }
          : null,
        followUp: linkedPrescription?.followUpRequired
          ? `Follow-up in ${linkedPrescription.followUpDays || "?"} days`
          : null,
        prescription: linkedPrescription || null,
      };
    });

    // ── 6. Doctor-specific stats (if doctorId is provided) ────────────────
    let doctorStats = null;
    if (doctorId) {
      const docConsultations = allConsultations.filter(
        (c) => c.consultation.doctorId === doctorId
      );
      const docPrescriptions = hydratedPrescriptions.filter(
        (rx) => rx.doctorId === doctorId
      );
      doctorStats = {
        consultationCount: docConsultations.length,
        prescriptionCount: docPrescriptions.length,
        lastConsultationDate: docConsultations[0]?.consultation.consultationDate || null,
      };
    }

    // ── 7. Patient overview ────────────────────────────────────────────────
    const patientOverview = {
      patientId: patientUser.id,
      name: patientUser.name,
      email: patientUser.email,
      phone: patientUser.phoneNumber,
      gender: patientProfile.gender || "Not specified",
      age: patientProfile.dateOfBirth
        ? _calculateAge(patientProfile.dateOfBirth)
        : patientProfile.age || "N/A",
      bloodGroup: patientProfile.bloodGroup || "Not specified",
      knownAllergies: patientProfile.allergies || "None reported",
      existingConditions: patientProfile.medicalHistory || "None reported",
      currentMedications: patientProfile.currentMedication || "None reported",
      totalConsultations: allConsultations.length,
      totalPrescriptions: hydratedPrescriptions.length,
      lastConsultationDate: allConsultations[0]?.consultation.consultationDate || null,
      doctorStats,
    };

    // ── 8. Build timeline ──────────────────────────────────────────────────
    const timeline = _buildTimeline(previousConsultations, hydratedPrescriptions, hydratedDocuments);

    return {
      patientOverview,
      previousConsultations,
      prescriptions: hydratedPrescriptions,
      documents: hydratedDocuments,
      timeline,
    };
  }

  /**
   * Factual clinical analytics — counts and frequencies only.
   * No AI-generated clinical conclusions.
   */
  static async getPatientAnalytics(patientId, doctorId = null) {
    const history = await this.getPatientHistory(patientId, doctorId);
    const { previousConsultations, prescriptions: rxList } = history;

    const now = new Date();
    const ago = (days) => new Date(now.getTime() - days * 86400_000);

    // ── Consultation frequency ─────────────────────────────────────────────
    const totalConsultations = previousConsultations.length;
    const consultationsLast30 = previousConsultations.filter(
      (c) => new Date(c.consultationDate) >= ago(30)
    ).length;
    const consultationsLast90 = previousConsultations.filter(
      (c) => new Date(c.consultationDate) >= ago(90)
    ).length;
    const consultationsLast365 = previousConsultations.filter(
      (c) => new Date(c.consultationDate) >= ago(365)
    ).length;

    // Doctor distribution
    const doctorCounts = {};
    previousConsultations.forEach((c) => {
      doctorCounts[c.doctorName] = (doctorCounts[c.doctorName] || 0) + 1;
    });

    // Consultation type distribution
    const typeDistribution = {};
    previousConsultations.forEach((c) => {
      if (c.consultationType) {
        typeDistribution[c.consultationType] = (typeDistribution[c.consultationType] || 0) + 1;
      }
    });

    // ── Diagnosis frequency (factual: "appears N times in records") ────────
    const diagnosisCounts = {};
    rxList.forEach((rx) => {
      if (rx.diagnosis?.trim()) {
        const d = rx.diagnosis.trim();
        diagnosisCounts[d] = (diagnosisCounts[d] || 0) + 1;
      }
    });

    // Factual label: "Viral fever appears in 2 previous consultation records"
    const frequentDiagnoses = Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
        note: `"${diagnosis}" appears in ${count} previous consultation record${count > 1 ? "s" : ""}`,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Symptom keyword frequencies ───────────────────────────────────────
    const SYMPTOM_KEYWORDS = [
      "Fever", "Cough", "Headache", "Fatigue", "Sore throat",
      "Body pain", "Shortness of breath", "Nausea", "Vomiting", "Cold",
      "Diarrhoea", "Diarrhea", "Chest pain", "Back pain",
    ];
    const symptomCounts = {};
    previousConsultations.forEach((c) => {
      const text = `${c.symptoms || ""} ${c.currentProblem || ""}`.toLowerCase();
      SYMPTOM_KEYWORDS.forEach((sym) => {
        if (text.includes(sym.toLowerCase())) {
          symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
        }
      });
    });
    const symptomAnalytics = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({
        symptom,
        count,
        note: `${symptom} reported in ${count} consultation${count > 1 ? "s" : ""}`,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Medicine / prescription analytics ─────────────────────────────────
    const medicineCounts = {};
    const activeMedications = [];
    const completedMedications = [];
    const discontinuedMedications = [];

    rxList.forEach((rx) => {
      (rx.items || []).forEach((item) => {
        const name = item.medicineName?.trim();
        if (!name) return;
        medicineCounts[name] = (medicineCounts[name] || 0) + 1;

        const entry = {
          id: item.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          route: item.route || "Oral",
          instructions: item.instructions,
          startDate: item.startDate,
          endDate: item.endDate,
          prescribedBy: rx.doctorId,
          prescriptionId: rx.id,
        };

        const status = item.currentStatus || item.status;
        if (status === "discontinued") discontinuedMedications.push(entry);
        else if (status === "completed") completedMedications.push(entry);
        else activeMedications.push(entry);
      });
    });

    const topMedicines = Object.entries(medicineCounts)
      .map(([medicine, count]) => ({
        medicine,
        count,
        note: `${medicine} prescribed ${count} time${count > 1 ? "s" : ""}`,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        totalConsultations,
        consultationsLast30,
        consultationsLast90,
        consultationsLast365,
        totalPrescriptionsIssued: rxList.length,
        activeMedicationCount: activeMedications.length,
        mostRecentConsultation: previousConsultations[0]?.consultationDate || null,
        lastDiagnosis: rxList[0]?.diagnosis || null,
      },
      consultationAnalytics: {
        doctorCounts,
        typeDistribution,
      },
      diseaseAnalytics: {
        frequentDiagnoses,
        totalUniqueConditions: Object.keys(diagnosisCounts).length,
        note: "Counts are factual records from consultation history. Clinical interpretation is the doctor's responsibility.",
      },
      symptomAnalytics,
      prescriptionAnalytics: {
        topMedicines,
        activeMedications,
        completedMedications,
        discontinuedMedications,
      },
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

function _buildTimeline(consultations, prescriptions, documents) {
  const events = [];

  consultations.forEach((c) => {
    events.push({
      id: `consultation-${c.id}`,
      type: "consultation",
      title: `Consultation with ${c.doctorName}`,
      date: c.consultationDate,
      details: {
        symptoms: c.symptoms,
        currentProblem: c.currentProblem,
        status: c.status,
        diagnosis: c.diagnosis || null,
        followUp: c.followUp || null,
      },
    });
  });

  prescriptions.forEach((rx) => {
    if (rx.status === "finalized") {
      events.push({
        id: `prescription-${rx.id}`,
        type: "prescription",
        title: rx.diagnosis
          ? `Prescription — ${rx.diagnosis}`
          : "Digital Prescription Issued",
        date: rx.createdAt,
        details: {
          diagnosis: rx.diagnosis,
          medicineCount: rx.items?.length || 0,
          pdfUrl: rx.pdfUrl || null,
          referralInfo: rx.referralInfo || null,
        },
      });
    }
  });

  documents
    .filter((d) => d.source === "patient_upload")
    .forEach((d) => {
      events.push({
        id: `document-${d.id}`,
        type: "document_upload",
        title: `Document: ${d.recordTitle || d.recordType}`,
        date: d.recordDate,
        details: {
          recordType: d.recordType,
          description: d.description,
          attachmentCount: d.attachments?.length || 0,
        },
      });
    });

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by Month-Year
  const grouped = {};
  events.forEach((evt) => {
    const label = new Date(evt.date)
      .toLocaleDateString("en-US", { month: "short", year: "numeric" })
      .toUpperCase();
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(evt);
  });

  return Object.entries(grouped).map(([period, items]) => ({ period, events: items }));
}
