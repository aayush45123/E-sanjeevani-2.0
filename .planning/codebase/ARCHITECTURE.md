<!-- refreshed: 2026-11-07 -->
</External Integrations>
<Architecture>
**Analysis Date:** 2026-11-07

## System Overview

E-Sanjeevani 2.0 is an enterprise-grade telemedicine and clinical intelligence platform architected as a decoupled, multi-tier microservices-inspired system. It bridges real-time clinical consultations, ML-driven diagnostic triage, longitudinal patient health intelligence, and P2P audiovisual teleconsultation.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (React 19 SPA)                              │
│  `client/src/main.jsx` · Vite 8 · React Router 7 · Recharts · Lucide · Axios Client    │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│   Patient Portal           │   Doctor Workspace          │   Teleconsultation Media    │
│   `client/src/pages/`      │   `client/src/pages/`       │   `client/src/pages/`       │
│   - PatientDashboard       │   - DoctorDashboard         │   - VideoCall               │
│   - AvailableDoctors       │   - MyPatients / Schedule   │   - (RTCPeerConnection      │
│   - ClinicalRecords        │   - DoctorAnalytics         │      + RTCDataChannel)      │
│   - AiTriage               │   - ClinicalIntelligence    │                             │
└──────────────┬─────────────┴──────────────┬──────────────┴──────────────┬──────────────┘
               │ HTTP / Bearer / Cookies    │ WebSocket (Signaling)       │ P2P WebRTC
               ▼                            ▼                             │ Media Streams
┌─────────────────────────────────────────────────────────────┐           │
│             API GATEWAY & CORE BACKEND (Express 5.x)        │           │
│  `server/src/server.js` · `server/src/app.js` (Port 5000)   │           │
├────────────────────────────┬────────────────────────────────┤           │
│  HTTP REST Endpoints       │  Socket.io Signaling Server    │           │
│  - Auth (Dual Token JWT)   │  `server/src/socket/`          │           │
│  - Consultations & Matching│  - `socketServer.js`           │           │
│  - Doctor Assistant / RAG  │  - Room session management     │           │
│  - Prescriptions & Vitals  │  - SDP offer/answer exchange   │           │
│  - PDF Report Generation   │  - ICE candidate relay         │           │
└──────────────┬─────────────┴────────────────┬───────────────┘           │
               │                              │                           │
               │ IPC / HTTP REST              │ Drizzle ORM Queries       │
               │ (Port 8000)                  ▼                           │
┌──────────────▼─────────────┐ ┌──────────────────────────────┐           │
│   AI & ML MICROSERVICE     │ │   PRIMARY PERSISTENCE        │           │
│   (Python 3.11+ / Flask)   │ │   (Neon PostgreSQL 16)       │           │
│  `ai-model/app.py`         │ │  `server/src/database/`      │           │
├────────────────────────────┤ ├──────────────────────────────┤           │
│ - 5 Triage Category Models │ │ - Users & Auth Tokens        │           │
│   (XGBoost / Random Forest)│ │ - Patient & Doctor Profiles  │           │
│ - Longitudinal Health      │ │ - Consultations & Feedback   │           │
│   Intelligence Pipeline    │ │ - Availability & Slots       │           │
│ - OLS Trajectory & MEWS    │ │ - Prescriptions & Vitals     │           │
│ - Vectorless Clinical RAG  │ │ - Chat & Triage History      │           │
└────────────────────────────┘ └──────────────────────────────┘           │
                                                                          │
┌─────────────────────────────────────────────────────────────────────────▼──────────────┐
│                            DIRECT P2P WEBRTC MEDIA ENGINE                              │
│  Encrypted audio/video streaming via Google/Twilio STUN servers; zero media proxy lag  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Primary File |
|-----------|----------------|--------------|
| **Client SPA** | React 19 UI, route navigation, client state, WebRTC peer connection, responsive clinical dashboards | `client/src/App.jsx` |
| **API Gateway / Server** | Express 5.x application lifecycle, middleware pipeline, CORS isolation, route aggregation | `server/src/app.js`, `server/src/server.js` |
| **Authentication Service** | Dual-token authentication (short-lived JWT access token + rotating hashed refresh token), bcrypt hashing | `server/src/services/auth.service.js` |
| **Doctor Matching Engine** | 5-Factor priority score computation, Haversine geospatial proximity, specialty ranking | `server/src/helpers/doctorMatching.js` |
| **Longitudinal Intelligence** | Multi-visit symptom trajectory, linear slope analysis, MEWS score, fallback JS engine | `server/src/services/longitudinalIntelligence.service.js` |
| **WebRTC Signaling Gateway** | Real-time consultation room pairing, SDP offer/answer relay, ICE candidate exchange | `server/src/socket/socketServer.js` |
| **Python ML Microservice** | 5-category disease inference (Fever, Respiratory, Digestive, Skin, Urinary), SHAP explainability | `ai-model/app.py` |
| **Python Longitudinal Engine** | Analytical time-series analysis, clinical trajectory alerts, comparative vitals matrix, RAG context | `ai-model/longitudinal_intelligence.py` |
| **Persistence Layer** | Relational schema definitions, PostgreSQL connection pooling via Neon serverless driver, type-safe queries | `server/src/database/schema/index.js`, `server/src/config/neonDb.js` |
| **Prescription Lifecycle** | Draft → finalized → amended state machine, PDFKit binary generation, item tracking | `server/src/services/prescriptionLifecycle.service.js` |

---

## Pattern Overview

**Overall Architecture:** Microservices-Inspired Distributed Monolith & Microservices Hybrid. The core web and signaling layer runs inside Node.js/Express, delegating heavy clinical inference and longitudinal analysis to an isolated Python Flask microservice, backed by a serverless relational database (Neon PostgreSQL).

**Key Characteristics:**
1. **Separation of Concerns:** Diagnostic AI computation is strictly isolated from CRUD and business logic; Python microservice crashes or network timeouts gracefully degrade to in-process Node.js heuristic rule engines without interrupting patient workflows.
2. **Dual-Token Zero-Trust Identity:** Short-lived access tokens (15-min TTL) in memory/cookies coupled with cryptographically random refresh tokens stored as SHA-256 hashes with single-use rotation and reuse detection.
3. **Decoupled Real-Time Media:** Video and audio streams flow strictly peer-to-peer (P2P) between patient and doctor browsers via standard `RTCPeerConnection`, offloading server CPU and bandwidth. The Express server acts only as a lightweight Socket.io signaling coordinator.
4. **Resilient Dual-Engine Intelligence:** The longitudinal intelligence pipeline attempts execution in Python, but seamlessly falls back to a deterministic, high-fidelity JavaScript engine (`_runJsLongitudinalEngine`) with identical MEWS thresholds.

---

## Layers

### 1. Presentation Layer (`client/src/`)
- **Purpose:** Delivers high-performance patient and clinician user experiences with instant visual feedback and responsive charts.
- **Location:** `client/src/`
- **Contains:** React 19 components, lazy-loaded page chunks, custom hooks (`useAuth`, `useTriage`), utility wrappers (`apiClient`), CSS Modules/global styles.
- **Depends on:** Axios for REST API queries; Socket.io client for signaling; WebRTC browser APIs.
- **Used by:** End-user patients, clinicians, and system administrators in web browsers.

### 2. API Gateway & Transport Layer (`server/src/routes/`, `server/src/middlewares/`)
- **Purpose:** Request validation, authentication guard, cookie parsing, route dispatching, and rate/CORS limiting.
- **Location:** `server/src/routes/`, `server/src/middlewares/`
- **Contains:** Express route routers (`authRoutes.js`, `consultationRoutes.js`, `feverRoutes.js`, `doctorAssistantRoutes.js`), validation middlewares (`authMiddleware.js`, `validation.middleware.js`).
- **Depends on:** Services layer (`server/src/services/`), JSON Web Token library, Zod validators.
- **Used by:** React SPA and external webhook callers.

### 3. Business Logic & Service Orchestration Layer (`server/src/services/`, `server/src/helpers/`)
- **Purpose:** Encapsulates domain logic: consultation scheduling, 5-factor doctor priority ranking, longitudinal vital tracking, prescription state transitions, and PDF rendering.
- **Location:** `server/src/services/`, `server/src/helpers/`
- **Contains:** Domain services (`consultation.service.js`, `longitudinalIntelligence.service.js`, `doctorAssistant.service.js`, `prescriptionLifecycle.service.js`, `doctorMatching.js`).
- **Depends on:** Repository layer (`server/src/repositories/`), Python ML HTTP client (`server/src/ai/triageClient.js`), PDFKit, Nodemailer.
- **Used by:** Controllers in `server/src/controllers/`.

### 4. Data Access Layer (`server/src/repositories/`, `server/src/database/schema/`)
- **Purpose:** Abstraction over database operations using type-safe Drizzle ORM against PostgreSQL.
- **Location:** `server/src/repositories/`, `server/src/database/schema/`
- **Contains:** Entity repositories (`user.repository.js`, `consultation.repository.js`, `doctorProfile.repository.js`, `refreshToken.repository.js`), table schema definitions with pgEnum constraints.
- **Depends on:** `drizzle-orm`, `@neondatabase/serverless`, PostgreSQL.
- **Used by:** Service layer.

### 5. ML & Clinical Intelligence Microservice (`ai-model/`)
- **Purpose:** Executes machine learning model inferences (XGBoost, Random Forest) across 5 disease categories and executes time-series trajectory algorithms.
- **Location:** `ai-model/app.py`, `ai-model/longitudinal_intelligence.py`
- **Contains:** Serialized joblib models (`ai-model/models/`), SHAP explainability routines, OLS linear regression, Modified Early Warning Score (MEWS) calculator, vectorless clinical RAG engine.
- **Depends on:** Flask, Scikit-Learn, Pandas, NumPy, Joblib.
- **Used by:** Express server via HTTP POST (`http://127.0.0.1:8000`).

---

## Data Flow

### 1. Dual-Token Authentication Flow

```text
Client (Browser)                  Express Auth Route                 PostgreSQL (Neon)
      │                                    │                                  │
      ├── POST /api/auth/login ───────────>│                                  │
      │   { email, password }              ├── Verify user & bcrypt hash ────>│
      │                                    ├── Generate 15-min JWT access     │
      │                                    ├── Gen 48-byte crypto refresh     │
      │                                    ├── Hash refresh token (SHA-256)   │
      │                                    ├── Store tokenHash in DB ────────>│
      │<── Set-Cookie: access_token, ──────┤                                  │
      │    Set-Cookie: refresh_token ──────┤                                  │
      │    Body: { user, accessToken } ────┘                                  │
      │                                                                       │
      ├── Request /api/protected (Access Token expired: 401) ────────────────>│
      │                                                                       │
      ├── POST /api/auth/refresh ─────────>│                                  │
      │   (Cookie or x-refresh-token)      ├── Lookup tokenHash in DB ───────>│
      │                                    ├── Check !isRevoked & !expired    │
      │                                    ├── Mark old token revoked ───────>│
      │                                    ├── Issue new pair + link rotated  │
      │                                    ├── Store new tokenHash in DB ────>│
      │<── Set-Cookie: new tokens ─────────┤                                  │
```

1. **Client Submission:** Patient/Doctor posts credentials to `/api/auth/login` (`client/src/utils/api.js`).
2. **Verification & Issuance:** `AuthService.login` validates the user via `UserRepository.findByEmail` and `bcrypt.compare`.
3. **Token Construction:** 
   - Access token signed with user payload (`userId`, `role`, `email`) expiring in 15 minutes (`server/src/services/auth.service.js:17-29`).
   - Refresh token generated using 48 cryptographically secure random bytes (`crypto.randomBytes(48).toString("hex")`).
   - SHA-256 hash computed and saved into `refresh_tokens` table in PostgreSQL (`server/src/database/schema/refreshTokens.js`).
4. **Transport:** Delivered simultaneously via secure httpOnly cookies and JSON response body (cached in `client/src/utils/api.js` for port-isolated cross-origin local environments).
5. **Single-Use Rotation:** On `/api/auth/refresh`, the incoming token is hashed and verified. If valid, the current token is immediately marked `is_revoked = true` and a new token is inserted referencing `rotatedFromHash`. Any attempt to reuse an already-revoked token triggers immediate revocation of all user sessions.

---

### 2. 5-Factor Doctor Matching Flow

```text
Triage / Booking Form             Consultation Service             Candidate Evaluation
      │                                    │                                  │
      ├── Submit Assessment / Booking ────>│                                  │
      │   { symptoms, urgencyScore, etc }  ├── Query Verified Candidates ────>│
      │                                    │   (Filtered by Specialty)        │
      │                                    │                                  │
      │                                    ├── For each Doctor Candidate:     │
      │                                    │   Calculate Priority (0.0 - 1.0) │
      │                                    │   1. Urgency (40%)               │
      │                                    │   2. Specialty (25%)             │
      │                                    │   3. Availability (20%)          │
      │                                    │   4. Language (10%)              │
      │                                    │   5. Experience (5%)             │
      │                                    │                                  │
      │                                    ├── Sort by Priority descending    │
      │<── Top-Ranked Doctor Matched ──────┴── Assign to Consultation ────────┘
```

The algorithm (`server/src/helpers/doctorMatching.js:7-40`) determines matching using a deterministic multi-criteria weighting equation:

$$\text{Priority} = 0.40 \cdot U + 0.25 \cdot S + 0.20 \cdot A + 0.10 \cdot L + 0.05 \cdot E$$

- **Factor 1: Urgency Match ($U$, 40% weight):**
  $$\min\left(\frac{\text{urgencyScore}}{10}, 1.0\right) \times 0.4$$
- **Factor 2: Specialty Match ($S$, 25% weight):**
  Binary specialty relevance ($1.0 \times 0.25$).
- **Factor 3: Availability Match ($A$, 20% weight):**
  Piecewise scoring based on time-until-available in days ($d$):
  - $d \le 0.5 \implies 1.0$
  - $d \le 1.0 \implies 0.9$
  - $d \le 3.0 \implies 0.7$
  - $d \le 7.0 \implies 0.5$
  - $d > 7.0 \implies \max(0.2, 1 - d/30)$
- **Factor 4: Language Match ($L$, 10% weight):**
  Language compatibility ($1.0$ if doctor speaks requested languages, $0.8$ baseline).
- **Factor 5: Clinical Experience ($E$, 5% weight):**
  Normalized years in active practice: $\min(\text{experience} / 20, 1.0) \times 0.05$.

Complementary geolocation scoring is provided by `server/src/helpers/remediesAndDoctorRecommender.js` using the Haversine spherical distance formula to award up to 30 additional proximity points.

---

### 3. AI-Powered Longitudinal Patient Health Intelligence Pipeline

```text
Clinician Dashboard               Longitudinal Service               Python ML Microservice
      │                                    │                                  │
      ├── GET /patient-history/longitudinal├── Fetch User Profile & Records   │
      │   (patientId, complaint)           ├── Fetch All Consultations        │
      │                                    ├── Fetch Hydrated Prescriptions   │
      │                                    ├── Fetch Patient Health Metrics   │
      │                                    │                                  │
      │                                    ├── POST /analyze-longitudinal ───>│
      │                                    │   { patient, consultations,      ├── Trajectory Detection
      │                                    │     metrics, prescriptions }     ├── OLS Slope & Deltas
      │                                    │                                  ├── MEWS Severity Score
      │                                    │                                  ├── Vectorless RAG Search
      │                                    │                                  ├── Structured Summary
      │                                    │<── Return JSON Intelligence ─────┤
      │                                    │   (or fallback to Node.js JS     │
      │                                    │    engine if timeout > 3.5s)     │
      │                                    │                                  │
      │<── Comprehensive Clinical Insights─┴── Cache in Patient Summaries ────┘
```

1. **Extraction & Hydration:** `LongitudinalIntelligenceService.getLongitudinalIntelligence` (`server/src/services/longitudinalIntelligence.service.js:82`) extracts all historic patient encounters from Neon PostgreSQL:
   - `patientProfiles`: baseline allergies, blood group, chronic conditions.
   - `consultations`: chronological visit progression.
   - `prescriptions` + `prescriptionItems`: all prescribed pharmacological agents and active courses.
   - `patientHealthMetrics`: time-series vitals (BP, HR, SpO2, Temperature, Platelets, WBC, CRP).
2. **Execution in Python Microservice (`ai-model/longitudinal_intelligence.py`):**
   - **Symptom Recurrence & Trajectory Analysis:** Matches unstructured symptom text against canonical ontology keys (`fever`, `fatigue`, `joint_pain`, `cough`, etc.). Detects expansion patterns across visits (e.g., Visit 1: *Fever* $\to$ Visit 2: *Fever + Fatigue* $\to$ Visit 3: *Fever + Fatigue + Joint Pain*). Raises critical warnings for relapsing febrile trajectories (Dengue, Chikungunya, Relapsing Typhoid).
   - **Time-Series Analysis & OLS Regression:** Computes Ordinary Least Squares linear regression slope across timestamped readings:
     $$\text{slope} = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}$$
   - **MEWS Scoring (Modified Early Warning Score):** Calculates clinical deterioration score (0-14 scale) across systolic blood pressure, heart rate, respiratory rate, temperature, and SpO2.
   - **Comparative Parameter Matrix:** Evaluates physiological shifts across `Baseline` $\to$ `Previous` $\to$ `Current` measurements, reporting absolute deltas and percentage changes.
   - **Vectorless Clinical RAG:** Tokenizes patient medical documents and consultation records into indexed blocks, computing term-frequency and clinical-entity relevance against the current complaint to generate targeted physician briefings.
3. **Resilient In-Process JS Fallback:** If the Python microservice is offline or does not respond within 3500ms, `LongitudinalIntelligenceService._runJsLongitudinalEngine` executes native JavaScript implementations of the MEWS scoring, trajectory warning rules, and comparative delta matrices without failing the client request.

---

### 4. WebRTC P2P Media & Signaling Flow

```text
Patient Browser                  Express Socket.io Server                 Doctor Browser
      │                                    │                                    │
      ├── emit("join-room", {roomId}) ────>├── Map socket to roomId             │
      │                                    │<── emit("join-room", {roomId}) ────┤
      │                                    │                                    │
      │<── emit("other-user", {init:true}) ┤   (Room capacity = 2)              │
      │                                    ├── emit("existing-user") ──────────>│
      │                                    │                                    │
      │── Create RTCPeerConnection         │                                    │
      │── Add local audio/video tracks     │                                    │
      │── Create SDP Offer                 │                                    │
      ├── emit("call-user", {offer}) ─────>├── Relay offer ────────────────────>│
      │                                    │                                    ├── Set remote description
      │                                    │                                    ├── Create SDP Answer
      │                                    │<── emit("answer-call", {ans}) ─────┤
      │<── Relay "call-accepted" ──────────┤                                    │
      │── Set remote description           │                                    │
      │                                    │                                    │
      ├── emit("ice-candidate", c1) ──────>├── Relay candidate ────────────────>├── Add ICE candidate
      │<── Relay candidate ────────────────├── emit("ice-candidate", c2) ───────┤
      │                                    │                                    │
      ▲═════════════════════════════════════════════════════════════════════════▲
      ║                DIRECT ENCRYPTED P2P AUDIO / VIDEO STREAM               ║
      ║                 + RTCDataChannel FOR MUTE/CAM STATE SYNC                ║
      ╚═════════════════════════════════════════════════════════════════════════╝
```

- **Room Isolation:** Socket rooms are keyed strictly to the `consultationId` UUID (`server/src/socket/socketServer.js:65`). Rooms strictly reject connections when count > 2.
- **Deterministic Handshake:** The server notifies the first joined peer (`other-user`, `shouldInitiate: true`) to trigger the SDP offer, eliminating glare conditions where both browsers attempt offer creation concurrently.
- **P2P Transport:** Direct media streaming via Google/Twilio STUN servers (`stun:stun.l.google.com:19302`).
- **DataChannel Synchronization:** RTCDataChannel exchanges mute, camera disable, and screen share toggles directly between peers without emitting socket events to the backend server (`client/src/pages/VideoCall/VideoCall.jsx:250`).

---

## Key Abstractions

### 1. Repository Pattern (`server/src/repositories/`)
- **Purpose:** Abstract SQL query composition and Drizzle ORM operations away from controller and service logic.
- **Examples:**
  - `UserRepository` (`server/src/repositories/user.repository.js`)
  - `ConsultationRepository` (`server/src/repositories/consultation.repository.js`)
  - `DoctorProfileRepository` (`server/src/repositories/doctorProfile.repository.js`)
  - `RefreshTokenRepository` (`server/src/repositories/refreshToken.repository.js`)
- **Pattern:** Static class methods executing type-safe queries via Drizzle `db.select()`, `db.insert()`, and transactions (`db.transaction()`).

### 2. Microservice Client Gateway (`server/src/ai/triageClient.js`)
- **Purpose:** Centralized, resilient HTTP adapter communicating with the Python ML microservice.
- **Methods:** `predictUnifiedTriage()`, `getTriageHealth()`, `getTriageCategories()`.
- **Pattern:** Configured Axios instance with strict sub-second timeouts and schema mapping.

### 3. Prescription Lifecycle State Machine
- **Purpose:** Regulates clinical prescription mutability and legal compliance.
- **States:** `draft` $\to$ `finalized` $\to$ `amended`.
- **Constraint:** Once `finalized`, a prescription row is legally immutable. Revisions require generating an `amended` record referencing `amendedFromId`.
- **Implementation:** `server/src/services/prescriptionLifecycle.service.js`.

---

## Entry Points

### 1. Client Frontend SPA
- **Location:** `client/src/main.jsx`
- **Bootloader:** Vite 8 mounting React 19 `createRoot(document.getElementById("root"))` wrapped with `BrowserRouter` and global polyfill (`window.global = window` for WebRTC dependencies).
- **Primary Router:** `client/src/App.jsx` handling route authentication guards and Suspense skeleton boundaries.

### 2. Node.js Express API & Socket Gateway
- **Location:** `server/src/server.js`
- **Bootloader:** Initializes PostgreSQL connection check via `neonDb.js`, binds Express application from `server/src/app.js`, initializes Socket.io on the HTTP server, and starts consultation reminder cron jobs on `PORT 5000`.

### 3. Python AI & ML Microservice
- **Location:** `ai-model/app.py`
- **Bootloader:** Flask server running on port 8000. Loads joblib models into memory on startup and exposes `/predict-triage`, `/triage-health`, and `/analyze-longitudinal-intelligence`.

---

## Architectural Constraints

- **Single-Threaded Event Loop:** The Express server relies on Node.js asynchronous I/O; CPU-bound tasks (machine learning model inference, text NLP, SHAP calculation) are offloaded to Python microservices or background jobs.
- **Global Memory State in Socket Server:** `roomUsers` and `socketRoomMap` in `server/src/socket/socketServer.js` are currently held in-process memory. Scaling across multiple Node.js instances requires a Redis adapter (`@socket.io/redis-adapter`).
- **Legal Immutability of Finalized Clinical Records:** Prescriptions and signed consultation notes cannot be updated via SQL `UPDATE`; changes must be recorded as append-only revisions.
- **Port Isolation on Localhost:** Because different development ports on localhost share cookies under standard browser policies, `authMiddleware.js` and `api.js` explicitly prioritize the `Authorization: Bearer <token>` header over cookie fallback.

---

## Anti-Patterns & Guidelines

### 1. In-Process Long-Running ML Computation
- **Anti-Pattern:** Executing heavy multi-class inference, SHAP tree explainers, or vector searches inside Express request handlers.
- **Why it's wrong:** Blocks Node.js event loop, spiking API latency for all connected users.
- **Correct Pattern:** Forward all analytical processing to Python Flask via `server/src/ai/triageClient.js` with non-blocking timeouts and fallbacks.

### 2. Direct Database Mutations in Controllers
- **Anti-Pattern:** Invoking `db.select()` or raw SQL inside Express controller functions.
- **Why it's wrong:** Violates layering, prevents unified transaction management, and impedes unit testing.
- **Correct Pattern:** Controllers call Services (`ConsultationService`); Services invoke Repositories (`ConsultationRepository`).

---

## Error Handling & Resilience

- **Strategy:** Multi-tier graceful degradation.
- **HTTP Layer:** Centralized error-handling middleware (`server/src/app.js:158-165`) catching unhandled exceptions and returning uniform `{ success: false, message: ... }` JSON structures with appropriate HTTP status codes.
- **Microservice Fault Tolerance:** When Python AI microservice is down, `longitudinalIntelligence.service.js` automatically activates `_runJsLongitudinalEngine`, ensuring zero disruption to patient consultations.
- **Database Connection Retries:** Neon serverless PostgreSQL connection check runs asynchronously on startup without blocking initial server socket binding.

---

## Cross-Cutting Concerns

- **Logging:** Request logging middleware in `server/src/app.js` (`📨 METHOD /path`).
- **Validation:** Schema validation using Zod schemas (`server/src/validators/`) executed prior to controller invocation.
- **Authentication:** `authMiddleware.js` extracts Bearer token or HTTP-only cookies, verifies JWT integrity, and hydrates `req.user` directly from PostgreSQL.
- **CORS Protection:** Dynamic origin filtering in `server/src/app.js` with wildcard and regex verification for Vercel preview environments and local development ports.

---

*Architecture analysis: 2026-11-07*
