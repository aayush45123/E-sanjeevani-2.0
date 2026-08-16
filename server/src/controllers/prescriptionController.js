import { PrescriptionLifecycleService } from "../services/prescriptionLifecycle.service.js";
import { PrescriptionRepository } from "../repositories/prescription.repository.js";

// ─── CREATE & ISSUE PRESCRIPTION ──────────────────────────────────────────────

export const createPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const {
      consultationId,
      diagnosis,
      items,
      advice,
      recommendedTests,
      referralInfo,
      followUpInstructions,
      followUpRequired,
      followUpDays,
      doctorNotes,
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({ success: false, message: "consultationId is required" });
    }
    if (!diagnosis?.trim()) {
      return res.status(400).json({ success: false, message: "Diagnosis is required" });
    }

    const prescription = await PrescriptionLifecycleService.issuePrescription({
      consultationId,
      doctorId,
      diagnosis,
      items: items || [],
      advice,
      recommendedTests,
      referralInfo,
      followUpInstructions,
      followUpRequired,
      followUpDays,
      doctorNotes,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription issued and finalized successfully",
      prescription,
    });
  } catch (error) {
    console.error("createPrescription error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create prescription",
    });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const rx = await PrescriptionRepository.findById(id);
    if (!rx) return res.status(404).json({ success: false, message: "Prescription not found" });

    // Access: patient owns it OR doctor who issued it
    if (role === "patient" && rx.patientId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (role === "doctor" && rx.doctorId !== userId) {
      // Doctor viewing another doctor's prescription — need consultation relationship
      const has = await PrescriptionRepository.verifyDoctorPatientRelationship(userId, rx.patientId);
      if (!has) return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, prescription: rx });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch prescription",
    });
  }
};

// ─── GET PATIENT'S OWN PRESCRIPTIONS ─────────────────────────────────────────

export const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: requesterId, role } = req.user;

    if (role === "patient" && requesterId !== patientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const rxList = await PrescriptionRepository.findByPatientId(patientId);

    return res.status(200).json({ success: true, count: rxList.length, prescriptions: rxList });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch prescriptions",
    });
  }
};

// ─── GET DOCTOR'S PRESCRIPTIONS FOR A PATIENT ────────────────────────────────

export const getDoctorPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: doctorId, role } = req.user;

    if (role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const rxList = await PrescriptionRepository.findByDoctorAndPatient(doctorId, patientId);

    return res.status(200).json({ success: true, count: rxList.length, prescriptions: rxList });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch prescriptions",
    });
  }
};

// ─── FINALIZE ────────────────────────────────────────────────────────────────

export const finalizePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const finalized = await PrescriptionLifecycleService.finalizePrescription(id, doctorId);

    return res.status(200).json({
      success: true,
      message: "Prescription finalized — record is now immutable",
      prescription: finalized,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to finalize prescription",
    });
  }
};

// ─── AMEND ───────────────────────────────────────────────────────────────────

export const amendPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const amendment = await PrescriptionLifecycleService.amendPrescription(
      id,
      doctorId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Prescription amendment created",
      amendment,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to amend prescription",
    });
  }
};

// ─── DISCONTINUE MEDICATION ───────────────────────────────────────────────────

export const discontinueMedication = async (req, res) => {
  try {
    const { id: prescriptionId, itemId } = req.params;
    const doctorId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const item = await PrescriptionLifecycleService.discontinueMedication(
      prescriptionId,
      itemId,
      doctorId
    );

    return res.status(200).json({
      success: true,
      message: "Medication discontinued",
      item,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to discontinue medication",
    });
  }
};
