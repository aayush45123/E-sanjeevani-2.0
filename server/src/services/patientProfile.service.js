import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import {
  calculateProfileCompletion,
  sanitizeProfile,
} from "../helpers/responseFormatter.helper.js";

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

const isPatientRole = (role) => String(role || "").trim().toLowerCase() === "patient";

export class PatientProfileService {
  static async createProfile(userId, userRole, requestBody) {
    if (!isPatientRole(userRole)) {
      throw { status: 403, message: "Only patients can create a patient profile" };
    }

    const existing = await PatientProfileRepository.findByUserId(userId);
    if (existing) {
      throw { status: 409, message: "Profile already exists. Use PATCH to update." };
    }

    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = requestBody[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      throw {
        status: 400,
        message: "Validation failed",
        errors: missingFields.map((field) => `${field} is required`),
      };
    }

    const profileData = {
      userId,
      age: requestBody.age,
      gender: requestBody.gender,
      bloodGroup: requestBody.bloodGroup,
      maritalStatus: requestBody.maritalStatus,
      height: requestBody.height,
      weight: requestBody.weight,
      bloodPressure: requestBody.bloodPressure || "",
      smoking: requestBody.smoking,
      alcohol: requestBody.alcohol,
      diet: requestBody.diet,
      exercise: requestBody.exercise,
      allergies: requestBody.allergies || "",
      chronicConditions: requestBody.chronicConditions || "",
      currentMedications: requestBody.currentMedications || "",
      pastSurgeries: requestBody.pastSurgeries || "",
    };

    const isProfileComplete = calculateProfileCompletion(profileData);
    const profile = await PatientProfileRepository.create({
      ...profileData,
      isProfileComplete,
    });

    return {
      isProfileComplete: profile.isProfileComplete,
      profile: sanitizeProfile(profile),
    };
  }

  static async getProfile(userId, userRole) {
    if (!isPatientRole(userRole)) {
      return {
        isProfileComplete: false,
        profile: null,
      };
    }

    const profile = await PatientProfileRepository.findByUserId(userId);
    if (!profile) {
      return {
        isProfileComplete: false,
        profile: null,
      };
    }

    return {
      isProfileComplete: profile.isProfileComplete,
      profile: sanitizeProfile(profile),
    };
  }

  static async updateProfile(userId, userRole, requestBody) {
    if (!isPatientRole(userRole)) {
      throw { status: 403, message: "Only patients can update a patient profile" };
    }

    const existing = await PatientProfileRepository.findByUserId(userId);
    if (!existing) {
      throw { status: 404, message: "Profile not found. Create the profile first." };
    }

    const updates = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (requestBody[field] !== undefined) {
        updates[field] = requestBody[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw { status: 400, message: "No valid profile fields provided" };
    }

    const mergedProfile = {
      ...existing,
      ...updates,
    };

    const isProfileComplete = calculateProfileCompletion(mergedProfile);
    const profile = await PatientProfileRepository.update(userId, {
      ...updates,
      isProfileComplete,
    });

    return {
      isProfileComplete: profile.isProfileComplete,
      profile: sanitizeProfile(profile),
    };
  }

  static async getProfileStatus(userId, userRole) {
    if (!isPatientRole(userRole)) {
      return {
        isProfileComplete: false,
      };
    }

    const profile = await PatientProfileRepository.findByUserId(userId);
    return {
      isProfileComplete: profile?.isProfileComplete ?? false,
    };
  }
}
