import { eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { users } from "../database/schema/index.js";

export class UserRepository {
  static async findById(id) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  static async findByEmail(email) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] ?? null;
  }

  static async create(userData) {
    const result = await db
      .insert(users)
      .values(userData)
      .returning();
    return result[0];
  }

  static async update(id, updateData) {
    const result = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}
