import { eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { patientProfiles } from "../database/schema/index.js";

export class PatientProfileRepository {
  static async findByUserId(userId) {
    const result = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }

  static async create(profileData) {
    const result = await db
      .insert(patientProfiles)
      .values(profileData)
      .returning();
    return result[0];
  }

  static async update(userId, updates) {
    const result = await db
      .update(patientProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.userId, userId))
      .returning();
    return result[0];
  }
}
