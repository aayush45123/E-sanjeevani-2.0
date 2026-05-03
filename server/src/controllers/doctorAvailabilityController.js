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
  // 'isWeekday' is removed as it does not exist in date-fns v3
  getDate,
} from "date-fns";

// ... (The rest of the file up to the getDoctorAvailabilitySlots function is unchanged) ...

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

export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Expecting date in 'YYYY-MM-DD' format

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date query parameter are required",
      });
    }

    const requestedDate = startOfDay(parseISO(date));

    const allRules = await DoctorAvailability.find({
      doctor: doctorId,
      isActive: true,
      availableDate: { $lte: endOfDay(requestedDate) },
    }).sort({ createdAt: -1 });

    if (!allRules || allRules.length === 0) {
      return res.json({ success: true, slots: [] });
    }

    let applicableSlots = [];

    for (const rule of allRules) {
      let isDateMatch = false;
      const ruleStartDate = startOfDay(rule.availableDate);

      if (rule.scheduleType === "custom") {
        if (isSameDay(requestedDate, ruleStartDate)) {
          isDateMatch = true;
        }
      } else if (
        rule.scheduleType === "weekly" ||
        rule.scheduleType === "monthly"
      ) {
        const ruleEndDate = rule.endDate ? endOfDay(rule.endDate) : null;

        const isWithinRange =
          isAfter(requestedDate, ruleStartDate) ||
          isSameDay(requestedDate, ruleStartDate);
        const isBeforeEndDate = ruleEndDate
          ? isBefore(requestedDate, ruleEndDate) ||
            isSameDay(requestedDate, ruleEndDate)
          : true;

        if (isWithinRange && isBeforeEndDate) {
          if (rule.scheduleType === "weekly") {
            const requestedDayOfWeek = getDay(requestedDate);
            if (rule.recurring.daysOfWeek.includes(requestedDayOfWeek)) {
              isDateMatch = true;
            }
          } else if (rule.scheduleType === "monthly") {
            const dayFilter = rule.recurring.dayOfMonthFilter;
            const dayOfMonth = getDate(requestedDate);

            if (dayFilter === "all-days") {
              isDateMatch = true;
            } else if (dayFilter === "all-weekdays" && !isWeekend(requestedDate)) { // <-- THE FIX IS HERE
              isDateMatch = true;
            } else if (dayFilter === "all-weekends" && isWeekend(requestedDate)) {
              isDateMatch = true;
            } else if (
              dayFilter === "custom" &&
              rule.recurring.customDays.includes(dayOfMonth)
            ) {
              isDateMatch = true;
            }
          }
        }
      }

      if (isDateMatch) {
        const unbookedSlots = rule.slots.filter((slot) => !slot.isBooked);

        applicableSlots = unbookedSlots.map((slot) => ({
          _id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));

        break;
      }
    }

    res.json({
      success: true,
      slots: applicableSlots,
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
