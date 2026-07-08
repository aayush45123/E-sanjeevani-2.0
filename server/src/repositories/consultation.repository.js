import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { consultations, users, doctorProfiles } from "../database/schema/index.js";

export class ConsultationRepository {
  static async findById(id) {
    const result = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  static async findDoctorConsultations(doctorId) {
    return db
      .select({
        consultation: consultations,
        patient: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.patientId, users.id))
      .where(eq(consultations.doctorId, doctorId))
      .orderBy(asc(consultations.consultationDate), asc(consultations.startTime));
  }

  static async findPatientConsultations(patientId) {
    return db
      .select({
        consultation: consultations,
        doctor: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        doctorProfile: doctorProfiles,
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.doctorId, users.id))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, consultations.doctorId))
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate));
  }

  static async create(tx, data) {
    const result = await (tx || db)
      .insert(consultations)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  static async lockConsultationForUpdate(tx, consultationId) {
    const lockedResult = await tx.execute(sql`
      SELECT *
      FROM consultations
      WHERE id = ${consultationId}
      FOR UPDATE
    `);
    return lockedResult.rows[0] ?? null;
  }

  static async updateStatus(tx, consultationId, status) {
    const result = await (tx || db)
      .update(consultations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();
    return result[0];
  }

  static async updateNotes(consultationId, doctorId, updates) {
    const result = await db
      .update(consultations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.doctorId, doctorId),
        ),
      )
      .returning();
    return result[0];
  }

  static async findPatientDetailsForConsultation(consultationId) {
    return db
      .select({
        consultation: consultations,
        patient: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.patientId, users.id))
      .where(eq(consultations.id, consultationId))
      .limit(1);
  }

  static async updateJoinStatus(consultationId, updates) {
    const result = await db
      .update(consultations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();
    return result[0];
  }
}
