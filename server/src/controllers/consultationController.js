import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import DoctorProfile from "../models/DoctorProfile.js";
import User from "../models/User.js";

const SLOT_DURATION_MINUTES = 30;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

const buildSlots = (startTime, endTime) => {
  const slots = [];
  if (!startTime || !endTime) return slots;

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const current = new Date(2000, 0, 1, startHour, startMinute, 0, 0);
  const end = new Date(2000, 0, 1, endHour, endMinute, 0, 0);

  const formatTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  while (current < end) {
    const next = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);
    if (next > end) break;

    slots.push({
      startTime: formatTime(current),
      endTime: formatTime(next),
      isBooked: false,
      bookedBy: null,
      consultationId: null,
    });

    current.setTime(next.getTime());
  }

  return slots;
};

const getFallbackSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile || !Array.isArray(profile.workingDays)) return [];
  if (!profile.workingDays.includes(getDayName(date))) return [];
  return buildSlots(profile.startTime, profile.endTime);
};

const findAvailabilityForDay = async (doctorId, dateOnly) => {
  const nextDate = new Date(dateOnly);
  nextDate.setDate(nextDate.getDate() + 1);

  return DoctorAvailability.findOne({
    doctor: doctorId,
    availableDate: { $gte: dateOnly, $lt: nextDate },
    isActive: true,
  });
};

// ─── Controllers ────────────────────────────────────────────────────────────

/*
==================================================
GET AVAILABLE DOCTORS
==================================================
*/
export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: { $regex: "^doctor$", $options: "i" } };
    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    const doctors = await User.find(query)
      .select(
        "name specialization qualification experience profileImage averageRating totalConsultations",
      )
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      doctors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
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

    // Basic validation
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

    // Validate doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Find or create availability with fallback to DoctorProfile
    const selectedDate = getDateOnly(consultationDate);
    let availability = await findAvailabilityForDay(doctorId, selectedDate);

    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, selectedDate);
      if (!fallbackSlots.length) {
        return res.status(400).json({
          success: false,
          message: "Doctor is not available on selected date",
        });
      }
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: selectedDate,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    // Check slot
    const selectedSlot = availability.slots.find(
      (slot) =>
        slot.startTime === startTime &&
        slot.endTime === endTime &&
        slot.isBooked === false,
    );

    if (!selectedSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is not available",
      });
    }

    // Create consultation
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

    // Mark slot as booked
    selectedSlot.isBooked = true;
    selectedSlot.bookedBy = req.user.id;
    selectedSlot.consultationId = consultation._id;
    await availability.save();

    await consultation.populate(
      "doctor",
      "name specialization qualification experience",
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

    const selectedDate = getDateOnly(date);
    let availability = await findAvailabilityForDay(doctorId, selectedDate);

    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, selectedDate);
      if (!fallbackSlots.length) {
        return res.json({ success: true, slots: [] });
      }
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: selectedDate,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    const availableSlots = availability.slots.filter(
      (slot) => slot.isBooked === false,
    );

    res.json({ success: true, slots: availableSlots });
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
    const consultations = await Consultation.find({ doctor: req.user.id })
      .populate("patient", "name email phone")
      .sort({ consultationDate: 1, startTime: 1 });

    res.json({ success: true, consultations });
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
    const consultations = await Consultation.find({ patient: req.user.id })
      .populate("doctor", "name specialization qualification experience")
      .sort({ consultationDate: -1 });

    res.json({ success: true, consultations });
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
Doctor can update: scheduled → ongoing → completed
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

    const consultation = await Consultation.findById(consultationId);
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
    const { doctorNotes, prescription, followUpRequired } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    consultation.doctorNotes = doctorNotes || "";
    consultation.prescription = prescription || "";
    consultation.followUpRequired = followUpRequired || false;

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
