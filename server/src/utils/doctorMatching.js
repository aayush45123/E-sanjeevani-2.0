// Doctor Auto-Matching Service
// Matches patients with appropriate doctors based on symptoms and availability

import DoctorProfile from "../models/DoctorProfile.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import Consultation from "../models/Consultation.js";

export const matchDoctorBySpecialty = async (specialties, urgencyScore) => {
  try {
    // Find doctors with matching specialties
    const doctors = await DoctorProfile.find({
      specialization: { $in: specialties },
      isVerified: true,
      isActive: true,
    }).populate("userId");

    if (doctors.length === 0) {
      return null;
    }

    // Get current availability for doctors
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const availableDoctors = [];

    for (const doctor of doctors) {
      // Check if doctor has availability today or upcoming
      const availability = await DoctorAvailability.findOne({
        doctorId: doctor._id,
        date: { $gte: today },
        isBooked: { $lt: 3 }, // Has slots available (assuming max 3 consultations per slot)
      }).sort({ date: 1 });

      if (availability) {
        // Calculate priority based on urgency and doctor rating
        const priority = calculateDoctorPriority(
          doctor,
          urgencyScore,
          availability,
        );
        availableDoctors.push({
          doctorId: doctor._id,
          doctor: doctor,
          availability: availability,
          priority: priority,
        });
      }
    }

    if (availableDoctors.length === 0) {
      return null;
    }

    // Sort by priority (higher priority first)
    availableDoctors.sort((a, b) => b.priority - a.priority);

    return availableDoctors[0]; // Return highest priority match
  } catch (error) {
    console.error("Error in matchDoctorBySpecialty:", error);
    return null;
  }
};

export const calculateDoctorPriority = (doctor, urgencyScore, availability) => {
  // Matching Score = 0.40 Urgency + 0.25 Specialty Match + 0.20 Availability + 0.10 Language Preference + 0.05 Patient History

  // 1. URGENCY COMPONENT (0.40 weight)
  // Normalize urgency score to 0-1 scale (urgency 10 = highest match)
  const urgencyNormalized = Math.min(urgencyScore / 10, 1);
  const urgencyComponent = urgencyNormalized * 0.4;

  // 2. SPECIALTY MATCH COMPONENT (0.25 weight)
  // Doctors already filtered by specialty, so max score here
  // Could add nuance: perfect specialty match = 1.0, related specialty = 0.8
  const specialtyMatch = 1.0; // Already matched by specialty
  const specialtyComponent = specialtyMatch * 0.25;

  // 3. AVAILABILITY COMPONENT (0.20 weight)
  // Sooner availability = higher score
  const timeUntilAvailable = availability.date.getTime() - new Date().getTime();
  const daysUntilAvailable = timeUntilAvailable / (1000 * 60 * 60 * 24);

  let availabilityScore = 0;
  if (daysUntilAvailable <= 0.5) {
    availabilityScore = 1.0; // Available within 12 hours - perfect
  } else if (daysUntilAvailable <= 1) {
    availabilityScore = 0.9; // Available within 24 hours
  } else if (daysUntilAvailable <= 3) {
    availabilityScore = 0.7; // Available within 3 days
  } else if (daysUntilAvailable <= 7) {
    availabilityScore = 0.5; // Available within a week
  } else {
    availabilityScore = Math.max(0.2, 1 - daysUntilAvailable / 30); // Decays over time
  }
  const availabilityComponent = availabilityScore * 0.2;

  // 4. LANGUAGE PREFERENCE COMPONENT (0.10 weight)
  // Assuming doctor.languages is an array of languages they speak
  // For now, give full score (assuming all doctors speak patient's language)
  // In real implementation, check patient's preferred language
  const languageScore =
    doctor.languages && doctor.languages.length > 0 ? 1.0 : 0.8;
  const languageComponent = languageScore * 0.1;

  // 5. PATIENT HISTORY COMPONENT (0.05 weight)
  // Doctors with more experience get higher scores
  // Normalize experience: 20 years = max score
  const experienceNormalized = Math.min(
    (doctor.yearsOfExperience || 0) / 20,
    1,
  );
  const historyComponent = experienceNormalized * 0.05;

  // TOTAL MATCHING SCORE (0-1 scale)
  const totalScore =
    urgencyComponent +
    specialtyComponent +
    availabilityComponent +
    languageComponent +
    historyComponent;

  return totalScore;
};

export const createAutoMatchedConsultation = async (
  patientId,
  matchedDoctor,
  triageSessionId,
) => {
  try {
    const consultation = new Consultation({
      patientId: patientId,
      doctorId: matchedDoctor.doctorId,
      availabilitySlotId: matchedDoctor.availability._id,
      status: "scheduled",
      consultationType: "video",
      reason: "AI Triage Auto-matched Consultation",
      triageSessionId: triageSessionId,
      scheduledDate: matchedDoctor.availability.date,
      scheduledTime: matchedDoctor.availability.startTime,
      createdBy: "AI_TRIAGE",
    });

    await consultation.save();

    // Update availability to mark slot as booked
    await DoctorAvailability.findByIdAndUpdate(matchedDoctor.availability._id, {
      $inc: { isBooked: 1 },
    });

    return consultation;
  } catch (error) {
    console.error("Error creating auto-matched consultation:", error);
    return null;
  }
};
