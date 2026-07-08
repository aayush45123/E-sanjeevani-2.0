import { db } from "../config/neonDb.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { TriageRepository } from "../repositories/triage.repository.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";

export const calculateDoctorPriority = (doctor, urgencyScore, availability) => {
  const urgencyNormalized = Math.min(urgencyScore / 10, 1);
  const urgencyComponent = urgencyNormalized * 0.4;

  const specialtyMatch = 1.0;
  const specialtyComponent = specialtyMatch * 0.25;

  const availableDate = new Date(availability.availableDate);
  const timeUntilAvailable = availableDate.getTime() - new Date().getTime();
  const daysUntilAvailable = timeUntilAvailable / (1000 * 60 * 60 * 24);

  let availabilityScore = 0;
  if (daysUntilAvailable <= 0.5) {
    availabilityScore = 1.0;
  } else if (daysUntilAvailable <= 1) {
    availabilityScore = 0.9;
  } else if (daysUntilAvailable <= 3) {
    availabilityScore = 0.7;
  } else if (daysUntilAvailable <= 7) {
    availabilityScore = 0.5;
  } else {
    availabilityScore = Math.max(0.2, 1 - daysUntilAvailable / 30);
  }
  const availabilityComponent = availabilityScore * 0.2;

  const languageScore =
    doctor.languagesSpoken && doctor.languagesSpoken.length > 0 ? 1.0 : 0.8;
  const languageComponent = languageScore * 0.1;

  const experienceNormalized = Math.min((doctor.experience || 0) / 20, 1);
  const historyComponent = experienceNormalized * 0.05;

  return urgencyComponent + specialtyComponent + availabilityComponent + languageComponent + historyComponent;
};

export const matchDoctorBySpecialty = async (specialties, urgencyScore) => {
  try {
    const candidateDoctors = await DoctorProfileRepository.findVerifiedCandidatesBySpecialties(specialties);

    if (candidateDoctors.length === 0) {
      return null;
    }

    const today = new Date().toISOString().split("T")[0];
    const availableDoctors = [];

    for (const doctor of candidateDoctors) {
      const slots = await db.transaction(async (tx) => {
        const availability = await AvailabilityRepository.findActiveAvailabilityByDate(doctor.userId, today);
        if (!availability) return [];
        return AvailabilityRepository.findActiveSlotsForAvailability(availability.id);
      });

      const slot = slots[0];

      if (slot) {
        const priority = calculateDoctorPriority(doctor, urgencyScore, {
          availableDate: today,
        });

        availableDoctors.push({
          doctorId: doctor.userId,
          doctor: {
            id: doctor.userId,
            fullName: doctor.name,
            specialization: doctor.specialization,
            experience: doctor.experience,
            languagesSpoken: doctor.languagesSpoken,
          },
          availability: {
            availabilityId: slot.availabilityId,
            availableDate: today,
            slotId: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
          priority: priority,
        });
      }
    }

    if (availableDoctors.length === 0) {
      return null;
    }

    availableDoctors.sort((a, b) => b.priority - a.priority);
    return availableDoctors[0];
  } catch (error) {
    console.error("Error in matchDoctorBySpecialty:", error);
    return null;
  }
};

export const createAutoMatchedConsultation = async (
  patientId,
  matchedDoctor,
  triageSessionId,
) => {
  try {
    const triageSession = await TriageRepository.findSessionById(triageSessionId);
    const symptomsText = triageSession ? JSON.stringify(triageSession.symptoms) : "[]";
    const consultationDate = new Date(matchedDoctor.availability.availableDate);

    const consultation = await db.transaction(async (tx) => {
      const newConsultation = await ConsultationRepository.create(tx, {
        patientId,
        doctorId: matchedDoctor.doctorId,
        consultationType: "video",
        symptoms: symptomsText,
        currentProblem: "AI Triage Auto-matched Consultation",
        medicalHistory: triageSession?.medicalHistory || "",
        allergies: triageSession?.allergies || "",
        consultationDate,
        startTime: matchedDoctor.availability.startTime,
        endTime: matchedDoctor.availability.endTime,
        status: "scheduled",
      });

      await AvailabilityRepository.updateSlotBookingStatus(
        tx,
        matchedDoctor.availability.availabilityId,
        matchedDoctor.availability.startTime,
        matchedDoctor.availability.endTime,
        true,
        patientId,
      );

      await AvailabilityRepository.updateSlotConsultationId(
        tx,
        matchedDoctor.availability.slotId,
        newConsultation.id,
      );

      return newConsultation;
    });

    return {
      ...consultation,
      scheduledDate: consultation.consultationDate,
      scheduledTime: consultation.startTime,
    };
  } catch (error) {
    console.error("Error creating auto-matched consultation:", error);
    return null;
  }
};
