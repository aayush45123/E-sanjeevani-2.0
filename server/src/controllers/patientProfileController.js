import { eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";
import { patientProfiles } from "../db/schema/index.js";

const REQUIRED_FIELDS = [
  "age",
  "gender",
  "bloodGroup",
  "maritalStatus",
  "height",
  "weight",
  "smoking",
  "alcohol",
  "diet",
  "exercise",
];

const ALLOWED_FIELDS = [
  "age",
  "gender",
  "bloodGroup",
  "maritalStatus",

  "height",
  "weight",
  "bloodPressure",

  "smoking",
  "alcohol",
  "diet",
  "exercise",

  "allergies",
  "chronicConditions",
  "currentMedications",
  "pastSurgeries",
];

const calculateProfileCompletion = (profile) => {
  return REQUIRED_FIELDS.every((field) => {
    const value = profile[field];

    return value !== undefined && value !== null && value !== "";
  });
};

const sanitizeProfile = (profile) => {
  if (!profile) {
    return null;
  }

  const { userId, ...safeProfile } = profile;

  return safeProfile;
};

const getExistingProfile = async (userId) => {
  const result = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);

  return result[0] ?? null;
};

/*
========================================================
CREATE PROFILE
POST /api/patient/profile
========================================================
*/

const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can create a patient profile",
      });
    }

    const existing = await getExistingProfile(userId);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists. Use PATCH to update.",
      });
    }

    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = req.body[field];

      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: missingFields.map((field) => `${field} is required`),
      });
    }

    const profileData = {
      userId,

      age: req.body.age,
      gender: req.body.gender,
      bloodGroup: req.body.bloodGroup,
      maritalStatus: req.body.maritalStatus,

      height: req.body.height,
      weight: req.body.weight,
      bloodPressure: req.body.bloodPressure || "",

      smoking: req.body.smoking,
      alcohol: req.body.alcohol,
      diet: req.body.diet,
      exercise: req.body.exercise,

      allergies: req.body.allergies || "",
      chronicConditions: req.body.chronicConditions || "",
      currentMedications: req.body.currentMedications || "",
      pastSurgeries: req.body.pastSurgeries || "",
    };

    const isProfileComplete = calculateProfileCompletion(profileData);

    const insertedProfiles = await db
      .insert(patientProfiles)
      .values({
        ...profileData,
        isProfileComplete,
      })
      .returning();

    const profile = insertedProfiles[0];

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: {
        isProfileComplete: profile.isProfileComplete,
        profile: sanitizeProfile(profile),
      },
    });
  } catch (err) {
    return handleError(res, err, "createProfile");
  }
};

/*
========================================================
GET PROFILE
GET /api/patient/profile
========================================================
*/

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access a patient profile",
      });
    }

    const profile = await getExistingProfile(userId);

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          isProfileComplete: false,
          profile: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        isProfileComplete: profile.isProfileComplete,
        profile: sanitizeProfile(profile),
      },
    });
  } catch (err) {
    return handleError(res, err, "getProfile");
  }
};

/*
========================================================
UPDATE PROFILE
PATCH /api/patient/profile
========================================================
*/

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can update a patient profile",
      });
    }

    const existing = await getExistingProfile(userId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Create the profile first.",
      });
    }

    const updates = {};

    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    const mergedProfile = {
      ...existing,
      ...updates,
    };

    const isProfileComplete = calculateProfileCompletion(mergedProfile);

    const updatedProfiles = await db
      .update(patientProfiles)
      .set({
        ...updates,
        isProfileComplete,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.userId, userId))
      .returning();

    const profile = updatedProfiles[0];

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: {
        isProfileComplete: profile.isProfileComplete,
        profile: sanitizeProfile(profile),
      },
    });
  } catch (err) {
    return handleError(res, err, "updateProfile");
  }
};

/*
========================================================
GET PROFILE STATUS
GET /api/patient/profile/status
========================================================
*/

const getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients have a patient profile status",
      });
    }

    const result = await db
      .select({
        isProfileComplete: patientProfiles.isProfileComplete,
      })
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId))
      .limit(1);

    return res.status(200).json({
      success: true,
      data: {
        isProfileComplete: result[0]?.isProfileComplete ?? false,
      },
    });
  } catch (err) {
    return handleError(res, err, "getProfileStatus");
  }
};

/*
========================================================
ERROR HANDLER
========================================================
*/

function handleError(res, err, source) {
  console.error(`[PatientProfile:${source}]`, err);

  /*
    PostgreSQL unique_violation
  */
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A profile already exists for this user",
    });
  }

  /*
    PostgreSQL invalid_text_representation / enum error
    and NOT NULL violations.
  */
  if (err.code === "22P02" || err.code === "23502") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export { createProfile, getProfile, updateProfile, getProfileStatus };
