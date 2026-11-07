# Phase 6 Research: Production Hardening, Security & Infrastructure

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Status**: Complete & Verified Against Live Codebase  
> **Target Files**: `server/src/app.js`, `server/src/services/auth.service.js`, `client/src/utils/api.js`, `server/src/controllers/prescriptionController.js`, `server/src/controllers/patientHistoryController.js`, `server/src/socket/socketServer.js`, `server/src/config/neonDb.js`, `server/src/routes/feverRoutes.js`, `server/src/cron/consultationReminderJob.js`  

---

## 1. Medical Document Streaming & Authorization Architecture

### Current Vulnerability
In `server/src/app.js:87`:
```javascript
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
```
This serves any file in `server/uploads/prescriptions/` and `server/uploads/attachments/` directly without checking authentication or user identity.

### Target Pattern
1. Remove `app.use("/uploads", express.static(...))`.
2. Add authenticated streaming endpoint in `prescriptionController.js`:
```javascript
export const streamPrescriptionPdf = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const rx = await PrescriptionRepository.findById(id);
  if (!rx) return res.status(404).json({ success: false, message: "Prescription not found" });

  const isPatient = rx.patientId === user.id;
  const isDoctor = rx.doctorId === user.id;
  let hasRelationship = false;

  if (user.role === "doctor" && !isDoctor) {
    hasRelationship = await PatientHistoryService.verifyDoctorPatientRelationship(user.id, rx.patientId);
  }

  if (!isPatient && !isDoctor && !hasRelationship && user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized access to prescription" });
  }

  const filePath = path.resolve(rx.pdfUrl.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "PDF file not found on disk" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="prescription-${id}.pdf"`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  fs.createReadStream(filePath).pipe(res);
};
```
3. Mirror this pattern for `GET /api/patient-history/attachments/:attachmentId`.

---

## 2. In-Memory Access Token & Pure Cookie Refresh Flow

### Current Vulnerability
`server/src/services/auth.service.js` returns:
```javascript
return {
  accessToken,
  refreshToken: refreshTokenRaw, // Leaks to JavaScript
  user: ...
};
```
And `client/src/utils/api.js` writes it to `localStorage`:
```javascript
localStorage.setItem("refresh_token_local", refreshToken);
```

### Target Pattern
1. In `server/src/services/auth.service.js`, remove `refreshToken: refreshTokenRaw` from return objects of `login`, `register`, and `refreshToken`.
2. In `client/src/utils/api.js`:
   - Store `let inMemoryAccessToken = null;`
   - Provide `setAccessToken(token)` and `getAccessToken()`.
   - On Axios 401 interceptor, invoke `POST /api/auth/refresh` with `withCredentials: true` (cookies sent automatically).
   - If refresh succeeds, store new `accessToken` in memory and replay original request.
   - If refresh fails, clear auth state and redirect to `/auth`.

---

## 3. WebRTC Socket.IO Handshake Authentication

### Current Vulnerability
In `server/src/socket/socketServer.js`, `io.on("connection", (socket) => ...)` has zero auth checks. Anyone can call `socket.emit("join-room", consultationId)`.

### Target Pattern
```javascript
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication error: No token provided"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Inside connection:
socket.on("join-room", async (data) => {
  const consultationId = data.consultationId || data;
  const consultation = await ConsultationRepository.findById(consultationId);
  if (!consultation) {
    return socket.emit("error", { message: "Consultation not found" });
  }

  const isParticipant =
    consultation.patientId === socket.user.id ||
    consultation.doctorId === socket.user.id ||
    socket.user.role === "admin";

  if (!isParticipant) {
    return socket.emit("error", { message: "Unauthorized access to this consultation room" });
  }

  socket.join(consultationId);
  // Continue standard room join flow...
});
```

---

## 4. Database Startup DDL Safety

### Current Hazard
In `server/src/config/neonDb.js:77-80`:
```javascript
if (colCheck.rows.length === 0) {
  await pool.query(`DROP TABLE IF EXISTS "prescription_items" CASCADE;`);
}
```
If column check fails, all patient prescription items are deleted.

### Target Pattern
Remove the destructive `DROP TABLE` block entirely. Retain `ensureLongitudinalHealthTablesExist()` with non-destructive `CREATE TABLE IF NOT EXISTS` checks. Delete unused `server/src/config/db.js`.

---

## 5. Transparent Clinical Fallback & Reminder Cron Window

1. **Fallback Confidence**:
   - In `server/src/routes/feverRoutes.js:259`, change `overall_confidence: 88.0` to `overall_confidence: null`.
   - Return `isProvisionalRuleAssessment: true`, `engineStatus: "fallback_rules_engine"`.
   - In `AiTriage.jsx`, render amber notification: `"Notice: Machine learning microservice offline. Displaying rule-based provisional guidance."`
2. **Reminder Job Window**:
   - In `server/src/cron/consultationReminderJob.js`, compute:
     ```javascript
     const now = new Date();
     const windowStart = new Date(now.getTime() - 2 * 60000); // 2 min ago
     const windowEnd = new Date(now.getTime() + 5 * 60000);   // 5 min ahead
     ```
   - Query scheduled consultations within this window where `reminderSent == false`.
   - Do not set `reminderSent = true` if `result.simulated === true`.

