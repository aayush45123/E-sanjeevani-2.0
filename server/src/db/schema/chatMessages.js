import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { consultations } from "./consultations.js";
import { users } from "./users.js";

import { senderRoleEnum, messageTypeEnum } from "./enums.js";

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, {
        onDelete: "cascade",
      }),

    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    senderName: varchar("sender_name", {
      length: 255,
    }),

    senderRole: senderRoleEnum("sender_role"),

    text: text("text").notNull(),

    messageType: messageTypeEnum("message_type").default("text").notNull(),

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

  (table) => [
    index("chat_messages_consultation_created_idx").on(
      table.consultationId,
      table.createdAt,
    ),

    index("chat_messages_sender_idx").on(table.senderId),
  ],
);
