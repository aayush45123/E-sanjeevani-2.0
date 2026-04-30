import DoctorProfile from "../models/DoctorProfile.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import User from "../models/User.js";

const SLOT_DURATION_MINUTES = 30;
const AVAILABILITY_LOOKAHEAD_DAYS = 30;

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

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

const syncDoctorAvailability = async (doctorId, profileData) => {
  const workingDays = Array.isArray(profileData.workingDays)
    ? profileData.workingDays
    : [];

  if (!workingDays.length || !profileData.startTime || !profileData.endTime) {
    return;
  }

  const slots = buildSlots(profileData.startTime, profileData.endTime);

  if (!slots.length) {
    return;
  }

  const today = getDateOnly(new Date());

  for (
    let dayOffset = 0;
    dayOffset < AVAILABILITY_LOOKAHEAD_DAYS;
    dayOffset += 1
  ) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    if (!workingDays.includes(getDayName(date))) {
      continue;
    }

    const dateOnly = getDateOnly(date);
    const nextDate = new Date(dateOnly);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingAvailability = await DoctorAvailability.findOne({
      doctor: doctorId,
      availableDate: {
        $gte: dateOnly,
        $lt: nextDate,
      },
    });

    const availabilityData = {
      doctor: doctorId,
      availableDate: dateOnly,
      slots,
      isActive: true,
    };

    if (existingAvailability) {
      existingAvailability.availableDate = dateOnly;
      existingAvailability.slots = slots;
      existingAvailability.isActive = true;
      await existingAvailability.save();
    } else {
      await DoctorAvailability.create(availabilityData);
    }
  }
};

/*
==================================================
CREATE OR UPDATE DOCTOR PROFILE
==================================================
*/

export const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const {
      phone,
      gender,
      dateOfBirth,
      specialization,
      superSpecialization,
      qualification,
      medicalRegistrationNumber,
      experience,
      hospitalName,
      consultationFee,
      languagesSpoken,
      workingDays,
      startTime,
      endTime,
      consultationModes,
      aboutDoctor,
      shortBio,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create profile",
      });
    }

    let profile = await DoctorProfile.findOne({
      userId: req.user.id,
    });

    const profileData = {
      userId: req.user.id,
      phone,
      gender,
      dateOfBirth,
      specialization,
      superSpecialization,
      qualification,
      medicalRegistrationNumber,
      experience,
      hospitalName,
      consultationFee,
      languagesSpoken,
      workingDays,
      startTime,
      endTime,
      consultationModes,
      aboutDoctor,
      shortBio,
      profileCompleted: true,
    };

    if (profile) {
      profile = await DoctorProfile.findOneAndUpdate(
        { userId: req.user.id },
        profileData,
        { new: true },
      );
    } else {
      profile = await DoctorProfile.create(profileData);
    }

    await syncDoctorAvailability(req.user.id, profileData);

    res.status(200).json({
      success: true,
      message: "Doctor profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("Doctor profile save error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save doctor profile",
      error: error.message,
    });
  }
};

/*
==================================================
GET LOGGED-IN DOCTOR PROFILE
==================================================
*/

export const getDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      userId: req.user.id,
    }).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Fetch doctor profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message,
    });
  }
};

/*
==================================================
CHECK PROFILE STATUS
==================================================
*/

export const checkDoctorProfileStatus = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      profileCompleted: !!profile?.profileCompleted,
      profile,
    });
  } catch (error) {
    console.error("Check profile status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to check profile status",
      error: error.message,
    });
  }
};
