import { AnalyticsRepository } from "../repositories/analytics.repository.js";

export class AnalyticsService {
  static async getDoctorAnalytics(doctorId) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const basicStats = await AnalyticsRepository.getBasicStats(doctorId);
    const stats = basicStats || {
      total: 0,
      completed: 0,
      cancelled: 0,
      ongoing: 0,
    };

    const trendRows = await AnalyticsRepository.getTrendRows(doctorId, thirtyDaysAgo);
    const modalityRows = await AnalyticsRepository.getModalityRows(doctorId);

    const modalities = modalityRows.map((d) => ({
      name: d.type.charAt(0).toUpperCase() + d.type.slice(1),
      value: d.value,
    }));

    const peakHoursRows = await AnalyticsRepository.getPeakHoursRows(doctorId);
    const peakHours = peakHoursRows.map((d) => ({
      hour: `${d.hour}:00`,
      consultations: d.count,
    }));

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

    const demographicsRows = await AnalyticsRepository.getDemographicsRows(doctorId);

    let retention = { new: 0, returning: 0 };
    let genderDistribution = { male: 0, female: 0, other: 0 };
    let ageDistribution = { under18: 0, "18to35": 0, "36to50": 0, "51plus": 0 };

    demographicsRows.forEach((p) => {
      if (p.consultationCount === 1) retention.new++;
      else if (p.consultationCount > 1) retention.returning++;

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
      trend: last30Days,
      modalities,
      peakHours,
      demographics,
      retention,
    };
  }
}
