# Phase 6 Master Plan: Production Hardening, Security & Infrastructure

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Target Milestone**: Milestone 2.1  
> **Derived From**: [`06-SPEC.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-SPEC.md) & [`06-RESEARCH.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-RESEARCH.md)  
> **Status**: READY FOR EXECUTION  

---

## Executive Summary & Wave Overview

Phase 6 executes the prioritized remediation of Critical and High priority vulnerabilities identified during the codebase audit ([`CONCERNS.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/codebase/CONCERNS.md)). Execution is structured across **4 dependency-ordered waves**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 6 EXECUTION WAVE PIPELINE                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────▼───────────────────────────────┐
    │ Wave 1: Medical Document Protection & Upload Security        │
    │ (Discontinue /uploads static serving, add streaming endpoints)│
    └───────────────────────────────┬───────────────────────────────┘
                                    │
    ┌───────────────────────────────▼───────────────────────────────┐
    │ Wave 2: In-Memory Token Security & BOLA Elimination           │
    │ (Purge localStorage tokens, silent refresh, fix BOLA checks) │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
    ┌───────────────────────────────▼───────────────────────────────┐
    │ Wave 3: WebRTC WebSocket Handshake Authentication            │
    │ (Attach JWT to Socket.IO handshake, validate room access)     │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
    ┌───────────────────────────────▼───────────────────────────────┐
    │ Wave 4: Database DDL Safety, Fallback & Reminder Cron        │
    │ (Remove DROP TABLE, fix 88% confidence, 5-min sliding window) │
    └───────────────────────────────────────────────────────────────┘
```

---

## Detailed Wave Breakdown

### Wave 1: Medical Document Protection & Upload Security
- **Plan Reference**: [`06-PLAN-1.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-PLAN-1.md)
- **Primary Goal**: Remove unauthenticated public access to prescription PDFs and medical reports.
- **Tasks**:
  1. Remove static mount `app.use("/uploads", express.static(...))` in `server/src/app.js`.
  2. Implement `streamPrescriptionPdf` controller and route `GET /api/prescriptions/:id/pdf` with doctor-patient relationship authorization.
  3. Implement `streamClinicalRecordAttachment` controller and route `GET /api/patient-history/attachments/:attachmentId`.
  4. Update `client/src/utils/api.js` and `ClinicalRecords.jsx` to use authenticated blob download helper.
  5. Add Multer `fileFilter` in `medicalRecordRoutes.js` and `patientHistoryRoutes.js` restricting uploads to `image/jpeg`, `image/png`, and `application/pdf`.

### Wave 2: In-Memory Token Security & BOLA Elimination
- **Plan Reference**: [`06-PLAN-2.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-PLAN-2.md)
- **Primary Goal**: Eliminate persistent XSS token exposure and prevent cross-patient record unauthorized dumping.
- **Tasks**:
  1. Remove raw `refreshToken` from response bodies in `AuthService.login`, `AuthService.register`, and `AuthService.refreshToken`.
  2. Delete unauthenticated `AuthService.fixDoctorPassword` backdoor.
  3. Refactor `client/src/utils/api.js` to store access token in memory with automatic Axios silent refresh on 401 using HTTP-only cookies; purge all `localStorage` token storage.
  4. Enforce doctor-patient relationship checks in `prescriptionController.getPatientPrescriptions` (Fix BOLA).
  5. Enforce doctor-patient relationship checks in `patientHistoryController.getPatientLongitudinalIntelligence` (Fix BOLA).

### Wave 3: WebRTC WebSocket Handshake Authentication
- **Plan Reference**: [`06-PLAN-3.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-PLAN-3.md)
- **Primary Goal**: Prevent unauthorized eavesdropping on teleconsultation video rooms and chat channels.
- **Tasks**:
  1. Add JWT authentication middleware `io.use()` to `server/src/socket/socketServer.js`.
  2. Validate that `socket.user.id` is either the assigned doctor or patient before allowing `socket.join(consultationId)`.
  3. Pass token in `socket.auth` from `client/src/pages/VideoCall/VideoCall.jsx`.

### Wave 4: Database DDL Safety, Transparent Fallback & Reminder Cron Reliability
- **Plan Reference**: [`06-PLAN-4.md`](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/.planning/phases/06-production-hardening/06-PLAN-4.md)
- **Primary Goal**: Prevent catastrophic production table loss, deceptive diagnostic scores, and missed appointment reminders.
- **Tasks**:
  1. Delete lines 77–80 executing `DROP TABLE IF EXISTS "prescription_items" CASCADE;` from `server/src/config/neonDb.js`.
  2. Delete legacy unused `server/src/config/db.js` file.
  3. In `server/src/routes/feverRoutes.js:259`, remove hardcoded `overall_confidence: 88.0%`; return `overall_confidence: null` and `isProvisionalRuleAssessment: true`.
  4. Update `AiTriage.jsx` to render an amber fallback banner when `isProvisionalRuleAssessment === true`.
  5. Refactor `consultationReminderJob.js` to use a 5-minute sliding query window and prevent false delivery confirmations when email is disabled.

---

## Verification & Falsifiable Testing Gates

Each wave must be verified independently before progressing:
1. **Wave 1 Verification**:
   - `GET /uploads/prescriptions/test.pdf` returns **404 Not Found**.
   - Authenticated `GET /api/prescriptions/:id/pdf` returns **200 OK** with PDF payload for owner; returns **403 Forbidden** for unrelated doctor.
   - Uploading `.html` or `.svg` returns **400 Bad Request**.
2. **Wave 2 Verification**:
   - Login returns no `refreshToken` in JSON body.
   - Inspecting browser `localStorage` reveals zero tokens stored.
   - Unrelated doctor querying `/api/prescriptions/patient/:id` receives **403 Forbidden**.
3. **Wave 3 Verification**:
   - WebSocket connection without JWT is rejected.
   - Unauthorized user attempting `join-room` receives access denied error.
4. **Wave 4 Verification**:
   - Server boot executes zero `DROP TABLE` queries.
   - Fever triage with Python microservice down returns `overall_confidence: null` with UI amber warning banner.
   - `npx vite build` and `node --check` pass on all modified files with 0 errors.

