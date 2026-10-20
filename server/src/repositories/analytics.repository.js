import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  consultations,
  patientProfiles,
  users,
  prescriptions,
  prescriptionItems,
  aiTriageChats,
} from "../database/schema/index.js";

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
        scheduled:
          sql`count(*) filter (where ${consultations.status} = 'scheduled')`.mapWith(
            Number,
          ),
        todayConsultations:
          sql`count(*) filter (where to_char(${consultations.consultationDate}, 'YYYY-MM-DD') = to_char(current_date, 'YYYY-MM-DD'))`.mapWith(
            Number,
          ),
        thisWeekConsultations:
          sql`count(*) filter (where ${consultations.consultationDate} >= date_trunc('week', current_date))`.mapWith(
            Number,
          ),
        thisMonthConsultations:
          sql`count(*) filter (where ${consultations.consultationDate} >= date_trunc('month', current_date))`.mapWith(
            Number,
          ),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));
    return result[0];
  }

  static async getTrendRows(doctorId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select({
        date: sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD')`.as("date"),
        count: sql`count(*)`.mapWith(Number),
        completed:
          sql`count(*) filter (where ${consultations.status} = 'completed')`.mapWith(
            Number,
          ),
        cancelled:
          sql`count(*) filter (where ${consultations.status} = 'cancelled')`.mapWith(
            Number,
          ),
      })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          gte(consultations.consultationDate, startDate),
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

  /**
   * FOLLOW-UPS REQUIRED
   * Returns follow-ups scheduled or required for this doctor.
   */
  static async getFollowUps(doctorId) {
    const rows = await db
      .select({
        consultationId: consultations.id,
        patientId: consultations.patientId,
        patientName: users.name,
        patientEmail: users.email,
        patientPhone: users.phone,
        consultationDate: consultations.consultationDate,
        consultationType: consultations.consultationType,
        currentProblem: consultations.currentProblem,
        doctorNotes: consultations.doctorNotes,
        followUpRequired: consultations.followUpRequired,
        followUpDate: consultations.followUpDate,
        followUpStatus: consultations.followUpStatus,
        rxDiagnosis: prescriptions.diagnosis,
        rxFollowUpDays: prescriptions.followUpDays,
        rxFollowUpInstructions: prescriptions.followUpInstructions,
      })
      .from(consultations)
      .innerJoin(users, eq(users.id, consultations.patientId))
      .leftJoin(prescriptions, eq(prescriptions.consultationId, consultations.id))
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          sql`(${consultations.followUpRequired} = true OR ${prescriptions.followUpRequired} = true OR ${consultations.followUpDate} IS NOT NULL)`,
        ),
      )
      .orderBy(desc(consultations.consultationDate))
      .limit(50);

    const todayStr = new Date().toISOString().split("T")[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split("T")[0];

    return rows.map((r) => {
      let resolvedFollowUpDate = r.followUpDate;
      if (!resolvedFollowUpDate && r.consultationDate) {
        const cDate = new Date(r.consultationDate);
        const daysToAdd = r.rxFollowUpDays || 7;
        cDate.setDate(cDate.getDate() + daysToAdd);
        resolvedFollowUpDate = cDate;
      }

      const fDateStr = resolvedFollowUpDate
        ? new Date(resolvedFollowUpDate).toISOString().split("T")[0]
        : null;

      let status = r.followUpStatus || "due";
      if (status !== "completed" && status !== "cancelled") {
        if (!fDateStr) {
          status = "scheduled";
        } else if (fDateStr < todayStr) {
          status = "overdue";
        } else if (fDateStr === todayStr) {
          status = "due_today";
        } else if (fDateStr <= threeDaysStr) {
          status = "due_soon";
        } else {
          status = "scheduled";
        }
      }

      let priority = "normal";
      if (status === "overdue" || status === "due_today") {
        priority = "high";
      } else if (status === "due_soon") {
        priority = "medium";
      }

      return {
        id: r.consultationId,
        consultationId: r.consultationId,
        patientId: r.patientId,
        patientName: r.patientName,
        patientEmail: r.patientEmail,
        patientPhone: r.patientPhone,
        lastConsultationDate: r.consultationDate,
        followUpDate: resolvedFollowUpDate,
        reason: r.rxDiagnosis || r.currentProblem || "Follow-up review",
        instructions: r.rxFollowUpInstructions || r.doctorNotes || "",
        consultationType: r.consultationType,
        status,
        priority,
      };
    });
  }

  /**
   * UPDATE FOLLOW-UP STATUS
   */
  static async updateFollowUpStatus(doctorId, consultationId, status) {
    const updated = await db
      .update(consultations)
      .set({
        followUpStatus: status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.doctorId, doctorId),
        ),
      )
      .returning();
    return updated[0] || null;
  }

  /**
   * TRIAGE / URGENCY ANALYTICS
   * Urgency distribution scored for consultations conducted with this doctor
   */
  static async getTriageAnalytics(doctorId) {
    const doctorConsultations = await db
      .select({
        id: consultations.id,
        patientId: consultations.patientId,
        createdAt: consultations.createdAt,
        consultationDate: consultations.consultationDate,
        symptoms: consultations.symptoms,
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));

    if (doctorConsultations.length === 0) {
      return {
        distribution: [
          { name: "Critical / Urgent", count: 0, level: "critical" },
          { name: "Moderate", count: 0, level: "moderate" },
          { name: "Low", count: 0, level: "low" },
        ],
        urgentPatients: [],
      };
    }

    const patientIds = [
      ...new Set(doctorConsultations.map((c) => c.patientId)),
    ];

    const triageChats = await db
      .select({
        id: aiTriageChats.id,
        userId: aiTriageChats.userId,
        urgency: aiTriageChats.urgency,
        predictedDisease: aiTriageChats.predictedDisease,
        symptoms: aiTriageChats.symptoms,
        createdAt: aiTriageChats.createdAt,
      })
      .from(aiTriageChats)
      .where(inArray(aiTriageChats.userId, patientIds))
      .orderBy(desc(aiTriageChats.createdAt));

    let criticalCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    const urgentConsultations = [];

    doctorConsultations.forEach((consult) => {
      const patientChats = triageChats.filter(
        (ch) => ch.userId === consult.patientId,
      );
      let matchedChat = null;

      if (patientChats.length > 0) {
        const consultTime = new Date(
          consult.createdAt || consult.consultationDate,
        ).getTime();
        let minDiff = Infinity;
        for (const ch of patientChats) {
          const chTime = new Date(ch.createdAt).getTime();
          const diff = Math.abs(consultTime - chTime);
          if (diff < minDiff) {
            minDiff = diff;
            matchedChat = ch;
          }
        }
      }

      const urgencyStr = String(matchedChat?.urgency || "low").toLowerCase();
      if (
        urgencyStr.includes("crit") ||
        urgencyStr.includes("urg") ||
        urgencyStr.includes("high")
      ) {
        criticalCount++;
        urgentConsultations.push({
          consultationId: consult.id,
          patientId: consult.patientId,
          matchedChat,
        });
      } else if (urgencyStr.includes("mod")) {
        moderateCount++;
      } else {
        lowCount++;
      }
    });

    let urgentPatients = [];
    if (urgentConsultations.length > 0) {
      const urgentPatientIds = [
        ...new Set(urgentConsultations.map((u) => u.patientId)),
      ];
      const patientRows = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(inArray(users.id, urgentPatientIds));

      const patientNameMap = new Map(patientRows.map((p) => [p.id, p.name]));
      urgentPatients = urgentConsultations.map((u) => ({
        id: u.consultationId,
        patientName: patientNameMap.get(u.patientId) || "Patient",
        symptoms: u.matchedChat?.symptoms || "",
        predictedDisease: u.matchedChat?.predictedDisease || "",
        urgency: u.matchedChat?.urgency || "Critical",
        date: u.matchedChat?.createdAt,
      }));
    }

    return {
      distribution: [
        { name: "Critical / Urgent", count: criticalCount, level: "critical" },
        { name: "Moderate", count: moderateCount, level: "moderate" },
        { name: "Low", count: lowCount, level: "low" },
      ],
      urgentPatients,
    };
  }

  /**
   * DISEASE / CONDITION DISTRIBUTION
   * Clearly separates Diagnosed Conditions (doctor verified) vs AI-Predicted Conditions
   * Scoped to consultations conducted by this doctor
   */
  static async getDiseaseAnalytics(doctorId) {
    // 1. Diagnosed Conditions (from prescriptions issued by doctor, normalized for title case)
    const rawDiagnoses = await db
      .select({
        diagnosis: prescriptions.diagnosis,
      })
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.doctorId, doctorId),
          sql`${prescriptions.diagnosis} IS NOT NULL AND TRIM(${prescriptions.diagnosis}) != ''`,
        ),
      );

    const diagMap = {};
    rawDiagnoses.forEach((d) => {
      const clean = d.diagnosis
        .trim()
        .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
      diagMap[clean] = (diagMap[clean] || 0) + 1;
    });

    const diagnosedConditions = Object.entries(diagMap)
      .map(([name, count]) => ({
        name,
        count,
        category: "Confirmed Clinical Diagnosis",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 2. AI-Predicted Conditions (scoped to consultations conducted with this doctor)
    const doctorConsultations = await db
      .select({
        id: consultations.id,
        patientId: consultations.patientId,
        createdAt: consultations.createdAt,
        consultationDate: consultations.consultationDate,
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));

    const patientIds = [
      ...new Set(doctorConsultations.map((c) => c.patientId)),
    ];

    const conditionCounts = {};
    if (patientIds.length > 0) {
      const triageChats = await db
        .select({
          userId: aiTriageChats.userId,
          predictedDisease: aiTriageChats.predictedDisease,
          createdAt: aiTriageChats.createdAt,
        })
        .from(aiTriageChats)
        .where(inArray(aiTriageChats.userId, patientIds))
        .orderBy(desc(aiTriageChats.createdAt));

      doctorConsultations.forEach((consult) => {
        const patientChats = triageChats.filter(
          (ch) => ch.userId === consult.patientId,
        );
        let matchedChat = null;
        if (patientChats.length > 0) {
          const consultTime = new Date(
            consult.createdAt || consult.consultationDate,
          ).getTime();
          let minDiff = Infinity;
          for (const ch of patientChats) {
            const diff = Math.abs(consultTime - new Date(ch.createdAt).getTime());
            if (diff < minDiff) {
              minDiff = diff;
              matchedChat = ch;
            }
          }
        }
        if (matchedChat && matchedChat.predictedDisease) {
          const raw = matchedChat.predictedDisease.trim();
          const clean = raw
            .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
          conditionCounts[clean] = (conditionCounts[clean] || 0) + 1;
        }
      });
    }

    const predictedConditions = Object.entries(conditionCounts)
      .map(([name, count]) => ({
        name,
        count,
        category: "AI Triage Prediction",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      diagnosedConditions,
      predictedConditions,
    };
  }

  /**
   * PRESCRIPTION / MEDICATION ANALYTICS
   */
  static async getPrescriptionAnalytics(doctorId) {
    const rxStats = await db
      .select({
        total: sql`count(*)`.mapWith(Number),
        finalized:
          sql`count(*) filter (where ${prescriptions.status} = 'finalized')`.mapWith(
            Number,
          ),
        amended:
          sql`count(*) filter (where ${prescriptions.status} = 'amended')`.mapWith(
            Number,
          ),
        draft:
          sql`count(*) filter (where ${prescriptions.status} = 'draft')`.mapWith(
            Number,
          ),
      })
      .from(prescriptions)
      .where(eq(prescriptions.doctorId, doctorId));

    // Medication item statuses
    const itemStats = await db
      .select({
        discontinuedCount:
          sql`count(*) filter (where ${prescriptionItems.status} = 'discontinued')`.mapWith(
            Number,
          ),
        activeCount:
          sql`count(*) filter (where ${prescriptionItems.status} = 'active')`.mapWith(
            Number,
          ),
        completedCount:
          sql`count(*) filter (where ${prescriptionItems.status} = 'completed')`.mapWith(
            Number,
          ),
      })
      .from(prescriptionItems)
      .innerJoin(
        prescriptions,
        eq(prescriptionItems.prescriptionId, prescriptions.id),
      )
      .where(eq(prescriptions.doctorId, doctorId));

    return {
      prescriptions: {
        total: rxStats[0]?.total || 0,
        active: rxStats[0]?.finalized || 0,
        amended: rxStats[0]?.amended || 0,
        draft: rxStats[0]?.draft || 0,
      },
      medications: {
        active: itemStats[0]?.activeCount || 0,
        completed: itemStats[0]?.completedCount || 0,
        discontinued: itemStats[0]?.discontinuedCount || 0,
      },
    };
  }

  /**
   * COMPREHENSIVE SUMMARY CARDS
   */
  static async getSummaryCards(doctorId) {
    const totalPatientsResult = await db
      .select({
        count: sql`count(distinct ${consultations.patientId})`.mapWith(Number),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));

    const basicStats = await this.getBasicStats(doctorId);
    const followUps = await this.getFollowUps(doctorId);
    const triageData = await this.getTriageAnalytics(doctorId);

    const followUpsDueCount = followUps.filter(
      (f) =>
        f.status === "due_today" ||
        f.status === "due_soon" ||
        f.status === "overdue",
    ).length;

    const urgentCount = triageData.urgentPatients.length;

    return {
      totalPatients: totalPatientsResult[0]?.count || 0,
      todayConsultations: basicStats?.todayConsultations || 0,
      thisWeekConsultations: basicStats?.thisWeekConsultations || 0,
      thisMonthConsultations: basicStats?.thisMonthConsultations || 0,
      completedToday: basicStats?.completed || 0,
      followUpsDue: followUpsDueCount,
      urgentPatients: urgentCount,
    };
  }
}
