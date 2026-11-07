# Plan 06-4: Database DDL Safety, Transparent Fallback & Cron Reliability

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Wave**: 4 of 4  
> **Requirements**: REQ-SEC-DB-01, REQ-SEC-DB-02, REQ-SEC-DB-03, REQ-SEC-CLIN-01, REQ-SEC-CLIN-02, REQ-SEC-CLIN-03, REQ-SEC-CLIN-04, REQ-SEC-CRON-01, REQ-SEC-CRON-02  
> **Files Modified**:  
> - `server/src/config/neonDb.js`  
> - `server/src/config/db.js` (deleted)  
> - `server/src/routes/feverRoutes.js`  
> - `client/src/components/AiTriage/AiTriage.jsx`  
> - `server/src/cron/consultationReminderJob.js`  

---

## Task 4.1: Delete Destructive Runtime DDL & Clean Zombie Database Config
- **Files**: `server/src/config/neonDb.js`, `server/src/config/db.js`
- **Action**:
  - In `server/src/config/neonDb.js`, delete lines 77–80 (`DROP TABLE IF EXISTS "prescription_items" CASCADE;`).
  - Verify that `ensureLongitudinalHealthTablesExist()` retains its non-destructive `CREATE TABLE IF NOT EXISTS` statements.
  - Delete unused `server/src/config/db.js` (legacy Mongoose file).
- **Verification**: Server restarts without executing any `DROP TABLE` queries.

## Task 4.2: Strip Hardcoded 88% Confidence & Add Transparent Fallback Indicator
- **Files**: `server/src/routes/feverRoutes.js`, `client/src/components/AiTriage/AiTriage.jsx`
- **Action**:
  - In `server/src/routes/feverRoutes.js:259`, replace `overall_confidence: 88.0` with `overall_confidence: null`.
  - Set `isProvisionalRuleAssessment: true`, `engineStatus: "fallback_rules_engine"`.
  - Update `/api/fever/health` to return HTTP 503 with `{ success: false, all_models_ready: false }` when Python microservice is offline.
  - In `AiTriage.jsx`, detect `isProvisionalRuleAssessment === true` and display an amber warning badge stating machine learning verification was offline.
- **Verification**: Shutting down Python microservice results in clean fallback output with null confidence and prominent UI notice.

## Task 4.3: Implement Sliding Time Window for Consultation Reminders
- **File**: `server/src/cron/consultationReminderJob.js`
- **Action**:
  - Replace exact string matching `eq(consultations.startTime, currentTime)` with a 5-minute sliding window query (`gte(consultations.startTime, windowStart)` and `lte(consultations.startTime, windowEnd)`).
  - Ensure `reminderSent` is marked `true` ONLY if `result.success === true` and `result.simulated !== true`.
- **Verification**: Scheduled consultations occurring within the window are flagged and emailed without missed triggers.

