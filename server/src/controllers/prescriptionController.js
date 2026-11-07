import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrescriptionLifecycleService } from "../services/prescriptionLifecycle.service.js";
import { PrescriptionRepository } from "../repositories/prescription.repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    if (role === "doctor") {
      const hasRelationship = await PrescriptionRepository.verifyDoctorPatientRelationship(
        requesterId,
        patientId
      );
      if (!hasRelationship) {
        return res.status(403).json({
          success: false,
          message: "Access denied — no clinical relationship found with this patient",
        });
      }
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

// ─── AUTHENTICATED PRESCRIPTION PDF STREAMING ─────────────────────────────────

export const streamPrescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: requesterId, role } = req.user;

    const rx = await PrescriptionRepository.findById(id);
    if (!rx) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    // Role-based access control
    let isAuthorized = false;
    if (role === "admin") {
      isAuthorized = true;
    } else if (role === "patient" && rx.patientId === requesterId) {
      isAuthorized = true;
    } else if (role === "doctor") {
      if (rx.doctorId === requesterId) {
        isAuthorized = true;
      } else {
        const hasRelationship = await PrescriptionRepository.verifyDoctorPatientRelationship(
          requesterId,
          rx.patientId
        );
        if (hasRelationship) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied — you are not authorized to view this prescription PDF",
      });
    }

    // Resolve file path safely
    const uploadsDir = path.resolve(__dirname, "../../uploads/prescriptions");
    let targetFileName = `prescription-${id}.pdf`;
    if (rx.pdfUrl) {
      const parsed = path.basename(rx.pdfUrl);
      if (parsed) targetFileName = parsed;
    }

    const safeFilePath = path.resolve(uploadsDir, targetFileName);

    // Prevent directory traversal attacks
    if (!safeFilePath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: "Invalid file path request" });
    }

    if (!fs.existsSync(safeFilePath)) {
      return res.status(404).json({
        success: false,
        message: "Prescription PDF file not found on server",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="prescription-${id}.pdf"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const readStream = fs.createReadStream(safeFilePath);
    readStream.on("error", (err) => {
      console.error("Error streaming prescription PDF:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error reading prescription file" });
      }
    });
    readStream.pipe(res);
  } catch (error) {
    console.error("streamPrescriptionPdf error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to stream prescription PDF",
    });
  }
};
