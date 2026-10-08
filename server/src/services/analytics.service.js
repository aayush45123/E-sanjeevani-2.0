import { AnalyticsRepository } from "../repositories/analytics.repository.js";

export class AnalyticsService {
  static async getDoctorAnalytics(doctorId, { range = 30 } = {}) {
    const days = Number(range) === 7 ? 7 : 30;
    const now = new Date();

    const [
      basicStats,
      trendRows,
      modalityRows,
      peakHoursRows,
      demographicsRows,
      followUps,
      triageData,
      diseaseData,
      rxData,
      summaryCards,
    ] = await Promise.all([
      AnalyticsRepository.getBasicStats(doctorId),
      AnalyticsRepository.getTrendRows(doctorId, days),
      AnalyticsRepository.getModalityRows(doctorId),
      AnalyticsRepository.getPeakHoursRows(doctorId),
      AnalyticsRepository.getDemographicsRows(doctorId),
      AnalyticsRepository.getFollowUps(doctorId),
      AnalyticsRepository.getTriageAnalytics(doctorId),
      AnalyticsRepository.getDiseaseAnalytics(doctorId),
      AnalyticsRepository.getPrescriptionAnalytics(doctorId),
      AnalyticsRepository.getSummaryCards(doctorId),
    ]);

    const stats = basicStats || {
      total: 0,
      completed: 0,
      cancelled: 0,
      ongoing: 0,
      scheduled: 0,
      todayConsultations: 0,
      thisWeekConsultations: 0,
      thisMonthConsultations: 0,
    };

    const modalities = modalityRows.map((d) => ({
      name: d.type ? d.type.charAt(0).toUpperCase() + d.type.slice(1) : "Other",
      value: d.value,
    }));

    const peakHours = peakHoursRows.map((d) => ({
      hour: `${d.hour}:00`,
      consultations: d.count,
    }));

    // Build day-by-day continuous timeline
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const found = trendRows.find((t) => t.date === dateStr);
      trend.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: found ? found.count : 0,
        completed: found ? found.completed : 0,
        cancelled: found ? found.cancelled : 0,
      });
    }

    let retention = { new: 0, returning: 0, firstTime: 0 };
    let genderDistribution = { male: 0, female: 0, other: 0 };
    let ageDistribution = { under18: 0, "18to35": 0, "36to50": 0, "51plus": 0 };

    demographicsRows.forEach((p) => {
      if (p.consultationCount === 1) {
        retention.new++;
        retention.firstTime++;
      } else if (p.consultationCount > 1) {
        retention.returning++;
      }

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

    return {
      stats,
      trend,
      modalities,
      peakHours,
      demographics,
      retention,
      followUps,
      triage: triageData,
      diseases: diseaseData,
      prescriptions: rxData,
      summaryCards,
    };
  }

  static async getFollowUps(doctorId) {
    return AnalyticsRepository.getFollowUps(doctorId);
  }

  static async updateFollowUpStatus(doctorId, consultationId, status) {
    if (!consultationId || !status) {
      throw { status: 400, message: "consultationId and status are required" };
    }
    return AnalyticsRepository.updateFollowUpStatus(
      doctorId,
      consultationId,
      status,
    );
  }

  static async getDoctorOverview(doctorId) {
    return AnalyticsRepository.getSummaryCards(doctorId);
  }
}
