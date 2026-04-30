import mongoose from "mongoose"; // ✅ ADDED — was missing, caused crash in getConsultationStats
import Consultation from "../models/Consultation.js";
import User from "../models/User.js";

// Get all consultations for a patient
export const getPatientConsultations = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = { patient: req.user.id };
    if (status) query.status = status;

    const consultations = await Consultation.find(query)
      .populate("doctor", "name specialization profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Consultation.countDocuments(query);

    res.json({
      success: true,
      consultations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultations",
      error: error.message,
    });
  }
};

// Get consultation details
export const getConsultationDetail = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate("patient", "name email phone")
      .populate(
        "doctor",
        "name specialization qualification experience profileImage",
      );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Check if user has access to this consultation
    if (
      consultation.patient._id.toString() !== req.user.id &&
      consultation.doctor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultation details",
      error: error.message,
    });
  }
};

// Get available doctors
export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      role: "doctor",
    };

    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    const doctors = await User.find(query)
      .select(
        "name specialization qualification experience profileImage averageRating totalConsultations",
      )
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      doctors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
};

// Get doctor details with reviews
export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findById(doctorId).select(
      "name specialization qualification experience profileImage averageRating totalConsultations bio",
    );

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get recent consultations for ratings/feedback
    const recentConsultations = await Consultation.find({
      doctor: doctorId,
      status: "completed",
      "rating.score": { $exists: true },
    })
      .select("rating createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        recentRatings: recentConsultations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message,
    });
  }
};

// Create new consultation booking
export const createConsultation = async (req, res) => {
  try {
    const {
      doctorId,
      symptoms,
      urgencyScore,
      consultationType,
      scheduledTime,
    } = req.body;

    // Validate doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const consultation = new Consultation({
      patient: req.user.id,
      doctor: doctorId,
      symptoms,
      urgencyScore,
      consultationType,
      startTime: scheduledTime,
      status: "scheduled",
    });

    await consultation.save();
    await consultation.populate("doctor", "name specialization");

    res.status(201).json({
      success: true,
      message: "Consultation booked successfully",
      consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create consultation",
      error: error.message,
    });
  }
};

// Update consultation (cancel, complete, add rating)
export const updateConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status, diagnosis, prescription, notes, rating, feedback } =
      req.body;

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Check authorization
    if (consultation.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this consultation",
      });
    }

    if (status) consultation.status = status;
    if (diagnosis) consultation.diagnosis = diagnosis;
    if (prescription) consultation.prescription = prescription;
    if (notes) consultation.notes = notes;
    if (rating && feedback) {
      consultation.rating = { score: rating, feedback };
    }

    if (consultation.endTime && consultation.startTime) {
      consultation.duration = Math.round(
        (consultation.endTime - consultation.startTime) / 60000,
      );
    }

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation updated successfully",
      consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update consultation",
      error: error.message,
    });
  }
};

// Cancel consultation
export const cancelConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { reason } = req.body;

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    if (consultation.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (consultation.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Can only cancel scheduled consultations",
      });
    }

    consultation.status = "cancelled";
    consultation.notes = `Cancelled: ${reason || "No reason provided"}`;
    await consultation.save();

    res.json({
      success: true,
      message: "Consultation cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel consultation",
      error: error.message,
    });
  }
};

// Get consultation statistics
export const getConsultationStats = async (req, res) => {
  try {
    const totalConsultations = await Consultation.countDocuments({
      patient: req.user.id,
    });

    const completedConsultations = await Consultation.countDocuments({
      patient: req.user.id,
      status: "completed",
    });

    const upcomingConsultations = await Consultation.countDocuments({
      patient: req.user.id,
      status: "scheduled",
      startTime: { $gte: new Date() },
    });

    // ✅ FIXED: mongoose is now imported at the top so this works
    const avgRating = await Consultation.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(req.user.id), // ✅ also fixed: new keyword required in Mongoose 7+
          "rating.score": { $exists: true },
        },
      },
      { $group: { _id: null, avgScore: { $avg: "$rating.score" } } },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalConsultations,
        completed: completedConsultations,
        upcoming: upcomingConsultations,
        averageRating: avgRating[0]?.avgScore || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};
