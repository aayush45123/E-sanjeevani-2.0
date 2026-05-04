import cron from "node-cron";
import Consultation from "../models/Consultation.js";
import { sendConsultationReminderEmail } from "./sendAppointmentEmail.js";

/**
 * ==================================================
 * CONSULTATION REMINDER CRON JOB
 *
 * Runs every minute
 *
 * If:
 * - consultation is scheduled
 * - today's consultation
 * - start time matches current time
 * - reminder not sent yet
 * - doctor + patient have not joined yet
 *
 * Then:
 * - send reminder mail to patient
 * - send reminder mail to doctor
 * - mark reminder as sent
 * ==================================================
 */

export const initializeConsultationReminders = () => {
  // Every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const currentHour = String(now.getHours()).padStart(2, "0");
      const currentMinute = String(now.getMinutes()).padStart(2, "0");

      const currentTime = `${currentHour}:${currentMinute}`;

      /*
      ============================================
      Today's Date Range
      ============================================
      */

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      /*
      ============================================
      Find Consultations That Need Reminder
      ============================================
      */

      const consultations = await Consultation.find({
        consultationDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },

        status: "scheduled",

        reminderSent: false,

        patientJoined: false,

        doctorJoined: false,

        startTime: currentTime,
      })
        .populate("patient", "email name")
        .populate("doctor", "email name");

      if (!consultations.length) {
        return;
      }

      console.log(
        `\n⏰ CONSULTATION REMINDER JOB: Found ${consultations.length} consultation(s) at ${currentTime}`,
      );

      /*
      ============================================
      Process Each Consultation
      ============================================
      */

      for (const consultation of consultations) {
        try {
          const patient = consultation.patient;
          const doctor = consultation.doctor;

          /*
          ============================================
          Validate Emails
          ============================================
          */

          if (!patient?.email || !doctor?.email) {
            console.warn(
              `⚠️ Skipping consultation ${consultation._id} because email is missing`,
            );
            continue;
          }

          console.log(
            `📧 Sending reminder for consultation: ${consultation._id}`,
          );

          /*
          ============================================
          Send Reminder Email
          ============================================
          */

          const result = await sendConsultationReminderEmail({
            patientEmail: patient.email,
            doctorEmail: doctor.email,

            patientName: patient.name,
            doctorName: doctor.name,

            consultationDate: consultation.consultationDate,

            startTime: consultation.startTime,
            endTime: consultation.endTime,

            consultationType: consultation.consultationType,
          });

          /*
          ============================================
          Only Mark Sent If Email Success
          ============================================
          */

          if (result.success) {
            consultation.reminderSent = true;
            consultation.reminderSentAt = new Date();

            await consultation.save();

            console.log(
              `✅ Reminder successfully sent for consultation ${consultation._id}`,
            );
          } else {
            console.error(
              `❌ Reminder failed for consultation ${consultation._id}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error(
            `❌ Error while processing consultation ${consultation._id}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Error inside consultation reminder cron job:",
        error.message,
      );
    }
  });

  console.log(
    "✅ Consultation Reminder Cron Job Initialized (runs every minute)",
  );
};
