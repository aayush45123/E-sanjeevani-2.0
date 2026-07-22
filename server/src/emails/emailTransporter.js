import nodemailer from "nodemailer";

// Temporarily disable email service if set to false or missing valid credentials
const isEmailEnabled = process.env.ENABLE_EMAIL === "true";

let realTransporter = null;

if (isEmailEnabled && process.env.REFRESH_TOKEN) {
  try {
    realTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    realTransporter.verify((error) => {
      if (error) {
        console.warn("⚠️ Email server verification failed. Disabling email transport:", error.message);
      } else {
        console.log("✅ Email server (OAuth2) is ready to send messages");
      }
    });
  } catch (err) {
    console.warn("⚠️ Could not create email transporter:", err.message);
  }
} else {
  console.log("ℹ️ Email service is currently disabled (ENABLE_EMAIL != true)");
}

const safeTransporter = {
  sendMail: async (mailOptions) => {
    if (!isEmailEnabled || !realTransporter) {
      console.log(`ℹ️ [Email Disabled] Skipping email delivery to: ${mailOptions?.to || "recipient"}`);
      return { messageId: "email-disabled-mock-id" };
    }
    try {
      return await realTransporter.sendMail(mailOptions);
    } catch (error) {
      console.warn("⚠️ Email send attempt failed (gracefully caught):", error.message);
      return { messageId: "email-failed-mock-id", error: error.message };
    }
  },
};

export default safeTransporter;
