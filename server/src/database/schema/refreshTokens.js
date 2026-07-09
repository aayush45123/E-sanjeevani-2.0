import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Store only a hash of the refresh token (raw token lives only in httpOnly cookie)
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),

    // Used to enforce rotation
    rotatedFromHash: varchar("rotated_from_hash", { length: 255 }),

    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => [
    index("refresh_tokens_user_idx").on(table.userId),
    index("refresh_tokens_expires_idx").on(table.expiresAt),
  ],
);

