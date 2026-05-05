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
SEND EMAIL: ONE PARTICIPANT WAITING FOR THE OTHER
Doctor or Patient has joined and is waiting for you
==================================================
*/

export const sendMeetingWaitingEmail = async ({
  recipientEmail,
  recipientName,
  waitingUserRole,
  waitingUserName,
  consultationId,
  consultationDate,
  startTime,
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

    const joinLink = `${FRONTEND_URL}/videocall/${consultationId}`;
    const waitingUserDisplay =
      waitingUserRole === "doctor" ? `Dr. ${waitingUserName}` : waitingUserName;

    const subject = `⏱️ Your Consultation is Starting - ${waitingUserDisplay} is Waiting`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
              color: #333;
              line-height: 1.6;
            }
            .status-box {
              background: linear-gradient(135deg, #fff5e6 0%, #ffe0b2 100%);
              border-left: 4px solid #ff9800;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .status-box .status-title {
              font-weight: bold;
              color: #f57c00;
              font-size: 16px;
            }
            .status-box .status-text {
              color: #e65100;
              margin-top: 8px;
            }
            .details {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #555;
              width: 40%;
            }
            .detail-value {
              color: #333;
              text-align: right;
              width: 60%;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 40px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              font-size: 16px;
              margin-top: 20px;
              text-align: center;
            }
            .cta-button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
            }
            .urgency-icon {
              font-size: 20px;
              margin-right: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1><span class="urgency-icon">⏱️</span>Consultation Starting Now!</h1>
              <p>Your appointment is beginning</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p>Hello ${recipientName},</p>

              <p>Your consultation is scheduled and starting now. However, ${waitingUserDisplay} has already joined the video call and is waiting for you to join.</p>

              <!-- Status Box -->
              <div class="status-box">
                <div class="status-title">⏳ Action Required</div>
                <div class="status-text">Please join the consultation as soon as possible. ${waitingUserDisplay} is ready to start your appointment.</div>
              </div>

              <!-- Consultation Details -->
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Waiting For:</span>
                  <span class="detail-value"><strong>${waitingUserDisplay}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${startTime}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${joinLink}" class="cta-button">Join Consultation Now</a>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                If you are experiencing any technical issues, please try refreshing your page or logging in again.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>E-Sanjeevani 2.0 - Telemedicine Platform</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: html,
    });

    console.log(
      `✅ Meeting waiting email sent to ${recipientName} (${recipientEmail})`,
    );

    return {
      success: true,
      message: "Waiting notification email sent",
    };
  } catch (error) {
    console.error("❌ Error sending meeting waiting email:", error);
    // Don't throw - email failure shouldn't block the consultation
    return {
      success: false,
      message: "Email send failed (non-blocking)",
      error: error.message,
    };
  }
};
