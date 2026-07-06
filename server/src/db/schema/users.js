import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums.js";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    })
      .notNull()
      .unique(),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    phone: varchar("phone", {
      length: 30,
    }),

    role: userRoleEnum("role").default("patient").notNull(),

    profileImage: varchar("profile_image", {
      length: 2048,
    }),

    isVerified: boolean("is_verified").default(false).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [index("users_role_idx").on(table.role)],
);
