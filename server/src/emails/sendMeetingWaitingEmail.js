import transporter from "./emailTransporter.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Helper to generate a random reference ID to prevent spam grouping
const generateRefId = () => Math.random().toString(36).substring(2, 15);

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

    const subject = `⏱️ Action Required: ${waitingUserDisplay} is waiting for you`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Consultation Starting — Participant Waiting</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style type="text/css">
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
            body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f8fafc; }
            table { border-collapse: collapse !important; }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap');
            @media screen and (max-width: 600px) {
              .content { width: 100% !important; padding: 20px !important; }
              .header-padding { padding: 32px 24px !important; }
              .body-padding { padding: 32px 24px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="content" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                  <!-- Header Block -->
                  <tr>
                    <td align="center" bgcolor="#0f172a" class="header-padding" style="padding: 40px 48px; background-color: #0f172a; text-align: center;">
                      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td align="center" style="background-color: #e11d48; border-radius: 8px; width: 36px; height: 36px; text-align: center; vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 36px; font-family: 'Inter', Arial, sans-serif;">⏱️</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; font-style: italic; color: #ffffff; letter-spacing: -0.2px;">Consultation Starting</h1>
                      <p style="margin: 4px 0 0 0; font-family: 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #fda4af; text-transform: uppercase; letter-spacing: 1.5px;">Urgent Update</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td class="body-padding" style="padding: 48px 48px 40px 48px; background-color: #ffffff;">
                      <p style="margin: 0 0 20px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                        Hello ${recipientName},
                      </p>
                      <p style="margin: 0 0 28px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                        Your scheduled consultation is starting now. **${waitingUserDisplay}** has already joined the video room and is currently waiting for you to connect.
                      </p>
                      
                      <!-- Status Alert Box -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 4px; padding: 16px; margin-bottom: 28px;">
                        <tr>
                          <td>
                            <h4 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #9f1239;">⏳ Action Required</h4>
                            <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 13px; line-height: 1.4; color: #be123c;">
                              Please click below to enter the consultation room immediately to start your session.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Details Card Block -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                        <tr>
                          <td style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                            <span style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Waiting For</span>
                            <div style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px;">${waitingUserDisplay}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 12px;">
                            <span style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Scheduled Start</span>
                            <div style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #334155; margin-top: 2px; font-weight: 500;">
                              ${formattedDate} at ${startTime}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Action Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <a href="${joinLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 30px; border-radius: 6px; text-align: center; letter-spacing: -0.1px;">
                              Join Consultation Now
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                        <tr>
                          <td>
                            <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                              Warmly,<br/>
                              <strong style="color: #475569;">The E-Sanjeevani Team</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 32px 48px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-family: 'Inter', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #94a3b8;">
                        E-Sanjeevani Telemedicine Corp. &bull; 102 Healthcare Blvd, Suite 400 &bull; New Delhi, DL 110001
                      </p>
                      <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #94a3b8;">
                        This is an urgent session reminder. If you didn't request this appointment, please ignore this message.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const refId = generateRefId();

    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: html,
      headers: {
        "X-Entity-Ref-ID": `waiting-${consultationId}-${refId}`,
        "List-Unsubscribe": `<mailto:unsubscribe@e-sanjeevani-app.com?subject=unsubscribe>, <${FRONTEND_URL}/unsubscribe>`
      }
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
    return {
      success: false,
      message: "Email send failed (non-blocking)",
      error: error.message,
    };
  }
};
