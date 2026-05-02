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
  let priority = 0;

  // Experience factor - more experienced doctors get higher priority for critical cases
  if (urgencyScore >= 8) {
    priority += (doctor.yearsOfExperience || 0) * 0.5;
  }

  // Rating factor
  priority += (doctor.rating || 0) * 2;

  // Availability immediacy - sooner availability gets higher priority
  const timeUntilAvailable = availability.date.getTime() - new Date().getTime();
  const daysUntilAvailable = timeUntilAvailable / (1000 * 60 * 60 * 24);

  if (daysUntilAvailable <= 1) {
    priority += 10; // Available within 24 hours
  } else if (daysUntilAvailable <= 3) {
    priority += 5;
  } else if (daysUntilAvailable <= 7) {
    priority += 2;
  }

  // Consultation fee factor - lower fee for same quality
  if (doctor.consultationFee) {
    priority += (500 - doctor.consultationFee) / 100;
  }

  return priority;
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
