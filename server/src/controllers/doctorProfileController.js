import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "../config/neonDb.js";

import {
  users,
  doctorProfiles,
  doctorAvailabilities,
  availabilitySlots,
} from "../db/schema/index.js";

const SLOT_DURATION_MINUTES = 30;
const AVAILABILITY_LOOKAHEAD_DAYS = 30;

const getDayName = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
  });

const getDateString = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildSlots = (startTime, endTime) => {
  const slots = [];

  if (!startTime || !endTime) {
    return slots;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);

  const [endHour, endMinute] = endTime.split(":").map(Number);

  const current = startHour * 60 + startMinute;

  const end = endHour * 60 + endMinute;

  if (Number.isNaN(current) || Number.isNaN(end) || current >= end) {
    return slots;
  }

  for (
    let minute = current;
    minute + SLOT_DURATION_MINUTES <= end;
    minute += SLOT_DURATION_MINUTES
  ) {
    const next = minute + SLOT_DURATION_MINUTES;

    const formatMinutes = (totalMinutes) => {
      const hour = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}`;
    };

    slots.push({
      startTime: formatMinutes(minute),
      endTime: formatMinutes(next),
    });
  }

  return slots;
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const validateTimeRange = (startTime, endTime) => {
  const slots = buildSlots(startTime, endTime);

  return slots.length > 0;
};

const formatDoctorProfile = (profile, user = null) => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,

    /*
      Compatibility with old Mongoose .populate():

      profile.userId.name
      profile.userId.email
    */
    userId: user
      ? {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : profile.userId,

    clinicAddress: {
      apartment: profile.clinicApartment || "",
      street: profile.clinicStreet || "",
      district: profile.clinicDistrict || "",
      city: profile.clinicCity || "",
      pinCode: profile.clinicPinCode || "",
      state: profile.clinicState || "",

      coordinates:
        profile.clinicLongitude !== null && profile.clinicLatitude !== null
          ? {
              type: "Point",
              coordinates: [profile.clinicLongitude, profile.clinicLatitude],
            }
          : null,
    },
  };
};

const calculateCompletion = (profile) => {
  if (!profile) {
    return 0;
  }

  let completed = 0;

  /*
    Preserve your current denominator of 3:
    basic_info
    clinic_address
    availability
  */
  const total = 3;

  if (profile.profileCompleted) {
    completed += 1;
  }

  if (
    profile.hasClinic &&
    profile.clinicLongitude !== null &&
    profile.clinicLatitude !== null
  ) {
    completed += 1;
  }

  if (
    Array.isArray(profile.workingDays) &&
    profile.workingDays.length > 0 &&
    profile.startTime &&
    profile.endTime
  ) {
    completed += 1;
  }

  return Math.round((completed / total) * 100);
};

const syncDoctorAvailability = async (tx, doctorId, profileData) => {
  const workingDays = Array.isArray(profileData.workingDays)
    ? profileData.workingDays
    : [];

  if (
    workingDays.length === 0 ||
    !profileData.startTime ||
    !profileData.endTime
  ) {
    return;
  }

  const generatedSlots = buildSlots(profileData.startTime, profileData.endTime);

  if (generatedSlots.length === 0) {
    return;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(today);

  lastDate.setDate(today.getDate() + AVAILABILITY_LOOKAHEAD_DAYS - 1);

  /*
    Find current availability rows in the rolling window.
  */
  const existingAvailabilities = await tx
    .select()
    .from(doctorAvailabilities)
    .where(
      and(
        eq(doctorAvailabilities.doctorId, doctorId),
        gte(doctorAvailabilities.availableDate, getDateString(today)),
        lte(doctorAvailabilities.availableDate, getDateString(lastDate)),
      ),
    );

  const availabilityByDate = new Map(
    existingAvailabilities.map((availability) => [
      availability.availableDate,
      availability,
    ]),
  );

  for (
    let dayOffset = 0;
    dayOffset < AVAILABILITY_LOOKAHEAD_DAYS;
    dayOffset += 1
  ) {
    const date = new Date(today);

    date.setDate(today.getDate() + dayOffset);

    const availableDate = getDateString(date);

    const shouldBeAvailable = workingDays.includes(getDayName(date));

    const existingAvailability = availabilityByDate.get(availableDate);

    /*
      If doctor removed this working day,
      deactivate the availability row.

      We do NOT delete booking history.
    */
    if (!shouldBeAvailable) {
      if (existingAvailability) {
        await tx
          .update(doctorAvailabilities)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(doctorAvailabilities.id, existingAvailability.id));
      }

      continue;
    }

    let availabilityId;

    if (existingAvailability) {
      availabilityId = existingAvailability.id;

      await tx
        .update(doctorAvailabilities)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(doctorAvailabilities.id, availabilityId));
    } else {
      const insertedAvailability = await tx
        .insert(doctorAvailabilities)
        .values({
          doctorId,
          availableDate,
          isActive: true,
        })
        .returning({
          id: doctorAvailabilities.id,
        });

      availabilityId = insertedAvailability[0].id;
    }

    /*
      Preserve already-booked slots.

      Remove only unbooked slots before regenerating
      the doctor's current schedule.
    */
    await tx
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.isBooked, false),
        ),
      );

    /*
      Load remaining booked slots.
    */
    const bookedSlots = await tx
      .select({
        startTime: availabilitySlots.startTime,

        endTime: availabilitySlots.endTime,
      })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.isBooked, true),
        ),
      );

    const bookedSlotKeys = new Set(
      bookedSlots.map((slot) => `${slot.startTime}-${slot.endTime}`),
    );

    /*
      Do not recreate a slot that is already booked.
    */
    const slotsToInsert = generatedSlots.filter(
      (slot) => !bookedSlotKeys.has(`${slot.startTime}-${slot.endTime}`),
    );

    if (slotsToInsert.length > 0) {
      await tx.insert(availabilitySlots).values(
        slotsToInsert.map((slot) => ({
          availabilityId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
        })),
      );
    }
  }
};

/*
==================================================
CREATE / UPDATE DOCTOR PROFILE

POST /api/doctor-profile
==================================================
*/

export const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create profile",
      });
    }

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

      hasClinic,
      clinicAddress,

      clinicLatitude,
      clinicLongitude,
    } = req.body;

    const missingFields = [];

    if (!phone) {
      missingFields.push("phone");
    }

    if (!gender) {
      missingFields.push("gender");
    }

    if (!dateOfBirth) {
      missingFields.push("dateOfBirth");
    }

    if (!specialization) {
      missingFields.push("specialization");
    }

    if (!qualification) {
      missingFields.push("qualification");
    }

    if (!medicalRegistrationNumber) {
      missingFields.push("medicalRegistrationNumber");
    }

    if (experience === undefined || experience === "") {
      missingFields.push("experience");
    }

    if (!hospitalName) {
      missingFields.push("hospitalName");
    }

    if (consultationFee === undefined || consultationFee === "") {
      missingFields.push("consultationFee");
    }

    if (!startTime) {
      missingFields.push("startTime");
    }

    if (!endTime) {
      missingFields.push("endTime");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!validateTimeRange(startTime, endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability time range",
      });
    }

    const numericExperience = Number(experience);

    const numericConsultationFee = Number(consultationFee);

    if (!Number.isInteger(numericExperience) || numericExperience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a non-negative integer",
      });
    }

    if (
      !Number.isFinite(numericConsultationFee) ||
      numericConsultationFee < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Consultation fee must be a non-negative number",
      });
    }

    const normalizedHasClinic = hasClinic === true || hasClinic === "true";

    const latitude = toNullableNumber(
      clinicLatitude ?? clinicAddress?.coordinates?.coordinates?.[1],
    );

    const longitude = toNullableNumber(
      clinicLongitude ?? clinicAddress?.coordinates?.coordinates?.[0],
    );

    const profileData = {
      userId,

      phone: String(phone).trim(),

      gender,

      dateOfBirth: new Date(dateOfBirth),

      specialization: String(specialization).trim(),

      superSpecialization: superSpecialization
        ? String(superSpecialization).trim()
        : "",

      qualification: String(qualification).trim(),

      medicalRegistrationNumber: String(medicalRegistrationNumber).trim(),

      experience: numericExperience,

      hospitalName: String(hospitalName).trim(),

      /*
        Drizzle numeric columns accept string values
        safely and return strings by default.

        Store normalized decimal text.
      */
      consultationFee: numericConsultationFee.toFixed(2),

      languagesSpoken: normalizeStringArray(languagesSpoken),

      workingDays: normalizeStringArray(workingDays),

      consultationModes: normalizeStringArray(consultationModes),

      startTime,
      endTime,

      aboutDoctor: aboutDoctor || "",

      shortBio: shortBio || "",

      hasClinic: normalizedHasClinic,

      clinicApartment: normalizedHasClinic
        ? clinicAddress?.apartment || null
        : null,

      clinicStreet: normalizedHasClinic ? clinicAddress?.street || null : null,

      clinicDistrict: normalizedHasClinic
        ? clinicAddress?.district || null
        : null,

      clinicCity: normalizedHasClinic ? clinicAddress?.city || null : null,

      clinicPinCode: normalizedHasClinic
        ? clinicAddress?.pinCode || null
        : null,

      clinicState: normalizedHasClinic ? clinicAddress?.state || null : null,

      clinicLatitude: normalizedHasClinic ? latitude : null,

      clinicLongitude: normalizedHasClinic ? longitude : null,

      profileCompleted: true,

      updatedAt: new Date(),
    };

    /*
  Verify doctor user exists.
*/
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];

    if (!user || user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create profile",
      });
    }

    /*
  Create/update doctor profile.

  UNIQUE doctor_profiles.user_id allows
  ON CONFLICT DO UPDATE.
*/
    const profileRows = await db
      .insert(doctorProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: doctorProfiles.userId,

        set: {
          phone: profileData.phone,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,

          specialization: profileData.specialization,

          superSpecialization: profileData.superSpecialization,

          qualification: profileData.qualification,

          medicalRegistrationNumber: profileData.medicalRegistrationNumber,

          experience: profileData.experience,

          hospitalName: profileData.hospitalName,

          consultationFee: profileData.consultationFee,

          languagesSpoken: profileData.languagesSpoken,

          workingDays: profileData.workingDays,

          consultationModes: profileData.consultationModes,

          startTime: profileData.startTime,

          endTime: profileData.endTime,

          aboutDoctor: profileData.aboutDoctor,

          shortBio: profileData.shortBio,

          hasClinic: profileData.hasClinic,

          clinicApartment: profileData.clinicApartment,

          clinicStreet: profileData.clinicStreet,

          clinicDistrict: profileData.clinicDistrict,

          clinicCity: profileData.clinicCity,

          clinicPinCode: profileData.clinicPinCode,

          clinicState: profileData.clinicState,

          clinicLatitude: profileData.clinicLatitude,

          clinicLongitude: profileData.clinicLongitude,

          profileCompleted: true,

          updatedAt: new Date(),
        },
      })
      .returning();

    const profile = profileRows[0];

    /*
  Synchronize availability.

  IMPORTANT:
  syncDoctorAvailability previously expected tx.

  neon-http has no interactive transactions,
  so pass db instead.
*/
    try {
      await syncDoctorAvailability(db, userId, profileData);
    } catch (syncError) {
      console.error("Doctor availability synchronization failed:", syncError);

      /*
    Keep this non-fatal for now.

    The doctor profile has already been saved.
    Availability can be retried.
  */
    }

    return res.status(200).json({
      success: true,

      message: "Doctor profile saved successfully",

      profile: formatDoctorProfile(profile, user),
    });
  } catch (error) {
    console.error("Create/update doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create or update doctor profile",
      error: error.message,
    });
  }
};

/*
==================================================
GET LOGGED-IN DOCTOR PROFILE

GET /api/doctor-profile/me
==================================================
*/

export const getDoctorProfile = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access doctor profiles",
      });
    }

    const rows = await db
      .select({
        profile: doctorProfiles,

        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(doctorProfiles.userId, req.user.id))
      .limit(1);

    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,

      profile: formatDoctorProfile(row.profile, row.user),
    });
  } catch (error) {
    console.error("Fetch doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message,
    });
  }
};

/*
==================================================
CHECK PROFILE STATUS

GET /api/doctor-profile/status
==================================================
*/

export const checkDoctorProfileStatus = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors have doctor profile status",
      });
    }

    const rows = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, req.user.id))
      .limit(1);

    const profile = rows[0] ?? null;

    const hasClinicAddress = !!(
      profile?.hasClinic &&
      profile.clinicLongitude !== null &&
      profile.clinicLatitude !== null
    );

    const hasAvailability = !!(
      Array.isArray(profile?.workingDays) &&
      profile.workingDays.length > 0 &&
      profile.startTime &&
      profile.endTime
    );

    const missingItems = [];

    if (!profile?.profileCompleted) {
      missingItems.push("basic_info");
    }

    if (profile?.profileCompleted && profile?.hasClinic && !hasClinicAddress) {
      missingItems.push("clinic_address");
    }

    if (profile?.profileCompleted && !hasAvailability) {
      missingItems.push("availability");
    }

    return res.status(200).json({
      success: true,

      profileCompleted: !!profile?.profileCompleted,

      clinicAddressComplete: hasClinicAddress,

      hasClinic: !!profile?.hasClinic,

      missingItems,

      profile: formatDoctorProfile(profile),

      completenessPercentage: calculateCompletion(profile),
    });
  } catch (error) {
    console.error("Check profile status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check profile status",
      error: error.message,
    });
  }
};
