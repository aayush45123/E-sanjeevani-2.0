import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";

/**
 * Get advanced analytics for the authenticated doctor
 * Uses MongoDB Aggregation Framework for high performance
 */
export const getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.user.userId);
    
    // Date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // 1. Basic Stats (Total, Completed, Cancelled)
    const basicStats = await Consultation.aggregate([
      { $match: { doctor: doctorId } },
      { 
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { 
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } 
          },
          cancelled: { 
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } 
          },
          ongoing: { 
            $sum: { $cond: [{ $eq: ["$status", "ongoing"] }, 1, 0] } 
          }
        }
      }
    ]);
    
    const stats = basicStats.length > 0 ? basicStats[0] : { total: 0, completed: 0, cancelled: 0, ongoing: 0 };
    
    // 2. Trend (Last 30 days)
    const trendData = await Consultation.aggregate([
      { 
        $match: { 
          doctor: doctorId,
          consultationDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$consultationDate" }
          },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // 3. Modality Distribution (Video vs Call vs Chat)
    const modalityData = await Consultation.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: "$consultationType",
          value: { $sum: 1 }
        }
      }
    ]);
    
    // Formulate clean modality array for recharts
    const modalities = modalityData.map(d => ({
      name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
      value: d.value
    }));
    
    // 4. Peak Hours (Grouping by startTime)
    const peakHoursData = await Consultation.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: { $substr: ["$startTime", 0, 2] }, // Extract "09" from "09:30"
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Format peak hours
    const peakHours = peakHoursData.map(d => ({
      hour: `${d._id}:00`,
      consultations: d.count
    }));

    // Generate continuous 30 day array to fill gaps
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const found = trendData.find(t => t._id === dateStr);
      last30Days.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: found ? found.count : 0,
        completed: found ? found.completed : 0
      });
    }

    // 5. Patient Demographics & Retention
    const demographicsData = await Consultation.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: "$patient", // Group by unique patients
          consultationCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "patientprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile"
        }
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
    ]);

    let retention = { new: 0, returning: 0 };
    let genderDistribution = { male: 0, female: 0, other: 0 };
    let ageDistribution = { under18: 0, "18to35": 0, "36to50": 0, "51plus": 0 };

    demographicsData.forEach(p => {
      // Retention
      if (p.consultationCount === 1) retention.new++;
      else if (p.consultationCount > 1) retention.returning++;

      // Demographics
      if (p.profile) {
        // Gender
        const gender = p.profile.gender ? p.profile.gender.toLowerCase() : null;
        if (gender === 'male') genderDistribution.male++;
        else if (gender === 'female') genderDistribution.female++;
        else if (gender) genderDistribution.other++;

        // Age
        const age = p.profile.age;
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
      ]
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        trend: last30Days,
        modalities,
        peakHours,
        demographics,
        retention
      }
    });


  } catch (err) {
    next(err);
  }
};
