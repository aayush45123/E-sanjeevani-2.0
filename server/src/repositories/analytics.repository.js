import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { consultations, patientProfiles } from "../database/schema/index.js";

export class AnalyticsRepository {
  static async getBasicStats(doctorId) {
    const result = await db
      .select({
        total: sql`count(*)`.mapWith(Number),
        completed:
          sql`count(*) filter (where ${consultations.status} = 'completed')`.mapWith(
            Number,
          ),
        cancelled:
          sql`count(*) filter (where ${consultations.status} = 'cancelled')`.mapWith(
            Number,
          ),
        ongoing:
          sql`count(*) filter (where ${consultations.status} = 'ongoing')`.mapWith(
            Number,
          ),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));
    return result[0];
  }

  static async getTrendRows(doctorId, thirtyDaysAgo) {
    return db
      .select({
        date: sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD')`.as("date"),
        count: sql`count(*)`.mapWith(Number),
        completed:
          sql`count(*) filter (where ${consultations.status} = 'completed')`.mapWith(
            Number,
          ),
      })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          gte(consultations.consultationDate, thirtyDaysAgo),
        ),
      )
      .groupBy(sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD') asc`);
  }

  static async getModalityRows(doctorId) {
    return db
      .select({
        type: consultations.consultationType,
        value: sql`count(*)`.mapWith(Number),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(consultations.consultationType);
  }

  static async getPeakHoursRows(doctorId) {
    return db
      .select({
        hour: sql`substr(${consultations.startTime}, 1, 2)`.as("hour"),
        count: sql`count(*)`.mapWith(Number),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(sql`substr(${consultations.startTime}, 1, 2)`)
      .orderBy(sql`substr(${consultations.startTime}, 1, 2) asc`);
  }

  static async getDemographicsRows(doctorId) {
    return db
      .select({
        patientId: consultations.patientId,
        consultationCount: sql`count(*)`.mapWith(Number),
        gender: patientProfiles.gender,
        age: patientProfiles.age,
      })
      .from(consultations)
      .leftJoin(patientProfiles, eq(patientProfiles.userId, consultations.patientId))
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(
        consultations.patientId,
        patientProfiles.gender,
        patientProfiles.age,
      );
  }
}
