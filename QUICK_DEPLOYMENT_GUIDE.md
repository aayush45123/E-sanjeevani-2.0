# 🚀 Quick Start Deployment Guide

## 5-Minute Setup

### Step 1: Install Package (30 seconds)

```bash
cd server
npm install resend
```

**Expected Output:**

```
added 1 package in 3.4s
```

### Step 2: Verify API Key (1 minute)

Check your `.env` file:

```bash
cat .env | grep RESEND_API_KEY
```

**Should see:**

```
RESEND_API_KEY=re_VWr9HKGS_JM9UmsHAKQ8pMecsc2VsjtnU
FRONTEND_URL=http://localhost:5173
```

### Step 3: Restart Backend (1 minute)

**Terminal 1:**

```bash
cd server
npm run dev
```

**Look for:**

```
✅ Server running on http://localhost:5000
```

### Step 4: Restart Frontend (1 minute)

**Terminal 2:**

```bash
cd client
npm run dev
```

**Look for:**

```
✅ Local: http://localhost:5173
```

### Step 5: Test (2 minutes)

1. Open browser → `http://localhost:5173`
2. Login as patient
3. Book an appointment
4. **Check both email inboxes** ✉️

---

## ✅ Success Indicators

### Email Received Successfully

```
✅ Subject has doctor name
✅ Date and time are correct
✅ Contains appointment details
✅ Has a button to click
✅ Arrives within 30 seconds
```

### Doctor Email

- Subject: `New Appointment - [Patient Name] on [Date]`
- Button: "Go to Dashboard" → `http://localhost:5173/dashboard`

### Patient Email

- Subject: `Appointment Confirmed - Dr. [Doctor Name] on [Date]`
- Button: "View My Consultations" → `http://localhost:5173/consultations`

---

## 📊 Complete File List

All files that were created/updated:

| File                                               | Status        | Purpose                  |
| -------------------------------------------------- | ------------- | ------------------------ |
| `server/src/utils/sendAppointmentEmail.js`         | ✨ NEW        | Email sending utility    |
| `server/src/controllers/consultationController.js` | ✏️ UPDATED    | Integration with booking |
| `server/.env`                                      | ✅ CONFIGURED | API key + Frontend URL   |
| `server/package.json`                              | ✏️ UPDATED    | Resend dependency        |
| `RESEND_EMAIL_SETUP_GUIDE.md`                      | 📄 NEW        | Complete setup guide     |
| `EMAIL_QUICK_START.md`                             | 📄 NEW        | Quick reference          |
| `EMAIL_INTEGRATION_CHECKLIST.md`                   | 📄 NEW        | Testing checklist        |
| `EMAIL_SUMMARY.md`                                 | 📄 NEW        | Feature summary          |
| `EMAIL_TECHNICAL_REFERENCE.md`                     | 📄 NEW        | Technical details        |

---

## 🎯 What's Happening Behind Scenes

When you book an appointment:

```
1. Click "Book Appointment"
   ↓
2. Frontend validates and sends to backend
   ↓
3. Backend checks doctor availability
   ↓
4. Saves appointment to MongoDB
   ↓
5. Marks time slot as "booked"
   ↓
6. Calls sendAppointmentEmail() function
   ↓
7. Generates beautiful HTML email for patient
   ├─ Shows: Doctor name, date, time, consultation type
   └─ Link: http://localhost:5173/consultations
   ↓
8. Generates beautiful HTML email for doctor
   ├─ Shows: Patient name, date, time, consultation type
   └─ Link: http://localhost:5173/dashboard
   ↓
9. Sends both via Resend API (parallel)
   ↓
10. Returns "Success" to frontend
   ↓
11. Both emails arrive in inboxes (30 sec)
```

---

## 🆘 If Something Goes Wrong

### Problem: "Module not found: resend"

```bash
npm install resend
npm run dev
```

### Problem: "Cannot find sendAppointmentEmail"

- Check file exists: `server/src/utils/sendAppointmentEmail.js`
- Check import line in `consultationController.js`
- Restart server: `npm run dev`

### Problem: "RESEND_API_KEY undefined"

- Check `.env` file exists in `server/` folder
- Check key is correct: `re_VWr9HKGS_JM9UmsHAKQ8pMecsc2VsjtnU`
- **No spaces around =**
- Restart server: `npm run dev`

### Problem: "Emails not arriving"

1. Wait 30 seconds
2. Check spam folder
3. Check user has email in database
4. Check server logs for errors
5. Try booking again

### Problem: "Wrong email template"

- Edit: `server/src/utils/sendAppointmentEmail.js`
- Look for: `const patientEmailHtml = ...` or `const doctorEmailHtml = ...`
- Update HTML content
- Restart: `npm run dev`

---

## 📧 Email Content Preview

### For Patients

```
From: E-Sanjeevani 2.0 <onboarding@resend.dev>
Subject: Appointment Confirmed - Dr. Smith on Monday, May 4, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi Jane Doe,

Great news! Your appointment with Dr. John Smith has been confirmed.

📋 APPOINTMENT DETAILS
Date: Monday, May 4, 2026
Time: 02:00 PM - 02:30 PM
Type: Video Consultation
Doctor: Dr. John Smith

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Please join 5 minutes early. The consultation link is available
in your dashboard.

[View My Consultations]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E-Sanjeevani 2.0 • Your Healthcare, Your Way
```

### For Doctors

```
From: E-Sanjeevani 2.0 <onboarding@resend.dev>
Subject: New Appointment - Jane Doe on Monday, May 4, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi Dr. Smith,

You have a new appointment booking.

👤 PATIENT DETAILS
Patient: Jane Doe
Date: Monday, May 4, 2026
Time: 02:00 PM - 02:30 PM
Type: Video Consultation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Please log in 5 minutes early to prepare.

[Go to Dashboard]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E-Sanjeevani 2.0 • Your Healthcare, Your Way
```

---

## 📋 Testing Checklist

```
Pre-Test
☐ Backend running (Terminal 1: npm run dev)
☐ Frontend running (Terminal 2: npm run dev)
☐ MongoDB connected
☐ Patient account exists with email
☐ Doctor account exists with email

Test Booking
☐ Login as patient
☐ Navigate to book appointment
☐ Select a doctor
☐ Select future date
☐ Select time slot
☐ Fill symptoms
☐ Click "Book Appointment"
☐ See success message

Check Emails
☐ Patient inbox - received email
☐ Doctor inbox - received email
☐ Patient email has correct date/time
☐ Doctor email has correct date/time
☐ Both have correct names
☐ Both have consultation type
☐ Patient button works → /consultations
☐ Doctor button works → /dashboard
```

---

## 🔄 Full Workflow

```bash
# Terminal 1: Install & Start Backend
cd server
npm install
npm run dev
# Wait for: ✅ Server running on port 5000

# Terminal 2: Start Frontend
cd client
npm run dev
# Wait for: ✅ Local: http://localhost:5173

# Browser: Test
# 1. Open http://localhost:5173
# 2. Login as patient
# 3. Click "Book Consultation"
# 4. Fill form and click "Book"
# 5. Check emails arrive

# ✅ Done! System working!
```

---

## 🎉 Success = This Works

1. ✅ Appointment booked without errors
2. ✅ Patient receives email within 30 seconds
3. ✅ Doctor receives email within 30 seconds
4. ✅ Email shows correct appointment details
5. ✅ Buttons in email work correctly
6. ✅ No errors in server console

---

## 📱 Using Different Email Services

Already using **Resend**? Great choice! 🎯

Want to switch later? You can use:

- **SendGrid** (commercial)
- **Mailgun** (commercial)
- **AWS SES** (cheap)
- **Nodemailer** (SMTP)

Just swap the API calls in `sendAppointmentEmail.js`

---

## 🔐 Security Reminders

```
✅ API key in .env (not in code)
✅ .env in .gitignore (not on GitHub)
✅ Never share API key
✅ Use HTTPS in production
✅ Rotate keys regularly
```

---

## 📈 Next Features

After emails work, you can add:

1. **SMS Notifications** - Text instead of email
2. **In-App Notifications** - Badge in app
3. **Email Reminders** - 24 hours before
4. **Appointment Rescheduling** - Email when changed
5. **Feedback Emails** - After consultation
6. **Custom Templates** - Your branding

---

## 🆘 Need Help?

1. **Check Logs**: Look at terminal output
2. **Check Email**: Look for errors
3. **Check Database**: Verify user has email field
4. **Check .env**: Verify API key is set
5. **Restart Server**: `npm run dev`
6. **Clear Cache**: Hard refresh browser (Ctrl+Shift+R)

---

## ⚡ Quick Commands Reference

```bash
# Install package
npm install resend

# Start backend
npm run dev

# Start frontend
npm run dev

# Check env variable
echo $RESEND_API_KEY

# View logs
npm run dev

# Kill server
Ctrl+C

# Clear cache
rm -rf node_modules && npm install
```

---

## ✨ You're All Set!

Everything is configured and ready to go.

**Next Step:** Run the commands above and book an appointment! 🎉

Your emails should arrive within 30 seconds of booking.
