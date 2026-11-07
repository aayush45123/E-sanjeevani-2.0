# Plan 06-2: In-Memory Token Security & BOLA Elimination

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Wave**: 2 of 4  
> **Requirements**: REQ-SEC-AUTH-01, REQ-SEC-AUTH-02, REQ-SEC-AUTH-03, REQ-SEC-AUTH-04, REQ-SEC-BOLA-01, REQ-SEC-BOLA-02  
> **Files Modified**:  
> - `server/src/services/auth.service.js`  
> - `client/src/utils/api.js`  
> - `client/src/utils/auth.js`  
> - `server/src/controllers/prescriptionController.js`  
> - `server/src/controllers/patientHistoryController.js`  

---

## Task 2.1: Purge Raw Refresh Tokens from Server Auth Responses
- **File**: `server/src/services/auth.service.js`
- **Action**:
  - In `AuthService.login`, `AuthService.register`, and `AuthService.refreshToken`, remove `refreshToken: refreshTokenRaw` from the returned JSON payload.
  - Retain setting the cookie `res.cookie("refreshToken", ...)` with `httpOnly: true, secure: true, sameSite: ...`.
  - Delete `AuthService.fixDoctorPassword` backdoor method.
- **Verification**: `POST /api/auth/login` returns `{ success: true, accessToken: "...", user: {...} }` without `refreshToken` in body.

## Task 2.2: Implement In-Memory Access Token & Pure Cookie Silent Refresh in Client
- **Files**: `client/src/utils/api.js`, `client/src/utils/auth.js`
- **Action**:
  - In `client/src/utils/api.js`, declare module-level `let accessTokenInMemory = null;`.
  - Provide `setAccessToken(token)` and `getAccessToken()`.
  - Remove all lines setting `localStorage.setItem("refresh_token_local", ...)` and `localStorage.setItem("access_token_local", ...)`.
  - Update Axios request interceptor: attach `Authorization: Bearer ${accessTokenInMemory}` if present, always include `withCredentials: true`.
  - Update Axios 401 response interceptor: queue failed requests, execute `POST /auth/refresh` (cookie sent automatically), update `accessTokenInMemory`, and replay queued requests.
  - In `client/src/utils/auth.js`, update `performLogout()` to clear memory token and notify auth state listener.
- **Verification**: Login, inspect `localStorage` (no tokens found). Reload page; session restores seamlessly via silent cookie refresh.

## Task 2.3: Enforce Doctor-Patient Relationship Authorization (Fix BOLA in Prescriptions)
- **File**: `server/src/controllers/prescriptionController.js`
- **Action**:
  - In `getPatientPrescriptions(req, res)`:
    - If `req.user.role === "doctor"`:
      - Call `PatientHistoryService.verifyDoctorPatientRelationship(req.user.id, patientId)`.
      - If false, return HTTP 403 Forbidden with `"Access denied: No clinical relationship with this patient"`.
- **Verification**: An unrelated doctor attempting to list a patient's prescriptions receives 403 Forbidden.

## Task 2.4: Enforce Doctor-Patient Relationship Authorization (Fix BOLA in Longitudinal Intelligence)
- **File**: `server/src/controllers/patientHistoryController.js`
- **Action**:
  - In `getPatientLongitudinalIntelligence(req, res)`:
    - If `req.user.role === "doctor"`:
      - Call `PatientHistoryService.verifyDoctorPatientRelationship(req.user.id, patientId)`.
      - If false, return HTTP 403 Forbidden.
- **Verification**: An unrelated doctor querying another patient's longitudinal intelligence receives 403 Forbidden.

