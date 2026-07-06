import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import { consultations, patientProfiles } from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Get advanced analytics for the authenticated doctor
 * Uses Postgres aggregate queries (via Drizzle's sql`` helper) for high performance
 */
export const getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.user.id; // adjust to match your auth middleware (e.g. req.user.id)

    // Date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 1. Basic Stats (Total, Completed, Cancelled, Ongoing)
    const [basicStats] = await db
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

    const stats = basicStats || {
      total: 0,
      completed: 0,
      cancelled: 0,
      ongoing: 0,
    };

    // 2. Trend (Last 30 days)
    const trendRows = await db
      .select({
        date: sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD')`.as(
          "date",
        ),
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
      .orderBy(
        sql`to_char(${consultations.consultationDate}, 'YYYY-MM-DD') asc`,
      );

    // 3. Modality Distribution (Video vs Call vs Chat)
    const modalityRows = await db
      .select({
        type: consultations.consultationType,
        value: sql`count(*)`.mapWith(Number),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(consultations.consultationType);

    // Formulate clean modality array for recharts
    const modalities = modalityRows.map((d) => ({
      name: d.type.charAt(0).toUpperCase() + d.type.slice(1),
      value: d.value,
    }));

    // 4. Peak Hours (Grouping by startTime)
    const peakHoursRows = await db
      .select({
        hour: sql`substr(${consultations.startTime}, 1, 2)`.as("hour"), // Extract "09" from "09:30"
        count: sql`count(*)`.mapWith(Number),
      })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(sql`substr(${consultations.startTime}, 1, 2)`)
      .orderBy(sql`substr(${consultations.startTime}, 1, 2) asc`);

    // Format peak hours
    const peakHours = peakHoursRows.map((d) => ({
      hour: `${d.hour}:00`,
      consultations: d.count,
    }));

    // Generate continuous 30 day array to fill gaps
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const found = trendRows.find((t) => t.date === dateStr);
      last30Days.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: found ? found.count : 0,
        completed: found ? found.completed : 0,
      });
    }

    // 5. Patient Demographics & Retention
    // Group by patient, count their consultations with this doctor, then bring in
    // their profile (gender/age) via a left join on patient_profiles.
    const demographicsRows = await db
      .select({
        patientId: consultations.patientId,
        consultationCount: sql`count(*)`.mapWith(Number),
        gender: patientProfiles.gender,
        age: patientProfiles.age,
      })
      .from(consultations)
      .leftJoin(
        patientProfiles,
        eq(patientProfiles.userId, consultations.patientId),
      )
      .where(eq(consultations.doctorId, doctorId))
      .groupBy(
        consultations.patientId,
        patientProfiles.gender,
        patientProfiles.age,
      );

    let retention = { new: 0, returning: 0 };
    let genderDistribution = { male: 0, female: 0, other: 0 };
    let ageDistribution = { under18: 0, "18to35": 0, "36to50": 0, "51plus": 0 };

    demographicsRows.forEach((p) => {
      // Retention
      if (p.consultationCount === 1) retention.new++;
      else if (p.consultationCount > 1) retention.returning++;

      // Demographics
      if (p.gender) {
        const gender = p.gender.toLowerCase();
        if (gender === "male") genderDistribution.male++;
        else if (gender === "female") genderDistribution.female++;
        else genderDistribution.other++;
      }

      const age = p.age;
      if (age !== null && age !== undefined) {
        if (age < 18) ageDistribution.under18++;
        else if (age >= 18 && age <= 35) ageDistribution["18to35"]++;
        else if (age >= 36 && age <= 50) ageDistribution["36to50"]++;
        else if (age >= 51) ageDistribution["51plus"]++;
      }
    });

    const demographics = {
      gender: [
        { name: "Male", value: genderDistribution.male },
        { name: "Female", value: genderDistribution.female },
        { name: "Other", value: genderDistribution.other },
      ],
      age: [
        { name: "< 18", value: ageDistribution.under18 },
        { name: "18-35", value: ageDistribution["18to35"] },
        { name: "36-50", value: ageDistribution["36to50"] },
        { name: "51+", value: ageDistribution["51plus"] },
      ],
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        trend: last30Days,
        modalities,
        peakHours,
        demographics,
        retention,
      },
    });
  } catch (err) {
    next(err);
  }
};
