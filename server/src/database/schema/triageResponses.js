import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { triageSessions } from "./triageSessions.js";

import { urgencyLevelEnum } from "./enums.js";

export const triageResponses = pgTable(
  "triage_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    triageSessionId: uuid("triage_session_id")
      .notNull()
      .references(() => triageSessions.id, {
        onDelete: "cascade",
      }),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    symptoms: jsonb("symptoms").default([]).notNull(),

    preliminaryAssessment: text("preliminary_assessment"),

    possibleConditions: jsonb("possible_conditions").default([]).notNull(),

    recommendedTests: text("recommended_tests").array().default([]),

    recommendedSpecialties: text("recommended_specialties").array().default([]),

    urgencyScore: integer("urgency_score").notNull(),

    urgencyLevel: urgencyLevelEnum("urgency_level").notNull(),

    immediateRecommendations: text("immediate_recommendations")
      .array()
      .default([]),

    lifeStyleAdvice: text("lifestyle_advice").array().default([]),

    aiNotes: text("ai_notes"),

    shouldAutoMatchDoctor: boolean("should_auto_match_doctor")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("triage_responses_session_unique").on(table.triageSessionId),

    index("triage_responses_patient_idx").on(table.patientId),

    index("triage_responses_urgency_idx").on(table.urgencyLevel),
  ],
);
