import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import DoctorProfile from "../models/DoctorProfile.js";
import User from "../models/User.js";
import { sendAppointmentEmail } from "../utils/sendAppointmentEmail.js";
import { sendMeetingWaitingEmail } from "../utils/sendMeetingWaitingEmail.js";
import { io } from "../server.js";

const SLOT_DURATION_MINUTES = 30;

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

const buildSlots = (startTime, endTime) => {
  const slots = [];
  if (!startTime || !endTime) return slots;

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const current = new Date(2000, 0, 1, startHour, startMinute, 0, 0);
  const end = new Date(2000, 0, 1, endHour, endMinute, 0, 0);

  const formatTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  while (current < end) {
    const next = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);
    if (next > end) break;

    slots.push({
      startTime: formatTime(current),
      endTime: formatTime(next),
      isBooked: false,
      bookedBy: null,
      consultationId: null,
    });

    current.setTime(next.getTime());
  }

  return slots;
};

const getFallbackSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile || !Array.isArray(profile.workingDays)) return [];
  if (!profile.workingDays.includes(getDayName(date))) return [];
  return buildSlots(profile.startTime, profile.endTime);
};

const findAvailabilityForDay = async (doctorId, dateOnly) => {
  const nextDate = new Date(dateOnly);
  nextDate.setDate(nextDate.getDate() + 1);

  return DoctorAvailability.findOne({
    doctor: doctorId,
    availableDate: { $gte: dateOnly, $lt: nextDate },
    isActive: true,
  });
};

/*
==================================================
GET AVAILABLE DOCTORS
✅ FIX: aggregation joins DoctorProfile so specialization,
qualification, experience come from DoctorProfile.
✅ FIX: doctors without a DoctorProfile still appear
(patients can see the doctor and filter will just show
no specialization for incomplete profiles).
==================================================
*/
export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const matchStage = {
      $match: {
        role: { $regex: "^doctor$", $options: "i" },
      },
    };

    const pipeline = [
      matchStage,
      {
        $lookup: {
          from: "doctorprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $addFields: {
          profileData: { $arrayElemAt: ["$profile", 0] },
        },
      },
      {
        $addFields: {
          // ✅ prefer DoctorProfile fields, fall back to User fields
          specialization: {
            $ifNull: ["$profileData.specialization", "$specialization"],
          },
          qualification: {
            $ifNull: ["$profileData.qualification", "$qualification"],
          },
          experience: {
            $ifNull: ["$profileData.experience", "$experience"],
          },
          hospitalName: "$profileData.hospitalName",
          consultationFee: "$profileData.consultationFee",
          consultationModes: "$profileData.consultationModes",
          aboutDoctor: "$profileData.aboutDoctor",
          shortBio: "$profileData.shortBio",
          // ✅ expose whether profile is fully completed
          profileCompleted: {
            $ifNull: ["$profileData.profileCompleted", false],
          },
        },
      },
    ];

    if (specialization) {
      pipeline.push({
        $match: {
          specialization: { $regex: specialization, $options: "i" },
        },
      });
    }

    pipeline.push(
      {
        $project: {
          password: 0,
          profile: 0,
          profileData: 0,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
    );

    const doctors = await User.aggregate(pipeline);

    // count pipeline
    const countPipeline = [matchStage];
    if (specialization) {
      countPipeline.push(
        {
          $lookup: {
            from: "doctorprofiles",
            localField: "_id",
            foreignField: "userId",
            as: "profile",
          },
        },
        {
          $addFields: {
            specialization: {
              $ifNull: [
                { $arrayElemAt: ["$profile.specialization", 0] },
                "$specialization",
              ],
            },
          },
        },
        {
          $match: {
            specialization: { $regex: specialization, $options: "i" },
          },
        },
      );
    }
    countPipeline.push({ $count: "total" });

    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      doctors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    console.error("getAvailableDoctors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTORS NEAR ME (LOCATION-BASED FILTERING)
==================================================
Filter doctors by proximity to patient's location
- Requires patient to have address with coordinates
- Returns doctors with clinic location within radius
- Default radius: 50km
*/
export const getDoctorsNearMe = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radiusKm = 50,
      specialization,
      limit = 10,
      page = 1,
    } = req.query;

    // Validate required location parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseInt(radiusKm, 10) * 1000; // Convert km to meters

    // Validate coordinates
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Query doctors with clinic location near patient
    const matchStage = {
      $match: {
        role: { $regex: "^doctor$", $options: "i" },
      },
    };

    const pipeline = [
      matchStage,
      {
        $lookup: {
          from: "doctorprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $addFields: {
          profileData: { $arrayElemAt: ["$profile", 0] },
        },
      },
      // Filter: only doctors with clinic and location data
      {
        $match: {
          "profileData.hasClinic": true,
          "profileData.clinicAddress.coordinates.coordinates": {
            $exists: true,
          },
        },
      },
      // Geospatial query: find docs within radius
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distanceFromPatient",
          maxDistance: radius,
          spherical: true,
        },
      },
      // Optional: filter by specialization
      ...(specialization
        ? [
            {
              $match: {
                "profileData.specialization": {
                  $regex: specialization,
                  $options: "i",
                },
              },
            },
          ]
        : []),
      // Add computed fields
      {
        $addFields: {
          specialization: {
            $ifNull: ["$profileData.specialization", "$specialization"],
          },
          qualification: {
            $ifNull: ["$profileData.qualification", "$qualification"],
          },
          experience: { $ifNull: ["$profileData.experience", "$experience"] },
          hospitalName: "$profileData.hospitalName",
          consultationFee: "$profileData.consultationFee",
          consultationModes: "$profileData.consultationModes",
          aboutDoctor: "$profileData.aboutDoctor",
          shortBio: "$profileData.shortBio",
          hasClinic: "$profileData.hasClinic",
          clinicAddress: "$profileData.clinicAddress",
          profileCompleted: {
            $ifNull: ["$profileData.profileCompleted", false],
          },
          distanceInKm: { $divide: ["$distanceFromPatient", 1000] },
        },
      },
      {
        $project: {
          password: 0,
          profile: 0,
          profileData: 0,
          distanceFromPatient: 0,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
    ];

    const doctors = await User.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      matchStage,
      {
        $lookup: {
          from: "doctorprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $addFields: {
          profileData: { $arrayElemAt: ["$profile", 0] },
        },
      },
      {
        $match: {
          "profileData.hasClinic": true,
          "profileData.clinicAddress.coordinates.coordinates": {
            $exists: true,
          },
        },
      },
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distanceFromPatient",
          maxDistance: radius,
          spherical: true,
        },
      },
      ...(specialization
        ? [
            {
              $match: {
                "profileData.specialization": {
                  $regex: specialization,
                  $options: "i",
                },
              },
            },
          ]
        : []),
      { $count: "total" },
    ];

    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    console.error("Get doctors near me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby doctors",
      error: error.message,
    });
  }
};

/*
==================================================
CREATE CONSULTATION
==================================================
*/
export const createConsultation = async (req, res) => {
  try {
    const {
      doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
    } = req.body;

    if (
      !doctorId ||
      !consultationType ||
      !symptoms ||
      !currentProblem ||
      !consultationDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // ✅ case-insensitive role check
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role.toLowerCase() !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const selectedDate = getDateOnly(consultationDate);
    let availability = await findAvailabilityForDay(doctorId, selectedDate);

    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, selectedDate);
      if (!fallbackSlots.length) {
        return res.status(400).json({
          success: false,
          message: "Doctor is not available on the selected date",
        });
      }
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: selectedDate,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    const selectedSlot = availability.slots.find(
      (slot) =>
        slot.startTime === startTime &&
        slot.endTime === endTime &&
        slot.isBooked === false,
    );

    if (!selectedSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is not available",
      });
    }

    const consultation = new Consultation({
      patient: req.user.id,
      doctor: doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
      status: "scheduled",
    });

    await consultation.save();

    selectedSlot.isBooked = true;
    selectedSlot.bookedBy = req.user.id;
    selectedSlot.consultationId = consultation._id;
    await availability.save();

    await consultation.populate(
      "doctor",
      "name specialization qualification experience",
    );

    // ✅ Send appointment confirmation emails
    const patient = await User.findById(req.user.id);
    console.log("📧 EMAIL DEBUG:");
    console.log("  Patient ID:", req.user.id);
    console.log("  Patient found:", !!patient);
    console.log("  Patient email:", patient?.email);
    console.log("  Doctor found:", !!doctor);
    console.log("  Doctor email:", doctor?.email);

    if (patient && doctor && doctor.email && patient.email) {
      try {
        console.log("🚀 Sending emails to:", {
          patient: patient.email,
          doctor: doctor.email,
        });
        const emailResult = await sendAppointmentEmail({
          patientEmail: patient.email,
          doctorEmail: doctor.email,
          patientName: patient.name,
          doctorName: doctor.name,
          consultationDate,
          startTime,
          endTime,
          consultationType,
        });
        console.log("✅ Email result:", emailResult);
      } catch (emailError) {
        console.error(
          "❌ Email sending failed (non-critical):",
          emailError.message,
        );
        console.error("Stack:", emailError.stack);
        // Don't fail the booking if email fails
      }
    } else {
      console.warn("⚠️ Skipped email sending - missing data:", {
        hasPatient: !!patient,
        hasDoctor: !!doctor,
        hasPatientEmail: !!patient?.email,
        hasDoctorEmail: !!doctor?.email,
      });
    }

    res.status(201).json({
      success: true,
      message: "Consultation booked successfully",
      consultation,
    });
  } catch (error) {
    console.error("createConsultation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create consultation",
      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTOR AVAILABLE SLOTS
==================================================
*/
export const getDoctorAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const selectedDate = getDateOnly(date);
    let availability = await findAvailabilityForDay(doctorId, selectedDate);

    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, selectedDate);
      if (!fallbackSlots.length) {
        return res.json({ success: true, slots: [] });
      }
      availability = await DoctorAvailability.create({
        doctor: doctorId,
        availableDate: selectedDate,
        slots: fallbackSlots,
        isActive: true,
      });
    }

    const availableSlots = availability.slots.filter((slot) => !slot.isBooked);

    res.json({ success: true, slots: availableSlots });
  } catch (error) {
    console.error("getDoctorAvailableSlots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
      error: error.message,
    });
  }
};

/*
==================================================
DOCTOR DASHBOARD CONSULTATIONS
==================================================
*/
export const getDoctorConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ doctor: req.user.id })
      .populate("patient", "name email phone")
      .sort({ consultationDate: 1, startTime: 1 });

    res.json({ success: true, consultations });
  } catch (error) {
    console.error("getDoctorConsultations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor consultations",
      error: error.message,
    });
  }
};

/*
==================================================
PATIENT CONSULTATIONS
==================================================
*/
export const getPatientConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ patient: req.user.id })
      .populate("doctor", "name specialization qualification experience")
      .sort({ consultationDate: -1 });

    res.json({ success: true, consultations });
  } catch (error) {
    console.error("getPatientConsultations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient consultations",
      error: error.message,
    });
  }
};

/*
==================================================
UPDATE CONSULTATION STATUS
==================================================
*/
export const updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      "scheduled",
      "ongoing",
      "completed",
      "cancelled",
      "missed",
    ];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation status",
      });
    }

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    consultation.status = status;
    await consultation.save();

    res.json({
      success: true,
      message: "Consultation status updated successfully",
      consultation,
    });
  } catch (error) {
    console.error("updateConsultationStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update consultation status",
      error: error.message,
    });
  }
};

/*
==================================================
DOCTOR NOTES + PRESCRIPTION
==================================================
*/
export const addDoctorNotes = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { doctorNotes, prescription, followUpRequired } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    consultation.doctorNotes = doctorNotes || "";
    consultation.prescription = prescription || "";
    consultation.followUpRequired = followUpRequired || false;

    await consultation.save();

    res.json({
      success: true,
      message: "Doctor notes added successfully",
      consultation,
    });
  } catch (error) {
    console.error("addDoctorNotes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add doctor notes",
      error: error.message,
    });
  }
};

// Mark user as joined in consultation
export const markUserJoined = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.id;

    const consultation = await Consultation.findById(consultationId)
      .populate("patient", "name email")
      .populate("doctor", "name email");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Check if user is patient or doctor
    let userRole = null;
    let otherUserRole = null;
    let otherUserHasJoined = false;
    let otherUserEmail = null;
    let otherUserName = null;
    let currentUserName = null;

    if (consultation.patient._id.toString() === userId) {
      consultation.patientJoined = true;
      userRole = "patient";
      otherUserRole = "doctor";
      otherUserHasJoined = consultation.doctorJoined;
      otherUserEmail = consultation.doctor.email;
      otherUserName = consultation.doctor.name;
      currentUserName = consultation.patient.name;
      await consultation.save();

      console.log(
        `✅ Patient marked as joined for consultation ${consultationId}`,
      );
    } else if (consultation.doctor._id.toString() === userId) {
      consultation.doctorJoined = true;
      userRole = "doctor";
      otherUserRole = "patient";
      otherUserHasJoined = consultation.patientJoined;
      otherUserEmail = consultation.patient.email;
      otherUserName = consultation.patient.name;
      currentUserName = consultation.doctor.name;
      await consultation.save();

      console.log(
        `✅ Doctor marked as joined for consultation ${consultationId}`,
      );
    } else {
      return res.status(403).json({
        success: false,
        message: "User not authorized for this consultation",
      });
    }

    // Update status to ongoing if it wasn't already
    if (consultation.status === "scheduled") {
      consultation.status = "ongoing";
      await consultation.save();
    }

    // 📧 SEND EMAIL TO OTHER PARTICIPANT IF THEY HAVEN'T JOINED YET
    if (!otherUserHasJoined && otherUserEmail) {
      await sendMeetingWaitingEmail({
        recipientEmail: otherUserEmail,
        recipientName: otherUserName,
        waitingUserRole: userRole,
        waitingUserName: currentUserName,
        consultationId: consultationId,
        consultationDate: consultation.consultationDate,
        startTime: consultation.startTime,
      });
    }

    // 🔔 Notify the other user in real-time via Socket.io
    if (io) {
      io.to(consultationId).emit("user-status-updated", {
        consultationId,
        userRole,
        userJoined: true,
        patientJoined: consultation.patientJoined,
        doctorJoined: consultation.doctorJoined,
        message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} has joined the consultation`,
      });

      // 🔔 If other user hasn't joined, send them a "waiting" notification
      if (!otherUserHasJoined) {
        io.to(consultationId).emit("participant-waiting", {
          consultationId,
          waitingUserRole: userRole,
          waitingUserName: currentUserName,
          message: `${currentUserName} (${userRole === "doctor" ? "Dr." : "Patient"}) has joined and is waiting for you to join`,
          timestamp: new Date(),
        });

        console.log(
          `⏳ Participant waiting notification sent for ${consultationId}`,
        );
      }

      console.log(
        `🔔 Socket notification sent to consultation room ${consultationId}`,
      );
    }

    res.json({
      success: true,
      message: "User marked as joined",
      consultation,
    });
  } catch (error) {
    console.error("markUserJoined error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark user as joined",
      error: error.message,
    });
  }
};
