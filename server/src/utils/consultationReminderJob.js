import cron from "node-cron";
import Consultation from "../models/Consultation.js";
import User from "../models/User.js";
import { sendConsultationReminderEmail } from "./sendAppointmentEmail.js";

/**
 * Check consultations at their scheduled time
 * If neither doctor nor patient has joined, send reminder emails
 */
export const initializeConsultationReminders = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, "0");
      const currentMinute = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${currentHour}:${currentMinute}`;

      // Find consultations that:
      // 1. Are scheduled
      // 2. Have today's date
      // 3. Start time matches current time (within same minute)
      // 4. Haven't sent reminder yet
      // 5. Neither doctor nor patient has joined
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

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

      if (consultations.length === 0) {
        return; // No consultations to remind
      }

      console.log(
        `\n⏰ CONSULTATION REMINDER JOB: Found ${consultations.length} consultation(s) to remind at ${currentTime}`,
      );

      // Send reminders for each consultation
      for (const consultation of consultations) {
        try {
          const patient = consultation.patient;
          const doctor = consultation.doctor;

          if (!patient?.email || !doctor?.email) {
            console.warn(
              `⚠️ Skipping reminder for consultation ${consultation._id}: missing email`,
            );
            continue;
          }

          console.log(
            `📧 Sending reminders for consultation ${consultation._id}`,
          );

          // Send reminder emails
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

          if (result.success) {
            // Mark reminder as sent
            consultation.reminderSent = true;
            consultation.reminderSentAt = new Date();
            await consultation.save();
            console.log(`✅ Reminder sent and logged for ${consultation._id}`);
          } else {
            console.error(
              `❌ Failed to send reminder for ${consultation._id}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error("❌ Error sending consultation reminder:", error);
          // Continue to next consultation
        }
      }
    } catch (error) {
      console.error("❌ Error in consultation reminder job:", error);
    }
  });

  console.log("✅ Consultation reminder job initialized (runs every minute)");
};
