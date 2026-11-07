# Phase 6 Specification: Production Hardening, Security & Infrastructure

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Target Milestone**: Milestone 2.1  
> **Author**: GSD Socratic Spec Engine  
> **Status**: APPROVED & LOCKED  
> **Ambiguity Score**: **0.07** (Gate Passed: $\le 0.20$)  
> **Created**: November 7, 2026  

---

## 1. Problem Statement & Phase Intent

The codebase mapping audit ([`CONCERNS.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/codebase/CONCERNS.md)) surfaced critical security vulnerabilities, data leakage vectors, operational failure modes, and clinical safety issues. While the platform has verified functional features across triage, consultation, and longitudinal health intelligence, deploying to production requires eliminating critical threat surfaces:
1. Publicly accessible medical records and prescription PDFs via unauthenticated `/uploads` static file mounts.
2. Dual-token leakage into browser `localStorage`, bypassing HTTP-only cookie security guarantees.
3. Broken Object Level Authorization (BOLA) allowing any doctor to dump all prescriptions and longitudinal histories of any patient in the database.
4. Unauthenticated Socket.IO rooms allowing unauthorized third parties to join ongoing telemedicine sessions.
5. Catastrophic server-boot DDL (`DROP TABLE IF EXISTS "prescription_items" CASCADE;`) risking production data loss.
6. Deceptive 88.0% hardcoded confidence score in rule-based clinical fallback when Python ML is offline.
7. Missed consultation email reminders caused by exact-minute cron string matching.
8. Stored XSS risks from unrestricted file uploads in Multer.

**Phase Goal**: Remediate all Critical and High priority security, architectural, and clinical safety issues, hardening the platform for compliant, safe production deployment.

---

## 2. In-Scope Falsifiable Requirements

### 2.1 Medical Document Protection & Streaming Authorization (SEC-DOC)
- **REQ-SEC-DOC-01**: The static route `app.use("/uploads", express.static(...))` in `server/src/app.js` MUST be removed completely. Direct URL access to `/uploads/attachments/*` or `/uploads/prescriptions/*` must return 404.
- **REQ-SEC-DOC-02**: An authenticated streaming endpoint `GET /api/prescriptions/:id/pdf` MUST be implemented. Access MUST be permitted ONLY if:
  - The authenticated user is the patient (`patient_id == req.user.id`), OR
  - The authenticated user is the doctor who authored the prescription (`doctor_id == req.user.id`), OR
  - The authenticated user is a verified doctor with an active or completed consultation record with that patient.
- **REQ-SEC-DOC-03**: An authenticated streaming endpoint `GET /api/medical-records/attachments/:attachmentId` MUST be implemented, with access restricted strictly to the owning patient or an authorized attending physician.
- **REQ-SEC-DOC-04**: Medical documents streamed via these routes MUST include HTTP response headers:
  - `Content-Disposition: attachment; filename="..."`
  - `Content-Type: application/pdf` (or verified image MIME)
  - `X-Content-Type-Options: nosniff`
  - `Cache-Control: private, no-cache, no-store, must-revalidate`

### 2.2 Client-Side Token Security & In-Memory Session Management (SEC-AUTH)
- **REQ-SEC-AUTH-01**: `AuthService.login`, `AuthService.register`, and `AuthService.refreshToken` MUST NEVER include `refreshToken` in the JSON response payload. Refresh tokens MUST be transmitted exclusively via `httpOnly`, `Secure`, `SameSite=Strict` (or `Lax` in dev) cookies.
- **REQ-SEC-AUTH-02**: In `client/src/utils/api.js` and `client/src/utils/auth.js`, all usage of `localStorage.setItem("refresh_token_local", ...)` and `localStorage.setItem("access_token_local", ...)` MUST be purged.
- **REQ-SEC-AUTH-03**: The client MUST maintain the short-lived access token in JavaScript module memory. Silent refresh MUST automatically trigger on application initialization and upon receiving HTTP 401 using the HTTP-only refresh cookie (`withCredentials: true`).
- **REQ-SEC-AUTH-04**: The insecure administrative backdoor `AuthService.fixDoctorPassword` (`server/src/services/auth.service.js`) MUST be deleted.

### 2.3 Broken Object Level Authorization (BOLA) Remediation (SEC-BOLA)
- **REQ-SEC-BOLA-01**: `prescriptionController.getPatientPrescriptions` (`GET /api/prescriptions/patient/:patientId`) MUST verify that if `req.user.role === "doctor"`, an active or historical consultation exists linking `req.user.id` with `patientId`. If no clinical relationship exists, return HTTP 403 Forbidden.
- **REQ-SEC-BOLA-02**: `patientHistoryController.getPatientLongitudinalIntelligence` (`GET /api/patient-history/patients/:patientId/longitudinal-intelligence`) MUST verify doctor-patient authorization before returning longitudinal clinical insights.

### 2.4 WebRTC WebSocket Handshake Authentication (SEC-WS)
- **REQ-SEC-WS-01**: `server/src/socket/socketServer.js` MUST attach authentication middleware `io.use((socket, next) => ...)` that verifies the user's JWT from `socket.handshake.auth.token` or the cookie header. Unauthenticated socket connections MUST be rejected with `Authentication error`.
- **REQ-SEC-WS-02**: When a socket emits `join-room { consultationId }`, the server MUST verify against PostgreSQL that `socket.user.id` equals either `consultation.patientId` or `consultation.doctorId`. Unauthorized room joins MUST be rejected and logged.

### 2.5 Database Initialization & Startup Safety (SEC-DB)
- **REQ-SEC-DB-01**: In `server/src/config/neonDb.js`, line 77–80 executing `DROP TABLE IF EXISTS "prescription_items" CASCADE;` MUST be completely deleted.
- **REQ-SEC-DB-02**: Non-destructive `CREATE TABLE IF NOT EXISTS` checks for `patient_health_metrics` and `patient_health_summaries` in `ensureLongitudinalHealthTablesExist()` MUST be preserved for zero-friction schema synchronization on startup.
- **REQ-SEC-DB-03**: The legacy unused `server/src/config/db.js` file (Mongoose connection block) MUST be deleted.

### 2.6 Transparent Clinical Fallback & Health Reporting (SEC-CLIN)
- **REQ-SEC-CLIN-01**: In `server/src/routes/feverRoutes.js`, the hardcoded `overall_confidence: 88.0` in `evaluateClinicalFallback()` MUST be replaced with `overall_confidence: null`.
- **REQ-SEC-CLIN-02**: Fallback responses MUST explicitly return `isProvisionalRuleAssessment: true` and `engineStatus: "fallback_rules_engine"`.
- **REQ-SEC-CLIN-03**: Frontend components displaying triage results (`AiTriage.jsx`) MUST render an explicit visual amber disclaimer banner when `isProvisionalRuleAssessment === true`, notifying the clinician that statistical ML inference was offline and rule heuristics were applied.
- **REQ-SEC-CLIN-04**: `GET /api/fever/health` MUST return HTTP 503 Service Unavailable with `{ success: false, all_models_ready: false, activeEngine: "fallback" }` when the Python microservice is down, rather than masking failures with HTTP 200.

### 2.7 Consultation Reminder Cron Query Reliability (SEC-CRON)
- **REQ-SEC-CRON-01**: `server/src/cron/consultationReminderJob.js` MUST replace exact-minute matching (`startTime == currentTime`) with a 5-minute sliding window query (`gte(startTime, windowStart)` and `lte(startTime, windowEnd)`) filtered by `reminderSent: false`.
- **REQ-SEC-CRON-02**: When email is disabled (`ENABLE_EMAIL !== "true"`), the transporter MUST return `{ success: false, simulated: true }`. `consultationReminderJob` MUST NOT set `reminderSent = true` in PostgreSQL when emails are not actually dispatched.

### 2.8 File Upload Validation & Stored XSS Prevention (SEC-UPLOAD)
- **REQ-SEC-UPLOAD-01**: Multer upload instances in `server/src/routes/medicalRecordRoutes.js` and `server/src/routes/patientHistoryRoutes.js` MUST implement a strict `fileFilter` permitting ONLY:
  - `image/jpeg` (`.jpg`, `.jpeg`)
  - `image/png` (`.png`)
  - `application/pdf` (`.pdf`)
- **REQ-SEC-UPLOAD-02**: Uploaded files with dangerous extensions (`.html`, `.htm`, `.svg`, `.xhtml`, `.js`, `.exe`) MUST be rejected with HTTP 400 Bad Request before disk write.

---

## 3. Explicit Non-Goals & Boundaries (Out of Scope for Phase 6)

1. **Cloud S3 Bucket Migration**: Local disk storage remains the storage provider for uploaded files during Phase 6. Migration to AWS S3 / Google Cloud Storage is scheduled for Phase 7.
2. **Database Column Renaming / Drops**: No table columns will be dropped or converted to `jsonb` during Phase 6 to maintain backward compatibility with existing test databases.
3. **BioBERT Transformer Retraining**: Natural language symptom extraction remains dictionary/keyword based; deep learning NLP model fine-tuning is deferred to Phase 7.
4. **Multilingual Voice Triage**: Voice input and regional Indian language support belong to Phase 7.

---

## 4. Verification & Falsifiable Acceptance Tests

| Test ID | Action | Expected Result |
|---|---|---|
| **TEST-SEC-01** | Make unauthenticated `GET http://localhost:5000/uploads/prescriptions/prescription-123.pdf` | Server responds with **404 Not Found** (static mount removed). |
| **TEST-SEC-02** | Authenticate as Patient A. Request `GET /api/prescriptions/{patientA_rxId}/pdf` | Returns **200 OK** with `Content-Disposition: attachment` and PDF binary payload. |
| **TEST-SEC-03** | Authenticate as Doctor B (no relationship to Patient A). Request `GET /api/prescriptions/{patientA_rxId}/pdf` | Returns **403 Forbidden** with message `"Unauthorized access to prescription"`. |
| **TEST-SEC-04** | Perform login via `/api/auth/login`. Inspect response body and browser `localStorage` | Response JSON does NOT contain `refreshToken`. `localStorage.getItem("refresh_token_local")` is **null**. |
| **TEST-SEC-05** | Attempt WebSocket connection to `ws://localhost:5000` without JWT auth token | Socket connection is rejected with **`Authentication error`**. |
| **TEST-SEC-06** | Authenticated as User C (unrelated to Consultation X). Emit `join-room { consultationId: "X" }` | Socket server rejects room join and user is NOT added to room. |
| **TEST-SEC-07** | Stop Python AI server (`port 8000`). Submit symptom triage payload to `/api/fever/assess` | Returns **200 OK** with `isProvisionalRuleAssessment: true`, `overall_confidence: null`, and no hardcoded 88.0%. |
| **TEST-SEC-08** | Attempt multipart upload of `malicious.html` or `attack.svg` to `/api/clinical-records` | Request rejected with **400 Bad Request** (`"Unsupported file type. Only PDF, JPG, and PNG are allowed"`). |
| **TEST-SEC-09** | Restart Node.js server. Inspect database logs and `prescription_items` table | Server starts cleanly. Table `prescription_items` is intact; zero `DROP TABLE` queries executed. |
| **TEST-SEC-10** | Run full frontend and backend build checks | `npx vite build` completes with 0 errors; `node --check` passes on all modified server files. |

---

## 5. Ambiguity Scoring Matrix

| Dimension | Weight | Raw Ambiguity Score (0 = crystal clear, 1 = unresolvable) | Weighted Score |
|---|:---:|:---:|:---:|
| **Functional Scope** | 30% | 0.05 | 0.0150 |
| **Technical Boundaries & Constraints** | 30% | 0.08 | 0.0240 |
| **Acceptance Criteria & Verification** | 25% | 0.05 | 0.0125 |
| **Edge Cases & Failure Modes** | 15% | 0.10 | 0.0150 |
| **Total Weighted Ambiguity** | **100%** | — | **0.0665** (~0.07) |

> **Gate Verdict**: **PASS** (Ambiguity $0.07 \le 0.20$; all dimensions meet minimum thresholds).

---

## 6. Next Workflow Routing

With this specification approved and locked, proceed to:

1. **/gsd-discuss-phase 6**: Review implementation trade-offs and code structure for streaming routes, token refresh middleware, and socket auth.
2. **/gsd-plan-phase 6**: Decompose this specification into atomic, verifiable execution tasks (`PLAN.md`).

