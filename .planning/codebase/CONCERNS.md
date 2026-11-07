# Codebase Concerns & Operational Risk Analysis

**Analysis Date:** 2026-11-07

## Executive Summary

This audit assesses the technical debt, security posture, medical safety boundaries, and operational failure modes of **E-Sanjeevani 2.0**. While the architecture demonstrates high functional ambition—integrating hybrid Node.js/Python services, longitudinal clinical intelligence, multi-category triage models, and real-time WebRTC telemedicine—critical vulnerabilities and structural weaknesses require urgent remediation before production scaling.

---

## 1. Authentication Flow & Session Management

### Dual Token Exposure & Storage Anti-Pattern
**Files:** `server/src/services/auth.service.js`, `server/src/middlewares/authMiddleware.js`, `client/src/utils/api.js`

- **Issue:** The authentication architecture intends to use HTTP-only cookies (`access_token` and `refresh_token`), but the server simultaneously returns both `accessToken` and raw `refreshToken` inside the JSON response payload (`server/src/services/auth.service.js:108-109, 205-206, 286`).
- **Client Behavior:** In `client/src/utils/api.js:23-52`, client JavaScript takes these raw tokens from response bodies and persists them into browser `localStorage` (`access_token_local` and `refresh_token_local`). It then attaches them as `Authorization: Bearer <token>` and `x-refresh-token` headers on outgoing requests.
- **Impact:** Persisting refresh tokens in `localStorage` nullifies the security guarantees of HTTP-only cookies. Any Cross-Site Scripting (XSS) vulnerability or third-party script injection can read `localStorage.getItem("refresh_token_local")` and achieve persistent, unrevoked account takeover.
- **Fix:**
  1. Cease returning `refreshToken` in JSON responses from `AuthService.login`, `AuthService.register`, and `AuthService.refresh`.
  2. Transmit the refresh token **exclusively** via HTTP-only, secure, `SameSite=Strict` (or `Lax`) cookies.
  3. Keep the access token in memory (or short-lived HTTP-only cookie) and eliminate all `localStorage` token storage in `client/src/utils/api.js`.

```javascript
// BEFORE (server/src/services/auth.service.js):
return {
  accessToken,
  refreshToken: refreshTokenRaw, // LEAKED TO JAVASCRIPT PAYLOAD
  user: { id: user.id, email: user.email, role: user.role }
};

// AFTER:
// Only set the HTTP-only cookie; never include refreshToken in the JSON body:
return {
  accessToken,
  user: { id: user.id, email: user.email, role: user.role }
};
```

### Uncached Database Hit on Every Request
**Files:** `server/src/middlewares/authMiddleware.js:43-56`

- **Issue:** On every authenticated HTTP request, `authMiddleware` executes a live query to PostgreSQL:
  ```javascript
  const result = await db.select(...).from(users).where(eq(users.id, userId)).limit(1);
  ```
- **Impact:** For high-frequency polling, dashboard queries, or WebSocket handshakes, this creates an $O(N)$ database query multiplier. Under heavy traffic, Neon Serverless connection pools become exhausted, creating latency spikes and 504 gateway timeouts.
- **Fix:** Embed user roles and status within a signed, short-lived JWT (15-minute expiry). Validate signature and claims statelessly in middleware; only query the database during token refresh or for sensitive state alterations.

### Insecure Backdoor Endpoint
**Files:** `server/src/services/auth.service.js:346-371`

- **Issue:** `AuthService.fixDoctorPassword` provides a shared `ADMIN_SECRET` endpoint to alter doctor credentials without audit trails or multi-factor authentication.
- **Fix:** Deprecate and remove this backdoor. Implement a standardized, cryptographically signed forgot-password email workflow with time-limited reset tokens.

---

## 2. Database Architecture & Neon Serverless Connection Risks

### Destructive Startup DDL Mutations
**Files:** `server/src/config/neonDb.js:34-111, 118-180`

- **Issue:** `server/src/server.js` invokes `checkPostgresConnection()`, which directly runs raw SQL DDL queries (`CREATE TABLE IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, and column introspection) on every application boot.
- **Catastrophic Risk:** In `server/src/config/neonDb.js:77-80`:
  ```javascript
  if (colCheck.rows.length === 0) {
    // Table exists with old legacy schema — drop old table
    await pool.query(`DROP TABLE IF EXISTS "prescription_items" CASCADE;`);
  }
  ```
  If an environment misconfiguration, permission hiccup, or schema introspection edge case causes `colCheck.rows.length === 0`, the server drops the entire `prescription_items` table in production, destroying all patient medication records.
- **Fix:** Remove runtime DDL from application startup code immediately. Rely strictly on version-controlled migration files via `drizzle-kit migrate` executed in CI/CD deployment pipelines.

### Zombie MongoDB Configuration
**Files:** `server/src/config/db.js:1-14`

- **Issue:** `server/src/config/db.js` maintains an unused Mongoose connection block (`mongoose.connect(process.env.MONGO_URI)`).
- **Impact:** Misleads developers, pollutes dependency management with unused packages, and creates confusion about dual-datastore configurations.
- **Fix:** Delete `server/src/config/db.js` and remove `mongoose` from `server/package.json`.

### Unindexed String-Serialized JSON Storage
**Files:** `server/src/config/neonDb.js:161-165`, `server/src/database/schema/patientHealthSummaries.js`

- **Issue:** In table `patient_health_summaries`, structured arrays such as `recurrent_symptoms`, `worsening_trends`, `comparative_metrics`, and `rag_retrieved_context` are stored as raw `text` fields rather than PostgreSQL `jsonb`.
- **Impact:** Inability to index, filter, or query specific medical flags at the database layer (e.g. querying patients with deteriorating systolic BP trends).
- **Fix:** Alter schema columns to `jsonb` and create GIN indexes for queryable fields.

---

## 3. Model Memory Footprint & Python ML Server Risks

### High RAM Footprint vs Container Limits
**Files:** `ai-model/requirements.txt`, `ai-model/app.py`

- **Issue:** The Python service loads hefty data science libraries (`pandas`, `scikit-learn`, `numpy`, `shap`, `matplotlib`, `seaborn`). On startup and initial module import, the base Python process consumes between 250MB and 420MB of resident set size (RSS).
- **Impact:** Deployment targets such as Render (Free tier: 512MB RAM) or small Docker instances risk triggering Linux Out-Of-Memory (OOM) killer terminations when processing concurrent triage inferences alongside SHAP tree explainers.
- **Fix:**
  1. Decouple heavy analysis tools (`matplotlib`, `seaborn`, `shap`) from the live inference path.
  2. Pre-generate and cache SHAP feature weights during training (`ai-model/scripts/train_all_category_models.py`) so inference requires only scikit-learn matrix multiplications without computing live Shapley values.
  3. Deploy using Gunicorn with `--workers 1 --threads 4` and set worker memory recycling (`--max-requests 500`).

### Thread-Unsafe Artifact Lazy-Loading
**Files:** `ai-model/app.py:119-160`

- **Issue:** `get_category_artifacts(category_key)` lazily loads `.pkl` files into global dictionaries `_models`, `_encoders`, `_feature_names` without synchronization primitives:
  ```python
  if category_key not in _models:
      _models[category_key] = joblib.load(model_file)
  ```
- **Impact:** If multiple requests for an unprimed category hit the service simultaneously, duplicate disk reads and race conditions occur, intermittently corrupting in-memory model state or throwing `ValueError: Buffer is not writeable`.
- **Fix:** Protect lazy initialization with a threading lock:
  ```python
  import threading
  _model_lock = threading.Lock()

  def get_category_artifacts(category_key: str):
      with _model_lock:
          if category_key not in _models:
              ...
  ```

---

## 4. External Dependencies & Credential Fragility

### Hugging Face Router & LLM Hallucination Risk
**Files:** `server/src/services/doctorAssistant.service.js:210-237`

- **Issue:** The Doctor Assistant CDSS relies directly on `https://router.huggingface.co/v1` with model `meta-llama/Llama-3.1-8B-Instruct` using `process.env.HF_TOKEN`.
- **Operational Vulnerabilities:**
  - Free/Pro Hugging Face inference endpoints experience frequent 429 Rate Limited or 503 Service Unavailable errors during traffic surges.
  - No fallback circuit breaker exists. If Hugging Face is slow, requests block up to standard Axios socket timeouts.
- **Medical Safety Hazards:** The system prompt (`doctorAssistant.service.js:189-206`) explicitly instructs the model to recommend:
  `"Recommended Management & Pharmacotherapy (including precise dosages, route, and frequency)"`.
  An unconstrained 8B parameter model can hallucinate toxic dosages, drug-drug contraindications, or inappropriate therapies without formal pharmacological verification guardrails.
- **Fix:**
  1. Add strict timeout limits (5000ms) with circuit breaker patterns.
  2. Implement an automated pharmacological safety layer (e.g. RxNorm / DrugBank checks) before presenting generated dosages to physicians.
  3. Attach clear clinical decision support warnings on every assistant response.

### Phantom Email Confirmation & Silent Failures
**Files:** `server/src/emails/emailTransporter.js:35-48`, `server/src/emails/sendAppointmentEmail.js:596-605`, `server/src/cron/consultationReminderJob.js:87-95`

- **Issue:** When `ENABLE_EMAIL !== "true"` or OAuth2 token verification fails, `emailTransporter.sendMail()` intercepts the call, prints a console warning, and returns `{ messageId: "email-disabled-mock-id" }` without throwing.
- **Impact:** Callers such as `sendConsultationReminderEmail` treat this as a success and return `{ success: true }`. Consequently, `consultationReminderJob` flags `reminderSent: true` in PostgreSQL:
  ```javascript
  if (result.success) {
    await db.update(consultations).set({ reminderSent: true, reminderSentAt: new Date() });
  }
  ```
  The system falsely records that appointment and emergency reminders were dispatched, leaving both doctor and patient unaware of the upcoming consultation.
- **Fix:** Distinguish between actual delivery and simulated mocks. Return `{ success: false, simulated: true }` when email is disabled so calling jobs do not record false delivery confirmations.

### Exact-Minute Cron Matching Flaw
**Files:** `server/src/cron/consultationReminderJob.js:10-53`

- **Issue:** The reminder job runs every minute (`* * * * *`) and queries consultations with:
  ```javascript
  eq(consultations.startTime, currentTime) // where currentTime = "14:30"
  ```
- **Failure Mode:** If the server thread experiences event-loop lag, GC pauses, or process sleeping on cloud hosts (such as Render spin-downs) across the :00 second boundary, the job executes at :01 of the next minute. Any appointment scheduled for the missed minute is permanently skipped because `consultations.startTime` no longer matches `currentTime`.
- **Fix:** Query using a window range rather than exact equality:
  ```javascript
  and(
    gte(consultations.startTime, windowStart),
    lte(consultations.startTime, windowEnd),
    eq(consultations.reminderSent, false)
  )
  ```

---

## 5. Error Handling Fallbacks & Silent Heuristic Masking

### Fake Diagnostic Confidence in Triage Fallback
**Files:** `server/src/routes/feverRoutes.js:253-280`

- **Issue:** When the Python ML microservice is unreachable, `server/src/routes/feverRoutes.js` falls back to an internal JavaScript heuristic engine `evaluateClinicalFallback()`.
- **Critical Risk:** In line 259, the fallback arbitrarily hardcodes:
  ```javascript
  overall_confidence: 88.0,
  urgency_level: "moderate",
  top_ranking: [{ rank: 1, disease: topDisease, score: 0.88, confidence_pct: 88.0 }]
  ```
  Regardless of actual patient symptom severity or ambiguity, the fallback claims an authoritative **88.0% confidence** generated solely from basic `if/else` checks (defaulting to "Viral Fever" or "Urinary Tract Infection").
- **Medical Hazard:** A patient with serious or undifferentiated sepsis may be lulled into complacency by an AI report stating 88% certainty of "Viral Fever".
- **Fix:** Clearly disclose the fallback engine to the user interface. Return `confidence_pct: null`, label the output `engine: "rule-based-provisional"`, and display an explicit banner stating that machine-learning verification was unavailable.

```javascript
// BEFORE (server/src/routes/feverRoutes.js):
overall_confidence: 88.0,

// AFTER:
overall_confidence: null,
isProvisionalRuleAssessment: true,
engineStatus: "fallback_rules_engine",
warning: "Provisional differential assessment. Statistical ML model was offline."
```

### Masked Service Health Endpoints
**Files:** `server/src/routes/feverRoutes.js:26-42`

- **Issue:** The health route `/api/fever/health` catches any connection error to the Python microservice and returns HTTP 200 with `all_models_ready: true`:
  ```javascript
  } catch (error) {
    return res.status(200).json({
      success: true,
      all_models_ready: true,
      engine: "clinical-differential-rules-fallback",
    });
  }
  ```
- **Impact:** External uptime monitors, Docker orchestrators, and load balancers cannot detect that the Python ML container has crashed, preventing automated restarts or failover alerting.
- **Fix:** Return HTTP 503 or `{ success: false, all_models_ready: false, activeEngine: "fallback" }` when the primary ML service is down.

### Aggressive Timeout Triggering Silent Degradation
**Files:** `server/src/services/longitudinalIntelligence.service.js:183-195`

- **Issue:** The timeout for calling the Python longitudinal analysis service is set to just 3500ms (`timeout: 3500`).
- **Impact:** If the Python microservice experiences container cold-start or computes extensive comparative trends, the request immediately aborts and silently defaults to the regex keyword matcher `_runJsLongitudinalEngine`.
- **Fix:** Increase the timeout to 8000ms–10000ms for complex longitudinal history synthesis, or decouple analysis into an asynchronous background task with WebSocket notification.

---

## 6. Medical Safety Boundaries, Legal & Security Considerations

### Unauthenticated Public Exposure of Confidential Medical Records
**Files:** `server/src/app.js:87`, `server/src/services/prescriptionPdfService.js:34-36`, `server/src/routes/medicalRecordRoutes.js:18-37`

- **Issue:** Static file serving is mounted directly over the uploads folder:
  ```javascript
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  ```
- **Catastrophic Privacy Breach:**
  - Prescriptions are saved to disk as `/uploads/prescriptions/prescription-${recordId}.pdf`.
  - Patient lab reports, scans, and attachments are saved to `/uploads/attachments/`.
  - **Anyone on the internet** who obtains or guesses an attachment URL or prescription name can download full patient clinical files, names, medical diagnoses, and prescribed drugs without providing an authentication token or cookie.
- **Compliance Violation:** Direct breach of HIPAA, GDPR, and India's Digital Personal Data Protection Act (DPDPA 2023) / DISHA regulations.
- **Fix:**
  1. Remove `express.static` for `/uploads`.
  2. Implement an authenticated streaming route: `GET /api/prescriptions/:id/pdf` and `GET /api/medical-records/attachments/:id`.
  3. Verify in middleware that `req.user.id` is either the patient who owns the file or a doctor with a verified active consultation.
  4. In production, store all documents in encrypted private cloud object storage (AWS S3, GCP Cloud Storage) using short-lived pre-signed URLs.

### Fraudulent "Digitally Signed" Prescription Claims
**Files:** `server/src/services/prescriptionPdfService.js:298-308`

- **Issue:** The generated PDF hardcodes:
  `"✓ DIGITALLY SIGNED & VERIFIED"`
  `"This prescription is legally valid under IT Act 2000 & Telemedicine Guidelines."`
- **Legal Concern:** No cryptographic key pair, DSC (Digital Signature Certificate), PKI certificate, or verifiable HMAC signature is embedded into the document. Printing a green checkmark and claiming compliance under the Information Technology Act 2000 without actual asymmetric cryptographic signing exposes the organization to severe legal liability under medical council regulations.
- **Fix:** Remove the claim or implement bona fide digital document signing using doctor-specific private keys / HSM with embedded X.509 signatures into the PDF via libraries like `pdf-lib` and `node-signpdf`.

### Broken Object Level Authorization (BOLA / IDOR) in Clinical Endpoints
**Files:** `server/src/controllers/prescriptionController.js:92-103`, `server/src/controllers/patientHistoryController.js:205-235`

- **Issue 1 (Prescription Dumping):** In `getPatientPrescriptions`:
  ```javascript
  export const getPatientPrescriptions = async (req, res) => {
    const { patientId } = req.params;
    const { id: requesterId, role } = req.user;
    if (role === "patient" && requesterId !== patientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    // MISSING: If role === "doctor", no relationship verification is performed!
    const rxList = await PrescriptionRepository.findByPatientId(patientId);
  ```
  Any user with a "doctor" account can query `/api/prescriptions/patient/:patientId` with any arbitrary UUID and dump that patient's entire prescription history across all doctors.
- **Issue 2 (Longitudinal Record Spying):** In `getPatientLongitudinalIntelligence`:
  Any doctor can query `/api/patient-history/patients/:patientId/longitudinal-intelligence` for any patient in the database without an active consultation relationship check.
- **Fix:** Enforce doctor-patient relationship checks across all clinical read routes:
  ```javascript
  if (role === "doctor") {
    const hasActiveRelationship = await PatientHistoryService.verifyDoctorPatientRelationship(requesterId, patientId);
    if (!hasActiveRelationship) {
      return res.status(403).json({ success: false, message: "No authorized clinical relationship with this patient" });
    }
  }
  ```

### Arbitrary File Upload & Stored XSS
**Files:** `server/src/routes/medicalRecordRoutes.js:23-37`, `server/src/routes/patientHistoryRoutes.js:27-41`

- **Issue:** Multer configuration does not validate MIME types (`fileFilter` is omitted), preserving raw file extensions:
  ```javascript
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Only checks size, not file type!
  });
  ```
- **Risk:** Malicious users can upload `.html`, `.svg`, or `.xhtml` files containing embedded `<script>` tags. Because `/uploads` is statically hosted on the same domain, accessing the uploaded file executes arbitrary JavaScript in the victim's session (Stored Cross-Site Scripting).
- **Fix:** Restrict uploads using `fileFilter` to strictly allow `image/jpeg`, `image/png`, and `application/pdf`. Store uploaded files with `.bin` or randomized extensions, and set `Content-Disposition: attachment` when serving.

### Unauthenticated WebSocket Telemedicine Rooms
**Files:** `server/src/socket/socketServer.js:48-80`

- **Issue:** The Socket.io server does not authenticate socket connections via JWT middleware (`io.use(...)`). Any connected client can emit `join-room` with an arbitrary `consultationId`:
  ```javascript
  socket.on("join-room", (data) => {
    const consultationId = data.consultationId || data;
    socket.join(consultationId);
  ```
- **Impact:** An unauthorized third party who discovers a `consultationId` can join ongoing teleconsultation rooms, intercept WebRTC SDP offers/answers, eavesdrop on real-time consultation chats, or broadcast audio/video disruptions.
- **Fix:** Authenticate all socket connections during the handshake using the user's JWT. Validate that `socket.user.id` is either the appointed doctor or patient for that specific `consultationId` before executing `socket.join(consultationId)`.

### Permissive Wildcard CORS Configuration
**Files:** `server/src/app.js:39-83`

- **Issue:** The CORS configuration contains an over-permissive regular expression:
  ```javascript
  /\.vercel\.app$/.test(origin)
  ```
- **Impact:** Any malicious actor hosting a web application on Vercel (e.g. `attacker-site.vercel.app`) can make credentialed (`credentials: true`) requests to the E-Sanjeevani API, accessing patient data via the user's active session.
- **Fix:** Specify exact production domains in `allowedOrigins` (e.g. `https://e-sanjeevani-2-0.vercel.app`) rather than wildcarding all Vercel domains.

---

## 7. Operational Failure Modes & Fragile Areas

| Component / File | Vulnerability / Failure Mode | Operational Impact | Recommended Mitigation |
|---|---|---|---|
| `uploads/` directory on cloud container hosts | Local disk storage on ephemeral filesystems (Render, Heroku, K8s) | Uploaded attachments and generated prescription PDFs are permanently erased upon container restart or redeploy. | Migrate file uploads to AWS S3, Cloudinary, or Google Cloud Storage. |
| `server/src/socket/socketServer.js:3-4` | In-memory socket rooms (`roomUsers`, `socketRoomMap`) | If backend runs on multiple instances/containers, WebRTC signaling fails between users connected to different instances. | Implement `@socket.io/redis-adapter` for distributed pub/sub state. |
| `server/src/app.js` | Missing `helmet` security headers & rate limiters | Vulnerable to clickjacking, MIME-sniffing, and credential brute-force attacks. | Install `helmet` and `express-rate-limit` on `/api/auth/*` and `/api/triage/*`. |
| `server/src/services/longitudinalIntelligence.service.js:119-127` | N+1 database queries in `hydratedPrescriptions` | Issuing $N$ separate queries for prescription items degrades database performance for patients with extensive medical histories. | Use a single SQL `LEFT JOIN` or batch query (`inArray(prescriptionItems.prescriptionId, rxIds)`). |
| `server/src/cron/consultationReminderJob.js:8-124` | Multi-instance cron execution | If horizontally scaled, every server replica executes the reminder job simultaneously, sending duplicate emails to patients. | Use distributed job locks (BullMQ with Redis, or PostgreSQL advisory locks). |

---

## 8. Prioritized Remediation Roadmap

```
CRITICAL (Within 48 Hours)
├── 1. Discontinue static file hosting on /uploads (Prevent open access to prescriptions & lab reports)
├── 2. Remove raw refreshToken from auth response bodies and purge localStorage token storage in client
├── 3. Enforce doctor-patient relationship authorization checks on prescription & history endpoints (Fix BOLA)
└── 4. Authenticate WebSocket connections before allowing socket.join(consultationId)

HIGH PRIORITY (Within 1-2 Weeks)
├── 5. Eliminate destructive runtime DDL (DROP TABLE) from server startup; adopt Drizzle migrations
├── 6. Strip hardcoded 88.0% confidence score from triage fallback; label provisional rule-based output
├── 7. Fix exact-minute matching bug in consultationReminderJob to prevent skipped reminders
└── 8. Restrict file upload MIME types in Multer to prevent Stored XSS via HTML/SVG uploads

MEDIUM PRIORITY (Within Sprint Cycle)
├── 9. Tighten CORS regex to eliminate wildcard *.vercel.app origin trust
├── 10. Migrate local upload storage to encrypted private S3/Cloud Storage buckets
├── 11. Add Redis adapter to Socket.io to support multi-instance horizontal scaling
└── 12. Add pharmacological validation guardrails to Doctor Assistant AI outputs
```

---

*Concerns audit: 2026-11-07*
