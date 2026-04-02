import PatientProfile from "../models/PatientProfile.js";

const createProfile = async (req, res) => {
  try {
    const userId = req.user.id; // injected by your JWT middleware

    // Prevent duplicate profile creation
    const existing = await PatientProfile.findOne({ userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists. Use PATCH to update.",
      });
    }

    const {
      fullName,
      age,
      gender,
      phone,
      emergencyContact,
      conditions,
      allergies,
      medications,
      smoking,
      alcohol,
      language,
      city,
      state,
    } = req.body;

    const profile = new PatientProfile({
      userId,
      fullName,
      age,
      gender,
      phone,
      emergencyContact: emergencyContact || null,
      conditions: conditions || [],
      allergies: allergies || "",
      medications: medications || "",
      smoking: smoking || "",
      alcohol: alcohol || "",
      language,
      city: city || "",
      state: state || "",
    });

    // pre-save hook sets isProfileComplete automatically
    await profile.save();

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      data: {
        isProfileComplete: profile.isProfileComplete,
        profile: sanitizeProfile(profile),
      },
    });
  } catch (err) {
    return handleError(res, err, "createProfile");
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/patient/profile
// Fetches the logged-in patient's profile.
// Dashboard calls this on load to check isProfileComplete.
// ─────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ userId }).lean();

    if (!profile) {
      // Profile not yet created — return a safe default
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

// ─────────────────────────────────────────────────────────────
// PATCH /api/patient/profile
// Partial update — user can edit their profile later.
// Any field from the form can be updated individually.
// ─────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Whitelist updatable fields — never let userId or
    // isProfileComplete be set directly from the request body
    const allowedFields = [
      "fullName",
      "age",
      "gender",
      "phone",
      "emergencyContact",
      "conditions",
      "allergies",
      "medications",
      "smoking",
      "alcohol",
      "language",
      "city",
      "state",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    // findOne + save instead of findOneAndUpdate so that
    // the pre-save hook recalculates isProfileComplete
    const profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Create one first.",
      });
    }

    Object.assign(profile, updates);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        isProfileComplete: profile.isProfileComplete,
        profile: sanitizeProfile(profile),
      },
    });
  } catch (err) {
    return handleError(res, err, "updateProfile");
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/patient/profile/status
// Lightweight endpoint — dashboard polls this to decide
// whether to show the lock banner. No heavy data returned.
// ─────────────────────────────────────────────────────────────
const getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ userId })
      .select("isProfileComplete")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        isProfileComplete: profile ? profile.isProfileComplete : false,
      },
    });
  } catch (err) {
    return handleError(res, err, "getProfileStatus");
  }
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Strip internal Mongoose fields before sending to client.
 * Never expose __v, and userId is redundant on the client.
 */
function sanitizeProfile(profile) {
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  delete obj.__v;
  delete obj.userId;
  return obj;
}

/**
 * Centralised error handler.
 * Separates Mongoose validation errors (400) from server errors (500).
 */
function handleError(res, err, source) {
  console.error(`[PatientProfile:${source}]`, err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: messages,
    });
  }

  // Mongoose duplicate key (userId unique constraint)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A profile already exists for this user.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
}

export { createProfile, getProfile, updateProfile, getProfileStatus };
