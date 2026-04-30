import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import User from "../models/User.js";



export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findById(doctorId).select(
      "name specialization qualification experience profileImage averageRating totalConsultations bio",
    );

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get recent consultations for ratings/feedback
    const recentConsultations = await Consultation.find({
      doctor: doctorId,
      status: "completed",
      "rating.score": { $exists: true },
    })
      .select("rating createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        recentRatings: recentConsultations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message,
    });
  }
};


/*
==================================================
CREATE CONSULTATION
Patient books consultation after filling form
==================================================
*/

export const createConsultation = async (req, res) => {
  try {
    const {
      doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
    } = req.body;

    /*
    ==========================================
    BASIC VALIDATION
    ==========================================
    */

    if (
      !doctorId ||
      !consultationType ||
      !symptoms ||
      !currentProblem ||
      !consultationDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    /*
    ==========================================
    VALIDATE DOCTOR
    ==========================================
    */

    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    /*
    ==========================================
    CHECK SLOT AVAILABILITY
    ==========================================
    */

    const selectedDate = new Date(consultationDate);

    const availability = await DoctorAvailability.findOne({
      doctor: doctorId,
      availableDate: selectedDate,
      isActive: true,
    });

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not available on selected date",
      });
    }

    const selectedSlot = availability.slots.find(
      (slot) =>
        slot.startTime === startTime &&
        slot.endTime === endTime &&
        slot.isBooked === false
    );

    if (!selectedSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is not available",
      });
    }

    /*
    ==========================================
    CREATE CONSULTATION
    ==========================================
    */

    const consultation = new Consultation({
      patient: req.user.id,
      doctor: doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
      status: "scheduled",
    });

    await consultation.save();

    /*
    ==========================================
    UPDATE SLOT AS BOOKED
    ==========================================
    */

    selectedSlot.isBooked = true;
    selectedSlot.bookedBy = req.user.id;
    selectedSlot.consultationId = consultation._id;

    await availability.save();

    await consultation.populate(
      "doctor",
      "name specialization qualification experience"
    );

    res.status(201).json({
      success: true,
      message: "Consultation booked successfully",
      consultation,
    });
  } catch (error) {
    console.error("createConsultation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create consultation",
      error: error.message,
    });
  }
};



/*
==================================================
GET DOCTOR AVAILABLE SLOTS
==================================================
*/

export const getDoctorAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const selectedDate = new Date(date);

    const availability = await DoctorAvailability.findOne({
      doctor: doctorId,
      availableDate: selectedDate,
      isActive: true,
    });

    if (!availability) {
      return res.json({
        success: true,
        slots: [],
      });
    }

    const availableSlots = availability.slots.filter(
      (slot) => slot.isBooked === false
    );

    res.json({
      success: true,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("getDoctorAvailableSlots error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
      error: error.message,
    });
  }
};



/*
==================================================
DOCTOR DASHBOARD CONSULTATIONS
==================================================
*/

export const getDoctorConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({
      doctor: req.user.id,
    })
      .populate("patient", "name email phone")
      .sort({
        consultationDate: 1,
        startTime: 1,
      });

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.error("getDoctorConsultations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor consultations",
      error: error.message,
    });
  }
};



/*
==================================================
PATIENT CONSULTATIONS
==================================================
*/

export const getPatientConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({
      patient: req.user.id,
    })
      .populate(
        "doctor",
        "name specialization qualification experience"
      )
      .sort({
        consultationDate: -1,
      });

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.error("getPatientConsultations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch patient consultations",
      error: error.message,
    });
  }
};



/*
==================================================
UPDATE CONSULTATION STATUS
Doctor can update:
scheduled → ongoing → completed
==================================================
*/

export const updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      "scheduled",
      "ongoing",
      "completed",
      "cancelled",
      "missed",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation status",
      });
    }

    const consultation = await Consultation.findById(
      consultationId
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    consultation.status = status;

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation status updated successfully",
      consultation,
    });
  } catch (error) {
    console.error("updateConsultationStatus error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update consultation status",
      error: error.message,
    });
  }
};



/*
==================================================
DOCTOR NOTES + PRESCRIPTION
==================================================
*/

export const addDoctorNotes = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const {
      doctorNotes,
      prescription,
      followUpRequired,
    } = req.body;

    const consultation = await Consultation.findById(
      consultationId
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    consultation.doctorNotes = doctorNotes || "";
    consultation.prescription = prescription || "";
    consultation.followUpRequired =
      followUpRequired || false;

    await consultation.save();

    res.json({
      success: true,
      message: "Doctor notes added successfully",
      consultation,
    });
  } catch (error) {
    console.error("addDoctorNotes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add doctor notes",
      error: error.message,
    });
  }
};