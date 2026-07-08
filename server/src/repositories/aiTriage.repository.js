import { desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { aiTriageChats } from "../database/schema/index.js";

export class AiTriageRepository {
  static async createChat(chatData) {
    const result = await db
      .insert(aiTriageChats)
      .values(chatData)
      .returning();
    return result[0];
  }

  static async findLatestByUserId(userId) {
    const result = await db
      .select()
      .from(aiTriageChats)
      .where(eq(aiTriageChats.userId, userId))
      .orderBy(desc(aiTriageChats.createdAt))
      .limit(1);
    return result[0] ?? null;
  }
}
