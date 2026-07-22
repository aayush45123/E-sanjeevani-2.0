import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../config/neonDb.js";
import {
  triageSessions,
  triageResponses,
  triageMessages,
  users,
  doctorProfiles,
} from "../database/schema/index.js";

export class TriageRepository {
  static async createSession(sessionData) {
    const result = await db
      .insert(triageSessions)
      .values({
        ...sessionData,
        status: sessionData.status || "pending",
      })
      .returning();
    return result[0];
  }

  static async findSessionById(id) {
    const result = await db
      .select()
      .from(triageSessions)
      .where(eq(triageSessions.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  static async updateSession(id, updateData) {
    const result = await db
      .update(triageSessions)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(triageSessions.id, id))
      .returning();
    return result[0];
  }

  static async createResponse(responseData) {
    const result = await db
      .insert(triageResponses)
      .values(responseData)
      .returning();
    return result[0];
  }

  static async findResponseBySessionId(triageSessionId) {
    const result = await db
      .select()
      .from(triageResponses)
      .where(eq(triageResponses.triageSessionId, triageSessionId))
      .limit(1);
    return result[0] ?? null;
  }

  static async createMessage(messageData) {
    const result = await db
      .insert(triageMessages)
      .values(messageData)
      .returning();
    return result[0];
  }

  static async findMessagesBySessionId(triageSessionId) {
    return db
      .select()
      .from(triageMessages)
      .where(eq(triageMessages.triageSessionId, triageSessionId))
      .orderBy(asc(triageMessages.createdAt));
  }

  static async deleteSession(id, patientId) {
    const result = await db
      .delete(triageSessions)
      .where(and(eq(triageSessions.id, id), eq(triageSessions.patientId, patientId)))
      .returning();
    return result[0] ?? null;
  }

  static async findHistoryByPatientId(patientId, limitCount = 50) {
    const assignedDoctorUser = alias(users, "assigned_doctor_user");
    const assignedDoctorProfile = alias(doctorProfiles, "assigned_doctor_profile");

    return db
      .select({
        id: triageSessions.id,
        summaryTitle: triageSessions.summaryTitle,
        summaryDescription: triageSessions.summaryDescription,
        urgencyScore: triageSessions.urgencyScore,
        urgencyLevel: triageSessions.urgencyLevel,
        recommendedSpecialty: triageSessions.recommendedSpecialty,
        createdAt: triageSessions.createdAt,
        status: triageSessions.status,
        assignedDoctorId: triageSessions.assignedDoctorId,
        assignedDoctorName: assignedDoctorUser.name,
        assignedDoctorSpecialization: assignedDoctorProfile.specialization,
      })
      .from(triageSessions)
      .leftJoin(assignedDoctorUser, eq(assignedDoctorUser.id, triageSessions.assignedDoctorId))
      .leftJoin(assignedDoctorProfile, eq(assignedDoctorProfile.userId, triageSessions.assignedDoctorId))
      .where(eq(triageSessions.patientId, patientId))
      .orderBy(desc(triageSessions.createdAt))
      .limit(limitCount);
  }
}

