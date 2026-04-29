import PatientProfile from "../models/PatientProfile.js";

/*
========================================================
CREATE PROFILE
POST /api/patient/profile
========================================================
*/
const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Prevent duplicate profile creation
    const existing = await PatientProfile.findOne({ userId });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists. Use PATCH to update.",
      });
    }

    const profile = new PatientProfile({
      userId,

      // STEP 1 - Personal Details
      age: req.body.age,
      gender: req.body.gender,
      bloodGroup: req.body.bloodGroup,
      maritalStatus: req.body.maritalStatus,

      // STEP 2 - Physical Vitals
      height: req.body.height,
      weight: req.body.weight,
      bloodPressure: req.body.bloodPressure || "",

      // STEP 3 - Lifestyle Habits
      smoking: req.body.smoking,
      alcohol: req.body.alcohol,
      diet: req.body.diet,
      exercise: req.body.exercise,

      // STEP 4 - Medical History
      allergies: req.body.allergies || "",
      chronicConditions: req.body.chronicConditions || "",
      currentMedications: req.body.currentMedications || "",
      pastSurgeries: req.body.pastSurgeries || "",
    });

    // pre-save hook will auto set isProfileComplete
    await profile.save();

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

    const profile = await PatientProfile.findOne({ userId });

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
This is the main method your frontend uses
(profileApi.updateProfile())
========================================================
*/
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await PatientProfile.findOne({ userId });

    /*
    IMPORTANT:
    If profile does not exist,
    create it automatically
    */
    if (!profile) {
      profile = new PatientProfile({
        userId,
      });
    }

    /*
    Only update allowed fields
    Never allow direct update of:
    - userId
    - isProfileComplete
    */

    const allowedFields = [
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

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    /*
    pre-save hook runs here and updates:
    isProfileComplete automatically
    */
    await profile.save();

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
Dashboard uses this to lock/unlock features
========================================================
*/
const getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ userId })
      .select("isProfileComplete")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        isProfileComplete: profile
          ? profile.isProfileComplete
          : false,
      },
    });
  } catch (err) {
    return handleError(res, err, "getProfileStatus");
  }
};

/*
========================================================
HELPERS
========================================================
*/

function sanitizeProfile(profile) {
  const obj = profile.toObject ? profile.toObject() : { ...profile };

  delete obj.__v;
  delete obj.userId;

  return obj;
}

function handleError(res, err, source) {
  console.error(`[PatientProfile:${source}]`, err);

  // Validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(
      (e) => e.message
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A profile already exists for this user",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export {
  createProfile,
  getProfile,
  updateProfile,
  getProfileStatus,
};