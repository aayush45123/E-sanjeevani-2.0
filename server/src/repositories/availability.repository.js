import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  doctorAvailabilities,
  availabilitySlots,
  doctorProfiles,
} from "../database/schema/index.js";

export class AvailabilityRepository {
  static async findAvailabilityByDate(doctorId, availableDate) {
    const result = await db
      .select()
      .from(doctorAvailabilities)
      .where(
        and(
          eq(doctorAvailabilities.doctorId, doctorId),
          eq(doctorAvailabilities.availableDate, availableDate),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  static async findActiveAvailabilityByDate(doctorId, availableDate) {
    const result = await db
      .select()
      .from(doctorAvailabilities)
      .where(
        and(
          eq(doctorAvailabilities.doctorId, doctorId),
          eq(doctorAvailabilities.availableDate, availableDate),
          eq(doctorAvailabilities.isActive, true),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  static async findSlotsForAvailability(availabilityId) {
    return db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.availabilityId, availabilityId))
      .orderBy(asc(availabilitySlots.startTime));
  }

  static async findActiveSlotsForAvailability(availabilityId) {
    return db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.isBooked, false),
        ),
      )
      .orderBy(asc(availabilitySlots.startTime));
  }

  static async findOwnAvailabilities(doctorId) {
    return db
      .select()
      .from(doctorAvailabilities)
      .where(
        and(
          eq(doctorAvailabilities.doctorId, doctorId),
          eq(doctorAvailabilities.isActive, true),
        ),
      )
      .orderBy(asc(doctorAvailabilities.availableDate));
  }

  static async findAvailabilitiesInRange(doctorId, startDateStr, endDateStr) {
    return db
      .select()
      .from(doctorAvailabilities)
      .where(
        and(
          eq(doctorAvailabilities.doctorId, doctorId),
          gte(doctorAvailabilities.availableDate, startDateStr),
          lte(doctorAvailabilities.availableDate, endDateStr),
        ),
      );
  }

  static async createAvailability(tx, data) {
    const result = await (tx || db)
      .insert(doctorAvailabilities)
      .values(data)
      .returning();
    return result[0];
  }

  static async createAvailabilityOnConflictDoNothing(tx, data) {
    const result = await (tx || db)
      .insert(doctorAvailabilities)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return result[0];
  }

  static async updateAvailability(tx, id, updateData) {
    const result = await (tx || db)
      .update(doctorAvailabilities)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(doctorAvailabilities.id, id))
      .returning();
    return result[0];
  }

  static async deleteUnbookedSlots(tx, availabilityId) {
    await (tx || db)
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.isBooked, false),
        ),
      );
  }

  static async findBookedSlots(tx, availabilityId) {
    return (tx || db)
      .select({
        startTime: availabilitySlots.startTime,
        endTime: availabilitySlots.endTime,
      })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.isBooked, true),
        ),
      );
  }

  static async insertSlots(tx, slots) {
    if (slots.length === 0) return;
    await (tx || db).insert(availabilitySlots).values(slots);
  }

  static async insertSlotsOnConflictDoNothing(tx, slots) {
    if (slots.length === 0) return;
    await (tx || db).insert(availabilitySlots).values(slots).onConflictDoNothing();
  }

  static async findSlotForBooking(availabilityId, startTime, endTime) {
    const result = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.startTime, startTime),
          eq(availabilitySlots.endTime, endTime),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  static async updateSlotBookingStatus(tx, availabilityId, startTime, endTime, isBooked, bookedById) {
    const result = await tx
      .update(availabilitySlots)
      .set({
        isBooked,
        bookedById,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(availabilitySlots.availabilityId, availabilityId),
          eq(availabilitySlots.startTime, startTime),
          eq(availabilitySlots.endTime, endTime),
          eq(availabilitySlots.isBooked, !isBooked),
        ),
      )
      .returning();
    return result[0] ?? null;
  }

  static async updateSlotConsultationId(tx, slotId, consultationId) {
    await tx
      .update(availabilitySlots)
      .set({
        consultationId,
        updatedAt: new Date(),
      })
      .where(eq(availabilitySlots.id, slotId));
  }

  static async releaseSlotsForCancelledConsultation(tx, consultationId) {
    await tx
      .update(availabilitySlots)
      .set({
        isBooked: false,
        bookedById: null,
        consultationId: null,
        updatedAt: new Date(),
      })
      .where(eq(availabilitySlots.consultationId, consultationId));
  }
}
