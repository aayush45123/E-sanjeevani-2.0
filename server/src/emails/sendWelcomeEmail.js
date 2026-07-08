import transporter from "./emailTransporter.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const sendWelcomeEmail = async ({ email, name, role }) => {
  try {
    const isDoctor = role === "doctor";
    const subject = isDoctor
      ? "Welcome to E-Sanjeevani — Let's set up your provider dashboard"
      : "Welcome to E-Sanjeevani — Let's get started on your health journey";

    // Dynamic step content based on role
    const stepsHtml = isDoctor
      ? `
        <!-- Step 1 -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td valign="top" width="40" style="padding-top: 4px;">
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                <tr>
                  <td style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-align: center; vertical-align: middle; line-height: 28px;">1</td>
                </tr>
              </table>
            </td>
            <td valign="top" style="padding-left: 12px;">
              <h3 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">Set your consulting hours</h3>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                Log into your dashboard and configure your weekly availability slots so patients can find and book appointments.
              </p>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td valign="top" width="40" style="padding-top: 4px;">
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                <tr>
                  <td style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-align: center; vertical-align: middle; line-height: 28px;">2</td>
                </tr>
              </table>
            </td>
            <td valign="top" style="padding-left: 12px;">
              <h3 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">Consult via browser</h3>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                Conduct secure, high-definition video consultations directly inside our platform with no downloads required.
              </p>
            </td>
          </tr>
        </table>
      `
      : `
        <!-- Step 1 -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td valign="top" width="40" style="padding-top: 4px;">
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                <tr>
                  <td style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-align: center; vertical-align: middle; line-height: 28px;">1</td>
                </tr>
              </table>
            </td>
            <td valign="top" style="padding-left: 12px;">
              <h3 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">Complete your health details</h3>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                Add your clinical background and medical profiles so doctors can review them during your video calls.
              </p>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td valign="top" width="40" style="padding-top: 4px;">
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                <tr>
                  <td style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-align: center; vertical-align: middle; line-height: 28px;">2</td>
                </tr>
              </table>
            </td>
            <td valign="top" style="padding-left: 12px;">
              <h3 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">Find and book providers</h3>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                Search through our catalog of qualified specialists, choose an available slot, and book in seconds.
              </p>
            </td>
          </tr>
        </table>
      `;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Welcome to E-Sanjeevani</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style type="text/css">
            /* Reset and standard cross-client fixes */
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
            
            body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f8fafc; }
            table { border-collapse: collapse !important; }
            
            /* Font imports */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap');
            
            /* Responsive layout */
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
                <!-- Main Container Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="content" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                  
                  <!-- Minimalist Navy Header Block -->
                  <tr>
                    <td align="center" bgcolor="#0f172a" class="header-padding" style="padding: 48px 48px; background-color: #0f172a; text-align: center;">
                      <!-- Logo Icon -->
                      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td align="center" style="background-color: #2563eb; border-radius: 8px; width: 40px; height: 40px; text-align: center; vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 20px; font-weight: bold; line-height: 40px; font-family: 'Inter', Arial, sans-serif;">+</span>
                          </td>
                        </tr>
                      </table>
                      <!-- Elegant Serif Title -->
                      <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 500; font-style: italic; color: #ffffff; letter-spacing: -0.2px;">Welcome to E-Sanjeevani</h1>
                      <p style="margin: 6px 0 0 0; font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Premium Telehealth</p>
                    </td>
                  </tr>
                  
                  <!-- Email Body -->
                  <tr>
                    <td class="body-padding" style="padding: 48px 48px 40px 48px; background-color: #ffffff;">
                      <p style="margin: 0 0 20px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                        Hello ${name},
                      </p>
                      <p style="margin: 0 0 32px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                        Thank you for registering. E-Sanjeevani 2.0 provides clinical connectivity with exceptional simplicity. Here are your next onboarding steps:
                      </p>
                      
                      <!-- Steps Content Area -->
                      ${stepsHtml}
                      
                      <!-- Step 3: Global Onboarding Step -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                        <tr>
                          <td valign="top" width="40" style="padding-top: 4px;">
                            <table border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                              <tr>
                                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-align: center; vertical-align: middle; line-height: 28px;">3</td>
                              </tr>
                            </table>
                          </td>
                          <td valign="top" style="padding-left: 12px;">
                            <h3 style="margin: 0 0 4px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">Join appointments instantly</h3>
                            <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                              When it is time for your consult, click the secure link sent straight to your inbox to meet your practitioner.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Call to Action Button (Understated & Polished) -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 36px; margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 30px; border-radius: 6px; text-align: center; letter-spacing: -0.1px;">
                              Access Your Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Sign-off Block -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 44px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                        <tr>
                          <td>
                            <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #64748b;">
                              Sincerely,<br/>
                              <strong style="color: #475569;">The E-Sanjeevani Team</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer Area (CAN-SPAM & Anti-Spam Compliant) -->
                  <tr>
                    <td align="center" style="padding: 32px 48px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                      <!-- Quick links -->
                      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="padding: 0 8px;">
                            <a href="${FRONTEND_URL}/privacy" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #64748b; text-decoration: none;">Privacy Policy</a>
                          </td>
                          <td style="color: #cbd5e1; font-size: 12px;">&bull;</td>
                          <td style="padding: 0 8px;">
                            <a href="${FRONTEND_URL}/terms" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #64748b; text-decoration: none;">Terms of Service</a>
                          </td>
                          <td style="color: #cbd5e1; font-size: 12px;">&bull;</td>
                          <td style="padding: 0 8px;">
                            <a href="${FRONTEND_URL}/support" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #64748b; text-decoration: none;">Help & Support</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Legal Compliance Text -->
                      <p style="margin: 0 0 6px 0; font-family: 'Inter', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #94a3b8;">
                        E-Sanjeevani Telemedicine Corp. &bull; 102 Healthcare Blvd, Suite 400 &bull; New Delhi, DL 110001
                      </p>
                      <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #94a3b8;">
                        You received this because you registered an account. You can <a href="${FRONTEND_URL}/unsubscribe" style="color: #64748b; text-decoration: underline;">unsubscribe</a> or <a href="${FRONTEND_URL}/settings" style="color: #64748b; text-decoration: underline;">update preferences</a> at any time.
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

    // Generate random reference ID to prevent spam filters grouping different emails
    const entityRefId = Math.random().toString(36).substring(2, 15);

    await transporter.sendMail({
      from: `"E-Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      // Anti-spam headers configuration
      headers: {
        "X-Entity-Ref-ID": entityRefId,
        "List-Unsubscribe": `<mailto:unsubscribe@e-sanjeevani-app.com?subject=unsubscribe>, <${FRONTEND_URL}/unsubscribe>`
      }
    });

    console.log(`✅ Refined welcome email successfully sent to ${name} (${email})`);
    return { success: true };
  } catch (error) {
    console.error("❌ Welcome email failed to send:", error);
    return { success: false, error: error.message };
  }
};
