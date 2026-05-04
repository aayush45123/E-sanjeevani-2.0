import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/*
==================================================
1. BOOKING CONFIRMATION EMAIL
Doctor receives booking confirmation
==================================================
*/

export const sendAppointmentEmail = async ({
  patientEmail,
  doctorEmail,
  patientName,
  doctorName,
  consultationDate,
  startTime,
  endTime,
  consultationType,
}) => {
  try {
    const transporter = createTransporter();

    const formattedDate = new Date(consultationDate).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    /*
    DOCTOR MAIL
    */
    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: "New Consultation Booking Received",
      html: `
        <h2>New Appointment Booked</h2>

        <p>Hello Dr. ${doctorName},</p>

        <p>A new consultation has been booked.</p>

        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Type:</strong> ${consultationType}</p>

        <p>
          Please join from:
          <br />
          <a href="${FRONTEND_URL}/dashboard">
            Doctor Dashboard
          </a>
        </p>

        <p>Regards,<br/>E-Sanjeevani Team</p>
      `,
    });

    console.log("✅ Doctor booking mail sent");

    return {
      success: true,
    };
  } catch (error) {
    console.log("❌ Booking mail error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

/*
==================================================
2. CONSULTATION REMINDER EMAIL
Doctor + Patient both receive reminder
==================================================
*/

export const sendConsultationReminderEmail = async ({
  patientEmail,
  doctorEmail,
  patientName,
  doctorName,
  consultationDate,
  startTime,
  endTime,
  consultationType,
}) => {
  try {
    const transporter = createTransporter();

    const formattedDate = new Date(consultationDate).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    /*
    PATIENT MAIL
    */
    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: "Consultation Starting Soon — Please Join",
      html: `
        <h2>Consultation Reminder</h2>

        <p>Hello ${patientName},</p>

        <p>Your consultation with Dr. ${doctorName} is starting now.</p>

        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${startTime}</p>

        <p>
          Please join here:
          <br />
          <a href="${FRONTEND_URL}/consultations">
            Join Consultation
          </a>
        </p>

        <p>Regards,<br/>E-Sanjeevani Team</p>
      `,
    });

    /*
    DOCTOR MAIL
    */
    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: "Consultation Starting Soon — Please Join",
      html: `
        <h2>Consultation Reminder</h2>

        <p>Hello Dr. ${doctorName},</p>

        <p>Your consultation with ${patientName} is starting now.</p>

        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${startTime}</p>

        <p>
          Please join here:
          <br />
          <a href="${FRONTEND_URL}/dashboard">
            Open Doctor Dashboard
          </a>
        </p>

        <p>Regards,<br/>E-Sanjeevani Team</p>
      `,
    });

    console.log("✅ Reminder mails sent");

    return {
      success: true,
    };
  } catch (error) {
    console.log("❌ Reminder mail error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};
