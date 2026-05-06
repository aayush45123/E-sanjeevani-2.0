// server/src/controllers/doctorAvailabilityController.js

import DoctorAvailability from "../models/DoctorAvailability.js";
import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import {
  isSameDay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
  getDay,
  isWeekend,
  getDate,
} from "date-fns";

/*
========================================================
HELPERS
========================================================
*/

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDayName = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
  });

const SLOT_DURATION_MINUTES = 30;

/*
========================================================
AUTO SLOT BUILDER (fallback from doctor profile)
========================================================
*/

const buildSlots = (startTime, endTime) => {
  const slots = [];

  if (!startTime || !endTime) {
    return slots;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const current = new Date(2000, 0, 1, startHour, startMinute, 0, 0);

  const end = new Date(2000, 0, 1, endHour, endMinute, 0, 0);

  while (current < end) {
    const next = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);

    if (next > end) {
      break;
    }

    const formatTime = (date) =>
      `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}`;

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

/*
========================================================
FALLBACK:
If exact availability not found,
generate slots from doctor profile working schedule
========================================================
*/

const getFallbackSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({
    userId: doctorId,
  });

  if (!profile) {
    return [];
  }

  if (!Array.isArray(profile.workingDays)) {
    return [];
  }

  const requestedDay = getDayName(date);

  if (!profile.workingDays.includes(requestedDay)) {
    return [];
  }

  return buildSlots(profile.startTime, profile.endTime);
};

/*
========================================================
CREATE / UPDATE DOCTOR AVAILABILITY
POST /api/doctor-availability
========================================================
*/

export const createDoctorAvailability = async (req, res) => {
  try {
    const { availableDate, slots } = req.body;

    const doctor = await User.findById(req.user.id);

    if (!doctor || doctor.role.toLowerCase() !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create availability",
      });
    }

    if (
      !availableDate ||
      !slots ||
      !Array.isArray(slots) ||
      slots.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "availableDate and slots are required",
      });
    }

    const selectedDate = getDateOnly(availableDate);

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let availability = await DoctorAvailability.findOne({
      doctor: req.user.id,
      availableDate: {
        $gte: selectedDate,
        $lt: nextDate,
      },
    });

    /*
    ========================================================
    UPDATE EXISTING DATE
    ========================================================
    */

    if (availability) {
      availability.slots = slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        bookedBy: null,
        consultationId: null,
      }));

      await availability.save();

      return res.status(200).json({
        success: true,
        message: "Availability updated successfully",
        availability,
      });
    }

    /*
    ========================================================
    CREATE NEW DATE
    ========================================================
    */

    availability = new DoctorAvailability({
      doctor: req.user.id,
      availableDate: selectedDate,
      slots: slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        bookedBy: null,
        consultationId: null,
      })),
      isActive: true,
    });

    await availability.save();

    return res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    console.error("createDoctorAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor availability",
      error: error.message,
    });
  }
};

/*
========================================================
GET DOCTOR OWN AVAILABILITY
GET /api/doctor-availability/my-slots
========================================================
*/

export const getDoctorOwnAvailability = async (req, res) => {
  try {
    const availability = await DoctorAvailability.find({
      doctor: req.user.id,
      isActive: true,
    }).sort({
      availableDate: 1,
    });

    return res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("getDoctorOwnAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability",
      error: error.message,
    });
  }
};

/*
========================================================
PATIENT FETCHES DOCTOR AVAILABLE SLOTS
GET /api/doctor-availability/slots/:doctorId?date=YYYY-MM-DD
========================================================

PROBLEM FIXED:
Earlier system was checking scheduleType / recurring
which was NOT stored in DB.

Now:
→ exact date match
→ return unbooked slots

Professional + production-ready logic
========================================================
*/

export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    /*
    ========================================================
    VALIDATION
    ========================================================
    */

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date query parameter are required",
      });
    }

    /*
    ========================================================
    NORMALIZE DATE
    Example:
    2026-05-04 → start of day
    ========================================================
    */

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    /*
    ========================================================
    FIND EXACT DATE AVAILABILITY
    ========================================================
    */

    let availability = await DoctorAvailability.findOne({
      doctor: doctorId,
      isActive: true,
      availableDate: {
        $gte: selectedDate,
        $lt: nextDate,
      },
    });

    /*
    ========================================================
    FALLBACK:
    If no manual availability exists,
    auto-generate from doctor profile working schedule
    AND SAVE IT TO DATABASE for consistency
    ========================================================
    */

    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, selectedDate);

      // If no fallback slots available, return empty
      if (!fallbackSlots || fallbackSlots.length === 0) {
        return res.status(200).json({
          success: true,
          slots: [],
          source: "doctor-profile-fallback",
        });
      }

      // Create and save the availability record for this date
      // This ensures bookings are tracked consistently in the database
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: selectedDate,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    /*
    ========================================================
    RETURN ONLY UNBOOKED SLOTS
    ========================================================
    */

    const availableSlots = availability.slots
      .filter((slot) => !slot.isBooked)
      .map((slot) => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

    return res.status(200).json({
      success: true,
      slots: availableSlots,
      source: availability.isNew
        ? "doctor-profile-fallback"
        : "manual-availability",
    });
  } catch (error) {
    console.error("getDoctorAvailabilitySlots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
      error: error.message,
    });
  }
};

/*
========================================================
SOFT DELETE AVAILABILITY
========================================================
*/

export const deleteDoctorAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;

    const availability = await DoctorAvailability.findById(availabilityId);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    if (availability.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    availability.isActive = false;

    await availability.save();

    return res.status(200).json({
      success: true,
      message: "Availability removed successfully",
    });
  } catch (error) {
    console.error("deleteDoctorAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete availability",
      error: error.message,
    });
  }
};
