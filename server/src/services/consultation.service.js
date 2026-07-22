import crypto from "crypto";
import { db } from "../config/neonDb.js";
import { sql } from "drizzle-orm";
import { UserRepository } from "../repositories/user.repository.js";
import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";
import {
  sendAppointmentEmail,
} from "../emails/sendAppointmentEmail.js";
import {
  sendMeetingWaitingEmail,
} from "../emails/sendMeetingWaitingEmail.js";
import {
  normalizeDate,
  getDateString,
  normalizeTime,
} from "../helpers/dateTime.helper.js";
import {
  formatDoctor,
  formatSlot,
  formatConsultation,
} from "../helpers/responseFormatter.helper.js";
import { io } from "../server.js";

const getOrCreateAvailability = async (database, doctorId, availableDate) => {
  let availability = await AvailabilityRepository.findActiveAvailabilityByDate(doctorId, availableDate);
  if (!availability) {
    // Generate fallback slots if no exact availability exists
    const profile = await DoctorProfileRepository.findRawProfileByUserId(doctorId);
    if (!profile || !Array.isArray(profile.workingDays)) {
      return null;
    }
    const requestedDay = new Date(`${availableDate}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    });
    if (!profile.workingDays.includes(requestedDay)) {
      return null;
    }
    const buildSlots = (startTime, endTime) => {
      if (!startTime || !endTime) return [];
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return [];
      const slots = [];
      const formatMinutes = (totalMinutes) => {
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      };
      for (let minute = start; minute + 30 <= end; minute += 30) {
        slots.push({
          startTime: formatMinutes(minute),
          endTime: formatMinutes(minute + 30),
        });
      }
      return slots;
    };
    const generatedSlots = buildSlots(profile.startTime, profile.endTime);
    if (generatedSlots.length === 0) {
      return null;
    }

    const availabilityRows = await database
      .insert(AvailabilityRepository.createAvailability) // Wait, we can insert directly to table
      .select() // Wait, let's use AvailabilityRepository
      .from(doctorAvailabilities) // Let's import the raw tables or write via Repository
      .limit(1);
    // Actually, we can use AvailabilityRepository methods:
  }
  return availability;
};

export class ConsultationService {
  static async getAvailableDoctors({ specialization, limit, page }) {
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const rows = await DoctorProfileRepository.findAvailableDoctors({
      specialization,
      limit: parsedLimit,
      offset,
    });

    const total = await DoctorProfileRepository.countAvailableDoctors({ specialization });

    const doctors = rows.map(({ user, profile }) => formatDoctor(user, profile));

    return {
      doctors,
      pagination: {
        total,
        pages: Math.ceil(total / parsedLimit),
        currentPage: parsedPage,
      },
    };
  }

  static async getDoctorAvailableSlots({ doctorId, date }) {
    const availableDate = getDateString(date);
    if (!doctorId || !availableDate) {
      throw { status: 400, message: "doctorId and valid date are required" };
    }

    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw { status: 404, message: "Doctor not found" };
    }

    let availability = await AvailabilityRepository.findActiveAvailabilityByDate(doctorId, availableDate);
    if (!availability) {
      // Try fallback creation
      const profile = await DoctorProfileRepository.findRawProfileByUserId(doctorId);
      if (profile && Array.isArray(profile.workingDays)) {
        const requestedDay = new Date(`${availableDate}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
        });
        if (profile.workingDays.includes(requestedDay)) {
          // Create fallback availability
          const buildSlots = (startTime, endTime) => {
            if (!startTime || !endTime) return [];
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const start = startHour * 60 + startMinute;
            const end = endHour * 60 + endMinute;
            if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return [];
            const slots = [];
            const formatMinutes = (totalMinutes) => {
              const hour = Math.floor(totalMinutes / 60);
              const minute = totalMinutes % 60;
              return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            };
            for (let minute = start; minute + 30 <= end; minute += 30) {
              slots.push({
                startTime: formatMinutes(minute),
                endTime: formatMinutes(minute + 30),
              });
            }
            return slots;
          };
          const generatedSlots = buildSlots(profile.startTime, profile.endTime);
          if (generatedSlots.length > 0) {
            availability = await AvailabilityRepository.createAvailability(db, {
              doctorId,
              availableDate,
              isActive: true,
            });
            await AvailabilityRepository.insertSlots(
              db,
              generatedSlots.map((slot) => ({
                availabilityId: availability.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: false,
              })),
            );
          }
        }
      }
    }

    if (!availability) {
      return [];
    }

    const slots = await AvailabilityRepository.findActiveSlotsForAvailability(availability.id);
    return slots.map(formatSlot);
  }

  static async createConsultation(userId, userRole, requestBody) {
    if (userRole !== "patient") {
      throw { status: 403, message: "Only patients can book consultations" };
    }

    const {
      doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
    } = requestBody;

    if (
      !doctorId ||
      !consultationType ||
      !symptoms ||
      !currentProblem ||
      !consultationDate ||
      !startTime ||
      !endTime
    ) {
      throw { status: 400, message: "All required fields must be provided" };
    }

    const availableDate = getDateString(consultationDate);
    const normalizedConsultationDate = normalizeDate(consultationDate);

    if (!availableDate || !normalizedConsultationDate) {
      throw { status: 400, message: "Invalid consultation date" };
    }

    const patient = await UserRepository.findById(userId);
    if (!patient || patient.role !== "patient") {
      throw { status: 404, message: "Patient not found" };
    }

    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw { status: 404, message: "Doctor not found" };
    }

    let availability = await AvailabilityRepository.findActiveAvailabilityByDate(doctorId, availableDate);
    if (!availability) {
      // Fallback create
      const profile = await DoctorProfileRepository.findRawProfileByUserId(doctorId);
      if (profile && Array.isArray(profile.workingDays)) {
        const requestedDay = new Date(`${availableDate}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
        });
        if (profile.workingDays.includes(requestedDay)) {
          const buildSlots = (startTime, endTime) => {
            if (!startTime || !endTime) return [];
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const start = startHour * 60 + startMinute;
            const end = endHour * 60 + endMinute;
            if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return [];
            const slots = [];
            const formatMinutes = (totalMinutes) => {
              const hour = Math.floor(totalMinutes / 60);
              const minute = totalMinutes % 60;
              return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            };
            for (let minute = start; minute + 30 <= end; minute += 30) {
              slots.push({
                startTime: formatMinutes(minute),
                endTime: formatMinutes(minute + 30),
              });
            }
            return slots;
          };
          const generatedSlots = buildSlots(profile.startTime, profile.endTime);
          if (generatedSlots.length > 0) {
            availability = await AvailabilityRepository.createAvailability(db, {
              doctorId,
              availableDate,
              isActive: true,
            });
            await AvailabilityRepository.insertSlots(
              db,
              generatedSlots.map((slot) => ({
                availabilityId: availability.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: false,
              })),
            );
          }
        }
      }
    }

    if (!availability) {
      throw { status: 400, message: "Doctor is not available on the selected date" };
    }

    const normStartTime = normalizeTime(startTime);
    const normEndTime = normalizeTime(endTime);

    if (!normStartTime || !normEndTime) {
      throw { status: 400, message: "Invalid startTime or endTime format. Use HH:MM" };
    }

    const slot = await AvailabilityRepository.findSlotForBooking(availability.id, normStartTime, normEndTime);
    if (!slot) {
      throw { status: 404, message: "Selected slot does not exist for this date" };
    }

    if (slot.isBooked) {
      throw { status: 409, message: "Selected slot is already booked" };
    }

    const createdConsultation = await db.transaction(async (tx) => {
      const claimedSlot = await AvailabilityRepository.updateSlotBookingStatus(
        tx,
        availability.id,
        normStartTime,
        normEndTime,
        true,
        userId,
      );

      if (!claimedSlot) {
        const error = new Error("Selected slot is not available");
        error.statusCode = 409;
        throw error;
      }

      const consultation = await ConsultationRepository.create(tx, {
        patientId: userId,
        doctorId,
        consultationType,
        symptoms: String(symptoms),
        currentProblem: String(currentProblem),
        currentMedication: currentMedication ? String(currentMedication) : "",
        medicalHistory: medicalHistory ? String(medicalHistory) : "",
        allergies: allergies ? String(allergies) : "",
        consultationDate: normalizedConsultationDate,
        startTime,
        endTime,
        status: "scheduled",
        roomId: crypto.randomUUID(),
      });

      await AvailabilityRepository.updateSlotConsultationId(tx, claimedSlot.id, consultation.id);
      return consultation;
    });

    if (patient.email && doctor.email) {
      sendAppointmentEmail({
        patientEmail: patient.email,
        doctorEmail: doctor.email,
        patientName: patient.name,
        doctorName: doctor.name,
        consultationDate,
        startTime,
        endTime,
        consultationType,
      }).catch((emailError) =>
        console.error("Appointment email failed (non-critical):", emailError.message),
      );
    }

    return formatConsultation(createdConsultation, { doctor });
  }

  static async getDoctorConsultations(userId, userRole) {
    if (String(userRole || "").trim().toLowerCase() !== "doctor") {
      return [];
    }

    const rows = await ConsultationRepository.findDoctorConsultations(userId);
    return rows.map(({ consultation, patient }) =>
      formatConsultation(consultation, { patient }),
    );
  }

  static async getPatientConsultations(userId, userRole) {
    if (String(userRole || "").trim().toLowerCase() !== "patient") {
      return [];
    }

    const rows = await ConsultationRepository.findPatientConsultations(userId);
    return rows.map(({ consultation, doctor, doctorProfile }) =>
      formatConsultation(consultation, { doctor, doctorProfile }),
    );
  }

  static async getDoctorsNearMe({ latitude, longitude, radius = 10 }) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Math.min(Math.max(Number(radius) || 10, 1), 100);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw { status: 400, message: "Valid latitude and longitude are required" };
    }

    const distanceExpression = sql`
      (
        6371 * acos(
          least(
            1,
            greatest(
              -1,
              cos(radians(${lat}))
              * cos(radians(${doctorProfiles.clinicLatitude}::double precision))
              * cos(
                  radians(${doctorProfiles.clinicLongitude}::double precision)
                  - radians(${lng})
                )
              + sin(radians(${lat}))
              * sin(radians(${doctorProfiles.clinicLatitude}::double precision))
            )
          )
        )
      )
    `;

    const rows = await DoctorProfileRepository.findDoctorsNearMe({
      latitude: lat,
      longitude: lng,
      radius: rad,
      distanceExpression,
    });

    return rows.map(({ user, profile, distance }) => ({
      ...formatDoctor(user, profile),
      distance: Number(Number(distance).toFixed(2)),
      clinicAddress: {
        apartment: profile.clinicApartment ?? "",
        street: profile.clinicStreet ?? "",
        district: profile.clinicDistrict ?? "",
        city: profile.clinicCity ?? "",
        pinCode: profile.clinicPinCode ?? "",
        state: profile.clinicState ?? "",
        coordinates: {
          type: "Point",
          coordinates: [
            Number(profile.clinicLongitude),
            Number(profile.clinicLatitude),
          ],
        },
      },
    }));
  }

  static async updateConsultationStatus(userId, userRole, consultationId, status) {
    if (!status) {
      throw { status: 400, message: "Status is required" };
    }

    const existingConsultation = await ConsultationRepository.findById(consultationId);
    if (!existingConsultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    const CONSULTATION_STATUS_TRANSITIONS = {
      scheduled: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const canUpdateStatus = (consult, role, nextStatus) => {
      const allowed = CONSULTATION_STATUS_TRANSITIONS[consult.status] || [];
      if (!allowed.includes(nextStatus)) return false;
      if (role === "doctor") {
        return consult.doctorId === userId;
      }
      if (role === "patient") {
        return consult.patientId === userId && nextStatus === "cancelled";
      }
      return false;
    };

    if (!canUpdateStatus(existingConsultation, userRole, status)) {
      throw { status: 403, message: "You are not authorized to perform this status transition" };
    }

    const updatedConsultation = await db.transaction(async (tx) => {
      const lockedConsultation = await ConsultationRepository.lockConsultationForUpdate(tx, consultationId);
      if (!lockedConsultation) {
        throw { status: 404, message: "Consultation not found" };
      }

      const lockedNormalized = {
        id: lockedConsultation.id,
        patientId: lockedConsultation.patient_id,
        doctorId: lockedConsultation.doctor_id,
        status: lockedConsultation.status,
      };

      if (!canUpdateStatus(lockedNormalized, userRole, status)) {
        throw { status: 409, message: "Consultation status changed or transition is not allowed" };
      }

      const consultation = await ConsultationRepository.updateStatus(tx, consultationId, status);

      if (status === "cancelled") {
        await AvailabilityRepository.releaseSlotsForCancelledConsultation(tx, consultationId);
      }

      return consultation;
    });

    return formatConsultation(updatedConsultation);
  }

  static async addDoctorNotes(userId, userRole, consultationId, { doctorNotes, prescription, followUpRequired }) {
    if (userRole !== "doctor") {
      throw { status: 403, message: "Only doctors can update consultation notes" };
    }

    const consultation = await ConsultationRepository.findById(consultationId);
    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    if (consultation.doctorId !== userId) {
      throw { status: 403, message: "You can update notes only for consultations assigned to you" };
    }

    const updates = {};
    if (doctorNotes !== undefined) {
      updates.doctorNotes = String(doctorNotes);
    }
    if (prescription !== undefined) {
      updates.prescription = String(prescription);
    }
    if (followUpRequired !== undefined) {
      updates.followUpRequired = followUpRequired === true || followUpRequired === "true";
    }

    if (Object.keys(updates).length === 0) {
      throw { status: 400, message: "No consultation note fields provided" };
    }

    const updatedConsultation = await ConsultationRepository.updateNotes(consultationId, userId, updates);
    if (!updatedConsultation) {
      throw { status: 409, message: "Consultation could not be updated" };
    }

    return formatConsultation(updatedConsultation);
  }

  static async markUserJoined(userId, userRole, consultationId) {
    const row = await ConsultationRepository.findPatientDetailsForConsultation(consultationId);
    if (!row) {
      throw { status: 404, message: "Consultation not found" };
    }

    const consultation = row.consultation;

    if (userId !== consultation.patientId && userId !== consultation.doctorId) {
      throw { status: 403, message: "You are not part of this consultation" };
    }

    let joinField;
    if (userRole === "patient" && userId === consultation.patientId) {
      joinField = "patient";
    } else if (userRole === "doctor" && userId === consultation.doctorId) {
      joinField = "doctor";
    } else {
      throw { status: 403, message: "Invalid consultation participant role" };
    }

    const updates = {};
    if (joinField === "patient") {
      updates.patientJoined = true;
    } else {
      updates.doctorJoined = true;
    }

    const updatedConsultation = await ConsultationRepository.updateJoinStatus(consultationId, updates);

    if (io) {
      io.to(consultationId).emit("participant-joined", {
        consultationId,
        userId,
        role: userRole,
        patientJoined: updatedConsultation.patientJoined,
        doctorJoined: updatedConsultation.doctorJoined,
      });
    }

    if (joinField === "patient" && !updatedConsultation.doctorJoined) {
      try {
        const doctor = await UserRepository.findById(consultation.doctorId);
        if (doctor?.email) {
          sendMeetingWaitingEmail({
            recipientEmail: doctor.email,
            recipientName: doctor.name,
            waitingUserRole: "patient",
            waitingUserName: row.patient.name,
            consultationId,
            consultationDate: consultation.consultationDate,
            startTime: consultation.startTime,
          }).catch((emailError) =>
            console.error("Meeting waiting email failed (non-critical):", emailError.message),
          );
        }
      } catch (emailError) {
        console.error("Meeting waiting email failed (non-critical):", emailError.message);
      }
    }

    return formatConsultation(updatedConsultation, { patient: row.patient });
  }
}
