// Doctor Auto-Matching Service
// Matches patients with appropriate doctors based on symptoms and availability

import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import {
  doctorProfiles,
  users,
  doctorAvailabilities,
  availabilitySlots,
  consultations,
  triageSessions,
} from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, and, gte, inArray, asc } from "drizzle-orm";

export const matchDoctorBySpecialty = async (specialties, urgencyScore) => {
  try {
    // Find doctors with matching specialties.
    // Note: doctor_profiles has no "isVerified" boolean in the new schema —
    // it's replaced by the verificationStatus enum ("verified"/"pending"/"rejected").
    // "isActive" also isn't on doctor_profiles anymore, so we join users for that.
    const candidateDoctors = await db
      .select({
        userId: doctorProfiles.userId,
        specialization: doctorProfiles.specialization,
        experience: doctorProfiles.experience,
        languagesSpoken: doctorProfiles.languagesSpoken,
        name: users.name,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(users.id, doctorProfiles.userId))
      .where(
        and(
          inArray(doctorProfiles.specialization, specialties),
          eq(doctorProfiles.verificationStatus, "verified"),
          eq(users.isActive, true),
        ),
      );

    if (candidateDoctors.length === 0) {
      return null;
    }

    // Get current availability for doctors
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD', matches the date column's string mode

    const availableDoctors = [];

    for (const doctor of candidateDoctors) {
      // Check if doctor has an open (unbooked) slot today or upcoming.
      // The old model tracked a numeric isBooked counter (< 3) per day; the new
      // schema tracks booking per individual slot as a boolean, so we look for
      // the earliest unbooked slot instead.
      const [slot] = await db
        .select({
          availabilityId: doctorAvailabilities.id,
          availableDate: doctorAvailabilities.availableDate,
          slotId: availabilitySlots.id,
          startTime: availabilitySlots.startTime,
          endTime: availabilitySlots.endTime,
        })
        .from(doctorAvailabilities)
        .innerJoin(
          availabilitySlots,
          eq(availabilitySlots.availabilityId, doctorAvailabilities.id),
        )
        .where(
          and(
            eq(doctorAvailabilities.doctorId, doctor.userId),
            eq(doctorAvailabilities.isActive, true),
            gte(doctorAvailabilities.availableDate, today),
            eq(availabilitySlots.isBooked, false),
          ),
        )
        .orderBy(
          asc(doctorAvailabilities.availableDate),
          asc(availabilitySlots.startTime),
        )
        .limit(1);

      if (slot) {
        // Calculate priority based on urgency and doctor rating
        const priority = calculateDoctorPriority(doctor, urgencyScore, slot);

        availableDoctors.push({
          doctorId: doctor.userId,
          doctor: {
            id: doctor.userId,
            fullName: doctor.name,
            specialization: doctor.specialization,
            experience: doctor.experience,
            languagesSpoken: doctor.languagesSpoken,
          },
          availability: slot,
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
  const specialtyMatch = 1.0; // Already matched by specialty
  const specialtyComponent = specialtyMatch * 0.25;

  // 3. AVAILABILITY COMPONENT (0.20 weight)
  // Sooner availability = higher score
  const availableDate = new Date(availability.availableDate);
  const timeUntilAvailable = availableDate.getTime() - new Date().getTime();
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
  // doctor_profiles.languagesSpoken is a text[] column
  const languageScore =
    doctor.languagesSpoken && doctor.languagesSpoken.length > 0 ? 1.0 : 0.8;
  const languageComponent = languageScore * 0.1;

  // 5. PATIENT HISTORY COMPONENT (0.05 weight)
  // Doctors with more experience get higher scores
  // Normalize experience: 20 years = max score
  const experienceNormalized = Math.min((doctor.experience || 0) / 20, 1);
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
    // Pull triage session context to populate the consultation's required fields
    // (symptoms/currentProblem are NOT NULL on the new consultations table).
    // Note: the new consultations table has no triageSessionId, reason,
    // createdBy, or availabilitySlotId columns, so those aren't persisted
    // directly on the consultation row anymore. The slot linkage instead
    // lives on availability_slots.consultationId (set below).
    const [triageSession] = await db
      .select()
      .from(triageSessions)
      .where(eq(triageSessions.id, triageSessionId));

    const symptomsText = triageSession
      ? JSON.stringify(triageSession.symptoms)
      : "[]";

    const consultationDate = new Date(matchedDoctor.availability.availableDate);

    const [consultation] = await db
      .insert(consultations)
      .values({
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
      })
      .returning();

    // Mark the matched slot as booked and link it to this consultation
    await db
      .update(availabilitySlots)
      .set({
        isBooked: true,
        bookedById: patientId,
        consultationId: consultation.id,
        updatedAt: new Date(),
      })
      .where(eq(availabilitySlots.id, matchedDoctor.availability.slotId));

    // Convenience aliases so existing callers (e.g. the triage controller)
    // that read consultation.scheduledDate / consultation.scheduledTime
    // keep working without further changes.
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
