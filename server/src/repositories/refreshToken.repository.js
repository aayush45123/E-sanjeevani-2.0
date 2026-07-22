import crypto from "crypto";

import { eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";
import { refreshTokens } from "../database/schema/index.js";

const hashToken = (rawToken) => {
  // Hash with sha256; only hash stored in DB
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

export class RefreshTokenRepository {
  static hashToken(rawToken) {
    return hashToken(rawToken);
  }

  static async create({ userId, tokenHash, rotatedFromHash, expiresAt }) {
    const [row] = await db
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash,
        rotatedFromHash,
        expiresAt,
      })
      .returning();

    return row;
  }

  static async findByHash(tokenHash) {
    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    return rows[0] || null;
  }

  static async revokeByHash(tokenHash) {
    const now = new Date();
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: now,
      })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  /**
   * Revoke ALL active refresh tokens for a user.
   * Called at login to invalidate any previous session (including sessions
   * from a different account that shared the same browser cookie).
   */
  static async revokeAllForUser(userId) {
    const now = new Date();
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: now,
      })
      .where(eq(refreshTokens.userId, userId));
  }
}

