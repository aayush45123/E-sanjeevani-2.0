import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import {
  consultations,
  patientProfiles,
  users,
  aiTriageChats,
} from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const getDoctorAssistantData = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId));

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Aliases so patient/doctor can each be pulled from the same "users" table
    const patientUser = alias(users, "patient_user");
    const doctorUser = alias(users, "doctor_user");

    // Equivalent of .populate("patient", "-password")
    const [patientInfo] = await db
      .select({
        id: patientUser.id,
        name: patientUser.name,
        email: patientUser.email,
        phone: patientUser.phone,
        profileImage: patientUser.profileImage,
        role: patientUser.role,
        isVerified: patientUser.isVerified,
        isActive: patientUser.isActive,
        createdAt: patientUser.createdAt,
        updatedAt: patientUser.updatedAt,
      })
      .from(patientUser)
      .where(eq(patientUser.id, consultation.patientId));

    // Equivalent of .populate("doctor", "-password")
    const [doctorInfo] = await db
      .select({
        id: doctorUser.id,
        name: doctorUser.name,
        email: doctorUser.email,
        phone: doctorUser.phone,
        profileImage: doctorUser.profileImage,
        role: doctorUser.role,
        isVerified: doctorUser.isVerified,
        isActive: doctorUser.isActive,
        createdAt: doctorUser.createdAt,
        updatedAt: doctorUser.updatedAt,
      })
      .from(doctorUser)
      .where(eq(doctorUser.id, consultation.doctorId));

    const patientId = consultation.patientId;

    const [patientProfile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientId));

    const [latestAITriage] = await db
      .select()
      .from(aiTriageChats)
      .where(eq(aiTriageChats.userId, patientId))
      .orderBy(desc(aiTriageChats.createdAt))
      .limit(1);

    return res.status(200).json({
      success: true,
      data: {
        patientBasicInfo: patientInfo || null,
        consultationDetails: {
          ...consultation,
          patient: patientInfo || null,
          doctor: doctorInfo || null,
        },
        patientProfile: patientProfile || null,
        latestAITriage: latestAITriage || null,
      },
    });
  } catch (error) {
    console.error("Doctor Assistant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor assistant data",
      error: error.message,
    });
  }
};
