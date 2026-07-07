import cron from "node-cron";
import { db } from "../config/neonDb.js"; // adjust path to your drizzle db instance
import { consultations, users } from "../db/schema/index.js"; // adjust path to your schema barrel file
import { eq, and, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
      (patient/doctor pulled via join instead of .populate,
      since both patientId and doctorId are required FKs on consultations)
      ============================================
      */

      const patientUser = alias(users, "reminder_patient_user");
      const doctorUser = alias(users, "reminder_doctor_user");

      const dueConsultations = await db
        .select({
          id: consultations.id,
          consultationDate: consultations.consultationDate,
          startTime: consultations.startTime,
          endTime: consultations.endTime,
          consultationType: consultations.consultationType,
          patientEmail: patientUser.email,
          patientName: patientUser.name,
          doctorEmail: doctorUser.email,
          doctorName: doctorUser.name,
        })
        .from(consultations)
        .innerJoin(patientUser, eq(patientUser.id, consultations.patientId))
        .innerJoin(doctorUser, eq(doctorUser.id, consultations.doctorId))
        .where(
          and(
            gte(consultations.consultationDate, todayStart),
            lte(consultations.consultationDate, todayEnd),
            eq(consultations.status, "scheduled"),
            eq(consultations.reminderSent, false),
            eq(consultations.patientJoined, false),
            eq(consultations.doctorJoined, false),
            eq(consultations.startTime, currentTime),
          ),
        );

      if (!dueConsultations.length) {
        return;
      }

      console.log(
        `\n⏰ CONSULTATION REMINDER JOB: Found ${dueConsultations.length} consultation(s) at ${currentTime}`,
      );

      /*
      ============================================
      Process Each Consultation
      ============================================
      */

      for (const consultation of dueConsultations) {
        try {
          /*
          ============================================
          Validate Emails
          ============================================
          */

          if (!consultation.patientEmail || !consultation.doctorEmail) {
            console.warn(
              `⚠️ Skipping consultation ${consultation.id} because email is missing`,
            );
            continue;
          }

          console.log(
            `📧 Sending reminder for consultation: ${consultation.id}`,
          );

          /*
          ============================================
          Send Reminder Email
          ============================================
          */

          const result = await sendConsultationReminderEmail({
            patientEmail: consultation.patientEmail,
            doctorEmail: consultation.doctorEmail,

            patientName: consultation.patientName,
            doctorName: consultation.doctorName,

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
            await db
              .update(consultations)
              .set({
                reminderSent: true,
                reminderSentAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(consultations.id, consultation.id));

            console.log(
              `✅ Reminder successfully sent for consultation ${consultation.id}`,
            );
          } else {
            console.error(
              `❌ Reminder failed for consultation ${consultation.id}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error(
            `❌ Error while processing consultation ${consultation.id}:`,
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
