import DoctorAvailability from "../models/DoctorAvailability.js";
import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

const SLOT_DURATION_MINUTES = 30;

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

const getFallbackSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile || !Array.isArray(profile.workingDays)) return [];
  if (!profile.workingDays.includes(getDayName(date))) return [];
  return buildSlots(profile.startTime, profile.endTime);
};

/*
==================================================
CREATE DOCTOR AVAILABILITY
Doctor sets available slots for a specific day
==================================================
*/

export const createDoctorAvailability = async (req, res) => {
  try {
    const { availableDate, slots } = req.body;

    /*
    Example Body:

    {
      "availableDate": "2026-05-01",
      "slots": [
        {
          "startTime": "10:00",
          "endTime": "10:30"
        },
        {
          "startTime": "10:30",
          "endTime": "11:00"
        }
      ]
    }
    */

    /*
    ==========================================
    VALIDATE ROLE
    ==========================================
    */

    const doctor = await User.findById(req.user.id);

    // In createDoctorAvailability, replace the role check:

    // ✅ FIX: case-insensitive role check for DB-inserted doctors
    if (!doctor || doctor.role.toLowerCase() !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create availability",
      });
    }

    /*
    ==========================================
    BASIC VALIDATION
    ==========================================
    */

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

    /*
    ==========================================
    CHECK EXISTING ENTRY
    ==========================================
    */

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
    ==========================================
    UPDATE EXISTING DATE
    ==========================================
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

      return res.json({
        success: true,
        message: "Availability updated successfully",
        availability,
      });
    }

    /*
    ==========================================
    CREATE NEW ENTRY
    ==========================================
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
    });

    await availability.save();

    res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    console.error("createDoctorAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create doctor availability",
      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTOR OWN AVAILABILITY
Doctor dashboard
==================================================
*/

export const getDoctorOwnAvailability = async (req, res) => {
  try {
    const availability = await DoctorAvailability.find({
      doctor: req.user.id,
      isActive: true,
    }).sort({
      availableDate: 1,
    });

    res.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("getDoctorOwnAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability",
      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTOR AVAILABILITY SLOTS
Patient fetches available slots for a doctor on a specific date
Falls back to doctor's working schedule if no explicit availability is set
==================================================
*/

export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    // Normalize the date properly (handle timezone issues)
    // Date comes as ISO string like "2026-05-01"
    const dateOnly = getDateOnly(new Date(date));
    const nextDate = new Date(dateOnly);
    nextDate.setDate(nextDate.getDate() + 1);

    // Find availability for the specific date
    let availability = await DoctorAvailability.findOne({
      doctor: doctorId,
      availableDate: {
        $gte: dateOnly,
        $lt: nextDate,
      },
      isActive: true,
    });

    // If no explicit availability, check if date matches doctor's working days
    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, dateOnly);
      if (!fallbackSlots.length) {
        return res.json({
          success: true,
          slots: [],
        });
      }
      // Create availability from working schedule
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: dateOnly,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    // Filter out booked slots and return only available ones
    const availableSlots = availability.slots.filter((slot) => !slot.isBooked);

    res.json({
      success: true,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("getDoctorAvailabilitySlots error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
      error: error.message,
    });
  }
};

/*
==================================================
DELETE SINGLE DAY AVAILABILITY
Optional professional feature
==================================================
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

    res.json({
      success: true,
      message: "Availability removed successfully",
    });
  } catch (error) {
    console.error("deleteDoctorAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete availability",
      error: error.message,
    });
  }
};
