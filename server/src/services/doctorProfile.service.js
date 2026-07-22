import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { AvailabilityService } from "./availability.service.js";
import {
  formatDoctorProfile,
  calculateCompletion,
} from "../helpers/responseFormatter.helper.js";
import {
  toNullableNumber,
  normalizeStringArray,
  validateTimeRange,
} from "../helpers/dateTime.helper.js";

const isDoctorRole = (role) => String(role || "").trim().toLowerCase() === "doctor";

export class DoctorProfileService {
  static async createOrUpdateDoctorProfile(userId, userRole, requestBody) {
    if (!isDoctorRole(userRole)) {
      throw { status: 403, message: "Only doctors can create profile" };
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
    } = requestBody;

    const missingFields = [];
    if (!phone) missingFields.push("phone");
    if (!gender) missingFields.push("gender");
    if (!dateOfBirth) missingFields.push("dateOfBirth");
    if (!specialization) missingFields.push("specialization");
    if (!qualification) missingFields.push("qualification");
    if (!medicalRegistrationNumber) missingFields.push("medicalRegistrationNumber");
    if (experience === undefined || experience === "") missingFields.push("experience");
    if (!hospitalName) missingFields.push("hospitalName");
    if (consultationFee === undefined || consultationFee === "") missingFields.push("consultationFee");
    if (!startTime) missingFields.push("startTime");
    if (!endTime) missingFields.push("endTime");

    if (missingFields.length > 0) {
      throw {
        status: 400,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Reuse buildSlots logic via validateTimeRange helper
    const hasSlots = validateTimeRange(startTime, endTime);
    if (!hasSlots) {
      throw { status: 400, message: "Invalid availability time range" };
    }

    const numericExperience = Number(experience);
    const numericConsultationFee = Number(consultationFee);

    if (!Number.isInteger(numericExperience) || numericExperience < 0) {
      throw { status: 400, message: "Experience must be a non-negative integer" };
    }

    if (!Number.isFinite(numericConsultationFee) || numericConsultationFee < 0) {
      throw { status: 400, message: "Consultation fee must be a non-negative number" };
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
      superSpecialization: superSpecialization ? String(superSpecialization).trim() : "",
      qualification: String(qualification).trim(),
      medicalRegistrationNumber: String(medicalRegistrationNumber).trim(),
      experience: numericExperience,
      hospitalName: String(hospitalName).trim(),
      consultationFee: numericConsultationFee.toFixed(2),
      languagesSpoken: normalizeStringArray(languagesSpoken),
      workingDays: normalizeStringArray(workingDays),
      consultationModes: normalizeStringArray(consultationModes),
      startTime,
      endTime,
      aboutDoctor: aboutDoctor || "",
      shortBio: shortBio || "",
      hasClinic: normalizedHasClinic,
      clinicApartment: normalizedHasClinic ? clinicAddress?.apartment || null : null,
      clinicStreet: normalizedHasClinic ? clinicAddress?.street || null : null,
      clinicDistrict: normalizedHasClinic ? clinicAddress?.district || null : null,
      clinicCity: normalizedHasClinic ? clinicAddress?.city || null : null,
      clinicPinCode: normalizedHasClinic ? clinicAddress?.pinCode || null : null,
      clinicState: normalizedHasClinic ? clinicAddress?.state || null : null,
      clinicLatitude: normalizedHasClinic ? latitude : null,
      clinicLongitude: normalizedHasClinic ? longitude : null,
      profileCompleted: true,
    };

    const user = await UserRepository.findById(userId);
    if (!user || !isDoctorRole(user.role)) {
      throw { status: 403, message: "Only doctors can create profile" };
    }

    const profile = await DoctorProfileRepository.createOrUpdate(profileData);

    try {
      await AvailabilityService.syncDoctorAvailability(userId, profileData);
    } catch (syncError) {
      console.error("Doctor availability synchronization failed:", syncError);
    }

    return formatDoctorProfile(profile, user);
  }

  static async getDoctorProfile(userId, userRole) {
    if (!isDoctorRole(userRole)) {
      throw { status: 403, message: "Only doctors can access doctor profiles" };
    }

    const row = await DoctorProfileRepository.findByUserId(userId);
    if (!row) {
      return null;
    }

    return formatDoctorProfile(row.profile, row.user);
  }

  static async checkDoctorProfileStatus(userId, userRole) {
    if (!isDoctorRole(userRole)) {
      return {
        profileCompleted: false,
        clinicAddressComplete: false,
        hasClinic: false,
        missingItems: ["basic_info"],
        profile: null,
        completenessPercentage: 0,
      };
    }

    const profile = await DoctorProfileRepository.findRawProfileByUserId(userId);
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

    return {
      profileCompleted: !!profile?.profileCompleted,
      clinicAddressComplete: hasClinicAddress,
      hasClinic: !!profile?.hasClinic,
      missingItems,
      profile: formatDoctorProfile(profile),
      completenessPercentage: calculateCompletion(profile),
    };
  }
}

