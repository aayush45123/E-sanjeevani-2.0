import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Create Gmail transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS are not configured in environment variables",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send appointment confirmation emails to both doctor and patient
 * @param {Object} data - Email data
 * @param {string} data.patientEmail - Patient's email
 * @param {string} data.doctorEmail - Doctor's email
 * @param {string} data.patientName - Patient's name
 * @param {string} data.doctorName - Doctor's name
 * @param {Date} data.consultationDate - Appointment date
 * @param {string} data.startTime - Appointment start time
 * @param {string} data.endTime - Appointment end time
 * @param {string} data.consultationType - Type: video/call/chat
 */
export const sendAppointmentEmail = async (data) => {
  try {
    const transporter = createTransporter();
    const {
      patientEmail,
      doctorEmail,
      patientName,
      doctorName,
      consultationDate,
      startTime,
      endTime,
      consultationType,
    } = data;

    // Format date
    const dateObj = new Date(consultationDate);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ───────────────────────────────────────────────────────────────
    // EMAIL FOR PATIENT
    // ───────────────────────────────────────────────────────────────
    const patientEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation - E-Sanjeevani 2.0</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 16px;
            color: #1e293b;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .appointment-details {
            background: #f8fafb;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .appointment-details h3 {
            color: #0ea5e9;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
          }
          .cta-section {
            margin: 30px 0;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background: #0ea5e9;
            color: white;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            transition: background 0.3s ease;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          }
          .cta-button:hover {
            background: #0284c7;
            text-decoration: none;
          }
          .important-note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #92400e;
          }
          .important-note strong {
            color: #b45309;
          }
          .footer {
            background: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .footer a {
            color: #0ea5e9;
            text-decoration: none;
          }
          .badge {
            display: inline-block;
            background: #dbeafe;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .consultation-type-video {
            background: #dcfce7;
            color: #16a34a;
          }
          .consultation-type-call {
            background: #e0e7ff;
            color: #4f46e5;
          }
          .consultation-type-chat {
            background: #f3e8ff;
            color: #7c3aed;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Appointment Confirmed</h1>
            <p>Your consultation has been successfully booked</p>
          </div>

          <div class="content">
            <p class="greeting">Hi ${patientName},</p>

            <p>Great news! Your appointment with <strong>Dr. ${doctorName}</strong> has been confirmed. Here are your appointment details:</p>

            <div class="appointment-details">
              <h3>📋 Appointment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${startTime} - ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Consultation Type</span>
                <span class="detail-value">
                  <span class="badge consultation-type-${consultationType}">${consultationType.toUpperCase()}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Doctor</span>
                <span class="detail-value">Dr. ${doctorName}</span>
              </div>
            </div>

            <div class="important-note">
              <strong>📌 Important:</strong> Join your consultation 5 minutes before the scheduled time. The link will be available in your dashboard.
            </div>

            <div class="cta-section">
              <p style="margin-bottom: 15px; color: #64748b; font-size: 13px;">Ready? Access your consultations here:</p>
              <a href="${FRONTEND_URL}/consultations" class="cta-button">View My Consultations</a>
            </div>

            <p style="color: #64748b; font-size: 13px; margin-top: 25px;">
              <strong>Need to reschedule or cancel?</strong> Contact support or visit your consultation dashboard.
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>E-Sanjeevani 2.0</strong> • Your Healthcare, Your Way<br>
              📧 <a href="mailto:support@esanjeevani.com">support@esanjeevani.com</a> | 
              🌐 <a href="${FRONTEND_URL}">Visit Platform</a>
            </p>
            <p style="margin-top: 10px; opacity: 0.8;">
              © 2024 E-Sanjeevani 2.0. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // ───────────────────────────────────────────────────────────────
    // EMAIL FOR DOCTOR
    // ───────────────────────────────────────────────────────────────
    const doctorEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Booking - E-Sanjeevani 2.0</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 16px;
            color: #1e293b;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .appointment-details {
            background: #f8fafb;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .appointment-details h3 {
            color: #0ea5e9;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
          }
          .cta-section {
            margin: 30px 0;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background: #0ea5e9;
            color: white;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            transition: background 0.3s ease;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          }
          .cta-button:hover {
            background: #0284c7;
            text-decoration: none;
          }
          .important-note {
            background: #e0f2fe;
            border-left: 4px solid #0284c7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #0c4a6e;
          }
          .important-note strong {
            color: #0369a1;
          }
          .footer {
            background: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .footer a {
            color: #0ea5e9;
            text-decoration: none;
          }
          .badge {
            display: inline-block;
            background: #dbeafe;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .consultation-type-video {
            background: #dcfce7;
            color: #16a34a;
          }
          .consultation-type-call {
            background: #e0e7ff;
            color: #4f46e5;
          }
          .consultation-type-chat {
            background: #f3e8ff;
            color: #7c3aed;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Appointment Booking</h1>
            <p>A patient has scheduled a consultation with you</p>
          </div>

          <div class="content">
            <p class="greeting">Hi Dr. ${doctorName},</p>

            <p>You have received a new appointment booking from <strong>${patientName}</strong>. Here are the details:</p>

            <div class="appointment-details">
              <h3>📋 Appointment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Patient Name</span>
                <span class="detail-value">${patientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${startTime} - ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Consultation Type</span>
                <span class="detail-value">
                  <span class="badge consultation-type-${consultationType}">${consultationType.toUpperCase()}</span>
                </span>
              </div>
            </div>

            <div class="important-note">
              <strong>⏰ Reminder:</strong> Please log in to your dashboard 5 minutes before the scheduled time to prepare for the consultation.
            </div>

            <div class="cta-section">
              <p style="margin-bottom: 15px; color: #64748b; font-size: 13px;">Manage your schedule here:</p>
              <a href="${FRONTEND_URL}/dashboard" class="cta-button">Go to Dashboard</a>
            </div>

            <p style="color: #64748b; font-size: 13px; margin-top: 25px;">
              Thank you for using E-Sanjeevani 2.0. Provide quality healthcare to your patients!
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>E-Sanjeevani 2.0</strong> • Your Healthcare, Your Way<br>
              📧 <a href="mailto:support@esanjeevani.com">support@esanjeevani.com</a> | 
              🌐 <a href="${FRONTEND_URL}">Visit Platform</a>
            </p>
            <p style="margin-top: 10px; opacity: 0.8;">
              © 2024 E-Sanjeevani 2.0. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // ───────────────────────────────────────────────────────────────
    // SEND EMAILS
    // ───────────────────────────────────────────────────────────────

    // Send email to patient
    console.log("📧 Sending patient email to:", patientEmail);
    const patientResult = await transporter.sendMail({
      from: `"E-Sanjeevani 2.0" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: `Appointment Confirmed - Dr. ${doctorName} on ${formattedDate}`,
      html: patientEmailHtml,
    });

    console.log("✅ Patient email sent:", patientResult);

    // Send email to doctor
    console.log("📧 Sending doctor email to:", doctorEmail);
    const doctorResult = await transporter.sendMail({
      from: `"E-Sanjeevani 2.0" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: `New Appointment - ${patientName} on ${formattedDate}`,
      html: doctorEmailHtml,
    });

    console.log("✅ Doctor email sent:", doctorResult);

    return {
      success: true,
      patientEmail: patientResult,
      doctorEmail: doctorResult,
    };
  } catch (error) {
    console.error("❌ Failed to send appointment emails:", error);
    // Don't throw - emails are not critical for booking to succeed
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send consultation time reminder emails to both doctor and patient
 * Called when consultation time is reached but neither has joined
 */
export const sendConsultationReminderEmail = async (data) => {
  try {
    const transporter = createTransporter();
    const {
      patientEmail,
      doctorEmail,
      patientName,
      doctorName,
      consultationDate,
      startTime,
      endTime,
      consultationType,
    } = data;

    const dateObj = new Date(consultationDate);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const patientReminderHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Your Consultation - E-Sanjeevani 2.0</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 700; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .alert-icon { font-size: 48px; text-align: center; margin-bottom: 15px; }
          .time-now { color: #dc2626; font-weight: 700; font-size: 18px; text-align: center; }
          .appointment-details { background: #f8fafb; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .detail-value { color: #1e293b; font-weight: 500; font-size: 14px; }
          .cta-section { margin: 30px 0; text-align: center; }
          .cta-button { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.3s ease; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
          .cta-button:hover { background: #dc2626; text-decoration: none; }
          .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #ef4444; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Time to Join!</h1>
            <p>Your consultation is starting now</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px; font-weight: 600;">Hi ${patientName},</p>
            <div class="alert-box">
              <div class="alert-icon">⏰</div>
              <div class="time-now">Your consultation with Dr. ${doctorName} is STARTING NOW!</div>
              <p style="margin-top: 15px; text-align: center; color: #64748b; font-size: 14px;">It's time to join the meeting. Click the button below to enter the consultation room.</p>
            </div>
            <div class="appointment-details">
              <h3 style="color: #0ea5e9; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; font-weight: 600;">📋 Consultation Details</h3>
              <div class="detail-row">
                <span class="detail-label">Doctor</span>
                <span class="detail-value">Dr. ${doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${startTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value" style="text-transform: uppercase;">${consultationType}</span>
              </div>
            </div>
            <div class="cta-section">
              <p style="margin-bottom: 15px; color: #64748b; font-size: 13px;">👉 Join now to start your consultation:</p>
              <a href="${FRONTEND_URL}/consultations" class="cta-button">JOIN CONSULTATION</a>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 20px; text-align: center;"><strong>⚠️ Important:</strong> This consultation will be cancelled if neither party joins within 15 minutes.</p>
          </div>
          <div class="footer">
            <p><strong>E-Sanjeevani 2.0</strong> • Your Healthcare, Your Way<br>📧 <a href="mailto:support@esanjeevani.com">support@esanjeevani.com</a></p>
            <p style="margin-top: 10px; opacity: 0.8;">© 2024 E-Sanjeevani 2.0</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const doctorReminderHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Consultation - E-Sanjeevani 2.0</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 700; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .alert-icon { font-size: 48px; text-align: center; margin-bottom: 15px; }
          .time-now { color: #dc2626; font-weight: 700; font-size: 18px; text-align: center; }
          .appointment-details { background: #f8fafb; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .detail-value { color: #1e293b; font-weight: 500; font-size: 14px; }
          .cta-section { margin: 30px 0; text-align: center; }
          .cta-button { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.3s ease; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
          .cta-button:hover { background: #dc2626; text-decoration: none; }
          .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #ef4444; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Time to Join!</h1>
            <p>Your consultation is starting now</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px; font-weight: 600;">Hi Dr. ${doctorName},</p>
            <div class="alert-box">
              <div class="alert-icon">⏰</div>
              <div class="time-now">Your consultation with ${patientName} is STARTING NOW!</div>
              <p style="margin-top: 15px; text-align: center; color: #64748b; font-size: 14px;">It's time to join the meeting. Click the button below to enter the consultation room.</p>
            </div>
            <div class="appointment-details">
              <h3 style="color: #0ea5e9; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; font-weight: 600;">📋 Consultation Details</h3>
              <div class="detail-row">
                <span class="detail-label">Patient</span>
                <span class="detail-value">${patientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${startTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value" style="text-transform: uppercase;">${consultationType}</span>
              </div>
            </div>
            <div class="cta-section">
              <p style="margin-bottom: 15px; color: #64748b; font-size: 13px;">👉 Join now to start the consultation:</p>
              <a href="${FRONTEND_URL}/dashboard" class="cta-button">JOIN CONSULTATION</a>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 20px; text-align: center;"><strong>⚠️ Important:</strong> This consultation will be cancelled if neither party joins within 15 minutes.</p>
          </div>
          <div class="footer">
            <p><strong>E-Sanjeevani 2.0</strong> • Your Healthcare, Your Way<br>📧 <a href="mailto:support@esanjeevani.com">support@esanjeevani.com</a></p>
            <p style="margin-top: 10px; opacity: 0.8;">© 2024 E-Sanjeevani 2.0</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📧 Sending consultation reminders to:", {
      patient: patientEmail,
      doctor: doctorEmail,
    });

    const [patientResult, doctorResult] = await Promise.all([
      transporter.sendMail({
        from: `"E-Sanjeevani 2.0" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: `🚨 Time to Join! Your Consultation with Dr. ${doctorName} is Starting Now`,
        html: patientReminderHtml,
      }),
      transporter.sendMail({
        from: `"E-Sanjeevani 2.0" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: `🚨 Time to Join! Consultation with ${patientName} is Starting Now`,
        html: doctorReminderHtml,
      }),
    ]);

    console.log("✅ Patient reminder sent:", patientResult);
    console.log("✅ Doctor reminder sent:", doctorResult);

    return {
      success: true,
      patientEmail: patientResult,
      doctorEmail: doctorResult,
    };
  } catch (error) {
    console.error("❌ Failed to send consultation reminders:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
