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

    if (existingAvailability) {
      existingAvailability.availableDate = dateOnly;
      existingAvailability.slots = slots;
      existingAvailability.isActive = true;
      await existingAvailability.save();
    } else {
      await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: dateOnly,
        slots,
        isActive: true,
      });
    }
  }
};

/*
==================================================
CREATE OR UPDATE DOCTOR PROFILE
✅ FIX 1: case-insensitive role check
✅ FIX 2: syncDoctorAvailability wrapped in try/catch (non-fatal)
✅ FIX 3: User.profileCompleted set to true after profile save
✅ FIX 4: uses findOneAndUpdate with upsert to avoid duplicate
          key errors on medicalRegistrationNumber unique index
✅ FIX 5: detailed validation error response so 500s are debuggable
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

    // ─── detailed request log to catch what's actually arriving ───
    console.log("createOrUpdateDoctorProfile body:", {
      phone,
      gender,
      dateOfBirth,
      specialization,
      qualification,
      medicalRegistrationNumber,
      experience,
      hospitalName,
      consultationFee,
      workingDays,
      startTime,
      endTime,
      consultationModes,
    });

    const user = await User.findById(req.user.id);

    // ✅ FIX 1: case-insensitive role check
    if (!user || user.role.toLowerCase() !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create profile",
      });
    }

    // ─── guard required fields before hitting Mongoose ────────────
    const missingFields = [];
    if (!phone) missingFields.push("phone");
    if (!gender) missingFields.push("gender");
    if (!dateOfBirth) missingFields.push("dateOfBirth");
    if (!specialization) missingFields.push("specialization");
    if (!qualification) missingFields.push("qualification");
    if (!medicalRegistrationNumber)
      missingFields.push("medicalRegistrationNumber");
    if (experience === undefined || experience === "")
      missingFields.push("experience");
    if (!hospitalName) missingFields.push("hospitalName");
    if (consultationFee === undefined || consultationFee === "")
      missingFields.push("consultationFee");
    if (!startTime) missingFields.push("startTime");
    if (!endTime) missingFields.push("endTime");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const profileData = {
      userId: req.user.id,
      phone,
      gender,
      dateOfBirth,
      specialization,
      superSpecialization: superSpecialization || "",
      qualification,
      medicalRegistrationNumber,
      experience: Number(experience),
      hospitalName,
      consultationFee: Number(consultationFee),
      languagesSpoken: Array.isArray(languagesSpoken)
        ? languagesSpoken
        : typeof languagesSpoken === "string"
          ? languagesSpoken
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      workingDays: Array.isArray(workingDays) ? workingDays : [],
      startTime,
      endTime,
      consultationModes: Array.isArray(consultationModes)
        ? consultationModes
        : [],
      aboutDoctor: aboutDoctor || "",
      shortBio: shortBio || "",
      profileCompleted: true,
    };

    // ✅ FIX 4: single upsert — avoids both duplicate key errors and
    //    the race condition between findOne + create
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: profileData },
      {
        new: true, // return updated doc
        upsert: true, // create if not found
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    // ✅ FIX 3: keep User doc in sync
    await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });

    // ✅ FIX 2: non-fatal availability sync
    try {
      await syncDoctorAvailability(req.user.id, profileData);
    } catch (syncErr) {
      console.error(
        "syncDoctorAvailability failed (non-fatal):",
        syncErr.message,
      );
    }

    res.status(200).json({
      success: true,
      message: "Doctor profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("Doctor profile save error:", error);

    // ✅ FIX 5: return validation errors clearly instead of generic 500
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }

    // Duplicate key (e.g. medicalRegistrationNumber already used by another doctor)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `${field} already exists. Please use a different value.`,
      });
    }

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
