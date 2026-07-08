import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import {
  getDateString,
  getDayName,
  buildSlots,
  normalizeTime,
} from "../helpers/dateTime.helper.js";
import {
  formatAvailability,
  formatSlot,
} from "../helpers/responseFormatter.helper.js";
import { AVAILABILITY_LOOKAHEAD_DAYS } from "../constants/index.js";
import { db } from "../config/neonDb.js";

const normalizeRequestedSlots = (slots) => {
  if (!Array.isArray(slots)) {
    return [];
  }
  const normalized = [];
  for (const slot of slots) {
    const startTime = typeof slot?.startTime === "string" ? slot.startTime.trim() : "";
    const endTime = typeof slot?.endTime === "string" ? slot.endTime.trim() : "";
    if (!startTime || !endTime) {
      continue;
    }
    normalized.push({
      startTime,
      endTime,
    });
  }
  // Remove duplicate requested slots
  return Array.from(
    new Map(
      normalized.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]),
    ).values(),
  );
};

export class AvailabilityService {
  static async syncDoctorAvailability(doctorId, profileData) {
    const workingDays = Array.isArray(profileData.workingDays)
      ? profileData.workingDays
      : [];

    if (workingDays.length === 0 || !profileData.startTime || !profileData.endTime) {
      return;
    }

    const generatedSlots = buildSlots(profileData.startTime, profileData.endTime);
    if (generatedSlots.length === 0) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(today);
    lastDate.setDate(today.getDate() + AVAILABILITY_LOOKAHEAD_DAYS - 1);

    const todayStr = getDateString(today);
    const lastDateStr = getDateString(lastDate);

    const existingAvailabilities = await AvailabilityRepository.findAvailabilitiesInRange(
      doctorId,
      todayStr,
      lastDateStr,
    );

    const availabilityByDate = new Map(
      existingAvailabilities.map((availability) => [
        availability.availableDate,
        availability,
      ]),
    );

    for (let dayOffset = 0; dayOffset < AVAILABILITY_LOOKAHEAD_DAYS; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const availableDate = getDateString(date);
      const shouldBeAvailable = workingDays.includes(getDayName(date));
      const existingAvailability = availabilityByDate.get(availableDate);

      if (!shouldBeAvailable) {
        if (existingAvailability) {
          await AvailabilityRepository.updateAvailability(db, existingAvailability.id, {
            isActive: false,
          });
        }
        continue;
      }

      let availabilityId;
      if (existingAvailability) {
        availabilityId = existingAvailability.id;
        await AvailabilityRepository.updateAvailability(db, availabilityId, {
          isActive: true,
        });
      } else {
        const insertedAvailability = await AvailabilityRepository.createAvailability(db, {
          doctorId,
          availableDate,
          isActive: true,
        });
        availabilityId = insertedAvailability.id;
      }

      // Replaces unbooked slots:
      await AvailabilityRepository.deleteUnbookedSlots(db, availabilityId);
      const bookedSlots = await AvailabilityRepository.findBookedSlots(db, availabilityId);
      const bookedSlotKeys = new Set(
        bookedSlots.map((slot) => `${slot.startTime}-${slot.endTime}`),
      );

      const slotsToInsert = generatedSlots.filter(
        (slot) => !bookedSlotKeys.has(`${slot.startTime}-${slot.endTime}`),
      );

      if (slotsToInsert.length > 0) {
        await AvailabilityRepository.insertSlots(
          db,
          slotsToInsert.map((slot) => ({
            availabilityId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false,
          })),
        );
      }
    }
  }

  static async createDoctorAvailability(userId, userRole, requestBody) {
    if (userRole !== "doctor") {
      throw { status: 403, message: "Only doctors can create availability" };
    }

    const { availableDate, slots } = requestBody ?? {};
    const normalizedDate = getDateString(availableDate);
    const normalizedSlots = normalizeRequestedSlots(slots);

    if (!normalizedDate || normalizedSlots.length === 0) {
      throw { status: 400, message: "Valid availableDate and slots are required" };
    }

    const user = await UserRepository.findById(userId);
    if (!user || user.role !== "doctor") {
      throw { status: 403, message: "Doctor user not found" };
    }

    let availability = await AvailabilityRepository.findAvailabilityByDate(userId, normalizedDate);
    let created = false;

    if (!availability) {
      availability = await AvailabilityRepository.createAvailability(db, {
        doctorId: userId,
        availableDate: normalizedDate,
        isActive: true,
      });
      created = true;
    } else {
      availability = await AvailabilityRepository.updateAvailability(db, availability.id, {
        isActive: true,
      });
    }

    // Replace unbooked slots
    await AvailabilityRepository.deleteUnbookedSlots(db, availability.id);
    const bookedSlots = await AvailabilityRepository.findBookedSlots(db, availability.id);
    const bookedKeys = new Set(
      bookedSlots.map((slot) => `${slot.startTime}-${slot.endTime}`),
    );

    const slotsToInsert = normalizedSlots.filter(
      (slot) => !bookedKeys.has(`${slot.startTime}-${slot.endTime}`),
    );

    if (slotsToInsert.length > 0) {
      await AvailabilityRepository.insertSlots(
        db,
        slotsToInsert.map((slot) => ({
          availabilityId: availability.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
        })),
      );
    }

    const savedSlots = await AvailabilityRepository.findSlotsForAvailability(availability.id);
    return {
      created,
      availability: formatAvailability(availability, savedSlots),
    };
  }

  static async getDoctorOwnAvailability(userId, userRole) {
    if (userRole !== "doctor") {
      throw { status: 403, message: "Only doctors can access their availability" };
    }

    const rows = await AvailabilityRepository.findOwnAvailabilities(userId);
    const availabilityList = await Promise.all(
      rows.map(async (row) => {
        const slots = await AvailabilityRepository.findSlotsForAvailability(row.id);
        return formatAvailability(row, slots);
      }),
    );

    return availabilityList;
  }

  static async getFallbackSlots(doctorId, availableDate) {
    const profile = await DoctorProfileRepository.findRawProfileByUserId(doctorId);
    if (!profile || !Array.isArray(profile.workingDays)) {
      return [];
    }
    const requestedDay = getDayName(`${availableDate}T12:00:00`);
    if (!profile.workingDays.includes(requestedDay)) {
      return [];
    }
    return buildSlots(profile.startTime, profile.endTime);
  }

  static async getDoctorAvailabilitySlots(doctorId, dateString) {
    const normalizedDate = getDateString(dateString);
    if (!doctorId || !normalizedDate) {
      throw { status: 400, message: "Valid doctorId and date query parameter are required" };
    }

    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw { status: 404, message: "Doctor not found" };
    }

    let availability = await AvailabilityRepository.findAvailabilityByDate(doctorId, normalizedDate);
    let source = "manual-availability";

    if (availability && !availability.isActive) {
      return {
        slots: [],
        source: "inactive-availability",
      };
    }

    if (!availability) {
      const fallbackSlots = await this.getFallbackSlots(doctorId, normalizedDate);
      if (fallbackSlots.length === 0) {
        return {
          slots: [],
          source: "doctor-profile-fallback",
        };
      }

      availability = await AvailabilityRepository.createAvailability(db, {
        doctorId,
        availableDate: normalizedDate,
        isActive: true,
      });

      await AvailabilityRepository.insertSlots(
        db,
        fallbackSlots.map((slot) => ({
          availabilityId: availability.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
        })),
      );
      source = "doctor-profile-fallback";
    }

    const slots = await AvailabilityRepository.findActiveSlotsForAvailability(availability.id);
    return {
      slots: slots.map((slot) => ({
        _id: slot.id,
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      source,
    };
  }

  static async deleteDoctorAvailability(userId, userRole, availabilityId) {
    if (userRole !== "doctor") {
      throw { status: 403, message: "Only doctors can delete availability" };
    }

    const existingAvailabilities = await db
      .select()
      .from(doctorAvailabilities)
      .where(eq(doctorAvailabilities.id, availabilityId))
      .limit(1);
    const availability = existingAvailabilities[0];

    if (!availability) {
      throw { status: 404, message: "Availability not found" };
    }

    if (availability.doctorId !== userId) {
      throw { status: 403, message: "Unauthorized access" };
    }

    await AvailabilityRepository.updateAvailability(db, availabilityId, {
      isActive: false,
    });

    return { message: "Availability removed successfully" };
  }
}
import { doctorAvailabilities } from "../database/schema/index.js";
