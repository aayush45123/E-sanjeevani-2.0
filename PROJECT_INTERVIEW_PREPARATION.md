# PROJECT INTERVIEW PREPARATION: E-SANJEEVANI 2.0

> **Target Role**: Full-Stack Engineer / Software Development Engineer (SDE) / AI & Data Engineer  
> **Repository Grounding**: 100% verified against active repository code in `client/`, `server/`, `ai-model/`, and `database/`.  
> **Audience**: Technical Interviewers, System Architecture Round Interviewers, Hiring Managers, and Placement Mentors.

---

# 1. Project Overview

### Project Name
**E-Sanjeevani 2.0** (Next-Generation AI-Augmented Telemedicine & Clinical Decision Support Platform)

### One-Line Explanation
An enterprise-grade, multi-tier telemedicine ecosystem that pairs real-time WebRTC audio/video consultations with machine learning-driven clinical triage, explainable fever differential diagnosis (SHAP), dynamic multi-criteria doctor scheduling, and immutable longitudinal electronic medical records.

### Problem Statement
Traditional digital health and legacy public telemedicine platforms (including the original First-Come-First-Serve eSanjeevani portal) suffer from five critical clinical and operational bottlenecks:
1. **Inefficient Triage & FIFO Queue Delays**: Critical and acute emergencies wait in the same First-In, First-Out queue behind routine cold and skin consultations.
2. **Clinical Ambiguity in Febrile Illnesses**: In tropical and subtropical regions (e.g., South Asia), mosquito-borne and bacterial febrile illnesses (Dengue, Malaria, Typhoid, Chikungunya, and Viral Fever) present nearly identical early symptom profiles, leading to diagnostic confusion or delayed specialty care.
3. **Fragmented Longitudinal Records**: Patient consultations operate as isolated episodic sessions without real-time physician access to active vs. completed medication timelines, prior diagnoses, or uploaded laboratory reports.
4. **Physician Fatigue & Fragile Prescriptions**: Free-text, unstructured consultation notes lead to lost medication history, dangerous prescription errors, and zero automated medication lifecycle tracking.
5. **Lack of Explainability in Healthcare AI**: Black-box neural models produce predictions that doctors cannot trust or verify during a live consultation.

### Solution
E-Sanjeevani 2.0 solves these challenges through:
- **Intelligent Pre-Triage**: Dual-engine triage featuring a 377-symptom General Disease Classifier (`ExtraTrees`) and an explainable 25-symptom Fever Differential Model (`XGBoost / Random Forest` with `SHAP` game-theoretic feature attribution).
- **Rule-Based Emergency Interception**: A deterministic red-flag detector and 10-point urgency scoring formula that intercepts life-threatening complications before consultation booking.
- **5-Factor Dynamic Doctor Matching**: An objective utility algorithm that ranks available physicians by urgency ($40\%$), specialty relevance ($25\%$), temporal availability ($20\%$), language compatibility ($10\%$), and physician clinical experience ($5\%$).
- **In-Call Telemedicine Workspace**: Browser-native WebRTC peer-to-peer video/audio consultations with an audio-only fallback mode, pre-call camera/mic check-in, real-time text chat, and a physician split-pane copilot for checking patient history and drug contraindications.
- **First-Class Digital Prescription Architecture**: Immutable, versioned prescription entities with duration-computed active/completed medication tracking and automated server-side vector PDF generation (`PDFKit`).

### Target Users
1. **Patients**: Self-triage symptoms, view explainable differential reports, book matched specialists, conduct WebRTC video/audio calls, view longitudinal health history, and download digital prescriptions.
2. **Physicians / Doctors**: Manage recurring consultation slots, review triaged patient rosters with emergency urgency badges, conduct video consultations with in-call AI clinical summaries, issue/amend legally structured prescriptions, and inspect patient retention analytics.
3. **Clinical Administrators** *(schema supported)*: System oversight, physician credential verification, and practice audits.

### Key Features
- Dual-Token JWT Authentication with rotating DB-persisted refresh tokens in secure HTTP-only cookies.
- General Disease Symptom Predictor (41+ disease classes across 377 binary symptom features).
- WHO-Curated Fever Differential Diagnostic Engine (5 febrile classes with SHAP contribution bar charts).
- Emergency Red-Flag Interception Modal (blocking acute shock/bleeding/respiratory emergencies).
- 5-Factor Dynamic Doctor Matching Algorithm (replacing FIFO queues with priority matching).
- WebRTC P2P Video Consultation with ICE candidate buffering, pre-join audio-only toggle, and avatar fallback.
- In-Call Physician AI Copilot & Longitudinal Patient Summary.
- First-Class Digital Prescriptions with immutable amendment chaining (`amendedFromId`) and PDFKit generation.
- Automated Background Consultation Reminders via Node-Cron and Nodemailer.
- Doctor Practice Analytics (patient volume, consultation completion rates, demographics).

### Tech Stack
- **Frontend**: React 19, Vite 8, React Router 7, Vanilla CSS Modules, Recharts 3, Lucide React, Socket.IO Client.
- **Backend**: Node.js 20+, Express 5, Socket.IO 4, Drizzle ORM, PDFKit, Nodemailer, Node-Cron, Bcryptjs, JSONWebToken, Axios.
- **Database**: Neon Serverless PostgreSQL with Drizzle ORM (20 normalized relational tables).
- **AI / Machine Learning**: Python 3.10+, Flask 3, Scikit-learn 1.6, XGBoost 2.1, SHAP 0.46, Pandas, NumPy, Joblib, HuggingFace Inference Router (`Llama-3.1-8B-Instruct`).
- **DevOps / Hosting**: Vercel (Client SPA), Render (Express Gateway & Flask AI Server), Neon Cloud (PostgreSQL).

### Architecture Summary
A decoupled, 4-tier microservice architecture:
1. **Client Tier**: React 19 SPA running on Vite with stateful custom hooks, protected auth guards, and responsive clinical UI.
2. **API Gateway & Core Backend**: Express 5 application managing REST APIs, business services, Drizzle repositories, Socket.IO signaling, and cron jobs.
3. **Database Tier**: Neon Serverless PostgreSQL handling relational integrity, cascading relations, and ACID transactions.
4. **AI/ML Microservice**: Python Flask microservice on port 8000 lazily serving serialized Scikit-learn and XGBoost pipelines alongside SHAP TreeExplainers and HuggingFace LLM inference.

---

### Spoken Explanations for Interviews

#### 30-Second Explanation
> "I built E-Sanjeevani 2.0, a production-grade full-stack telemedicine platform that upgrades traditional healthcare portals with clinical AI and explainable triage. Built with React 19, Node.js Express 5, Neon PostgreSQL via Drizzle ORM, and a Python Flask ML microservice, it allows patients to pre-triage symptoms through a 377-feature disease classifier and an explainable 25-feature fever differential model powered by SHAP. Instead of first-come-first-serve queues, an algorithmic 5-factor priority formula matches urgent patients with available specialists for WebRTC video calls. Consultations conclude with legally immutable digital prescriptions and automated vector PDFs."

#### 1-Minute Explanation
> "Traditional telemedicine platforms like the legacy eSanjeevani suffer from major operational hurdles: non-urgent patients clog queues ahead of acute cases, tropical fevers like Dengue and Malaria get misdiagnosed due to symptom overlap, and consultations lack structured medical records.
> 
> To solve this, I designed E-Sanjeevani 2.0 as a decoupled 4-tier system. The frontend is built with React 19 and Vite; the backend is powered by Express 5 and Drizzle ORM on serverless PostgreSQL; real-time video signaling uses Socket.IO with WebRTC; and clinical intelligence runs on a dedicated Python Flask microservice.
> 
> When a patient enters symptoms, our machine learning pipeline predicts likely conditions, computes an objective 10-point urgency score, and uses SHAP game theory to visually explain why specific symptoms drove the diagnosis. If red flags like internal bleeding or dyspnea are detected, the system immediately intercepts with an emergency warning. For non-emergencies, a 5-factor weighted algorithm ranks doctors based on urgency, specialty, availability, language, and clinical experience. Doctors conduct in-browser WebRTC video consultations with live AI decision support and generate structured, immutable prescriptions with PDFKit."

#### 2-Minute Deep Explanation
> "E-Sanjeevani 2.0 was developed to address critical technical and clinical gaps in public digital health. In emergency medicine, triage latency can be fatal, while in tropical outpatient care, overlapping viral and bacterial fevers create diagnostic ambiguity.
> 
> Architecturally, the platform is divided into four distinct components:
> 
> First, our persistence layer uses Neon Serverless PostgreSQL managed via Drizzle ORM across 20 normalized schemas. We enforce strict referential integrity and dual-token authentication: short-lived 15-minute JWT access tokens paired with rotating, database-persisted 7-day refresh tokens delivered via HTTP-only, SameSite cookies.
> 
> Second, our AI tier is a specialized Python Flask microservice. It hosts two separate pipelines: a 377-symptom ExtraTrees general disease classifier trained across 41 disease categories, and an XGBoost/Random Forest fever differential model trained on 1,500 WHO clinical profiles covering Dengue, Malaria, Typhoid, Chikungunya, and Viral Fever. To eliminate the medical 'black box' problem, we integrated SHAP TreeExplainers, which compute game-theoretic Shapley values on active patient symptoms, rendering positive and negative attribution bar charts directly in the UI.
> 
> Third, our scheduling engine eliminates FIFO queues. When triage completes, our 5-factor matching algorithm evaluates candidate physicians: 40% weight on normalized urgency, 25% on specialty relevance, 20% on temporal availability, 10% on shared spoken language, and 5% on clinical experience. It then executes an ACID database transaction allocating the doctor's slot.
> 
> Fourth, the consultation workspace establishes peer-to-peer WebRTC video and audio streams via Socket.IO signaling with custom ICE candidate queue buffering and a low-bandwidth audio-only toggle. During the call, the physician reviews the patient's longitudinal history and issues a digital prescription. In our data model, finalized prescriptions are immutable clinical documents: corrections follow a linked-list revision chain using an `amendedFromId` foreign key. An automated server-side PDFKit pipeline compiles the prescription into a vector PDF stored for the patient. Finally, a Node-cron job executes every minute to dispatch dual Nodemailer appointment reminders.
> 
> Overall, the project reflects real-world engineering trade-offs between relational consistency, AI explainability, real-time media negotiation, and clinical safety."

---

# 2. Project Architecture

### Overall Architecture Diagram

```text
                             [ PATIENT & DOCTOR CLIENTS ]
                           React 19 SPA + Vite + CSS Modules
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │ HTTPS REST (Axios)                            │ WebSockets (Socket.IO)
                  ▼                                               ▼
     ┌─────────────────────────┐                     ┌─────────────────────────┐
     │  EXPRESS 5 API GATEWAY  │                     │ SOCKET.IO SIGNALING HUB │
     │  (Node.js Port :5000)   │                     │   (WebRTC SDP / ICE)    │
     └────────────┬────────────┘                     └────────────┬────────────┘
                  │                                               │
      ┌───────────┼───────────┬───────────┐                       │
      ▼           ▼           ▼           ▼                       ▼
  [Auth & RBAC] [Triage &]  [Consult]   [Prescription]     [WebRTC Audio/Video]
  [Middleware ] [Matching]  [Service]   [ & PDFKit   ]     [Direct Peer-to-Peer]
      │           │           │           │
      │           ▼           │           │
      │   ┌───────────────┐   │           │
      │   │ HTTP Proxy    │   │           │
      │   │ (Axios Client)│   │           │
      │   └───────┬───────┘   │           │
      │           │           │           │
      │           ▼           │           │
      │   ┌───────────────┐   │           │
      │   │ PYTHON FLASK  │   │           │
      │   │ AI MICROSERV. │   │           │
      │   │ (Port :8000)  │   │           │
      │   └───────┬───────┘   │           │
      │           │           │           │
      │     ┌─────┴─────┐     │           │
      │     ▼           ▼     │           │
      │  [ExtraTrees] [XGBoost│           │
      │  [Disease   ] [Fever  │           │
      │  [377 Feat. ] [ & SHAP│           │
      │                       │           │
      ▼                       ▼           ▼
  ┌───────────────────────────────────────────────┐
  │         DRIZZLE ORM DATA ACCESS LAYER         │
  └───────────────────────┬───────────────────────┘
                          │ Connection Pooling (SSL)
                          ▼
  ┌───────────────────────────────────────────────┐
  │           NEON POSTGRESQL DATABASE            │
  │    (20 Normalized Schemas / ACID Relational)  │
  └───────────────────────────────────────────────┘
```

### Frontend Architecture
- **Framework**: React 19 Single Page Application bundled with Vite 8.
- **Routing**: React Router DOM v7 utilizing dynamic role-based redirection:
  - Unauthenticated users $\to$ `/auth`
  - Authenticated Doctors $\to$ `/doctor-dashboard` (with onboarding gate to `/doctor-profile-setup`)
  - Authenticated Patients $\to$ `/dashboard` (with onboarding gate to `/profile-setup`)
- **State Management**: Localized React component state (`useState`, `useReducer`, `useRef`) paired with custom encapsulation hooks (e.g., `useAuthGuard.js`).
- **HTTP Client Architecture**: Axios instance (`apiClient` in `client/src/utils/api.js`) with proactive request interceptors that attach `Authorization: Bearer <token>` and `x-refresh-token` headers, coupled with a response interceptor managing an asynchronous request queue (`failedQueue`) to execute silent token refresh on 401 Unauthorized responses.
- **UI & Visualization**: Modular Vanilla CSS with design token variables (`variables.css`), Recharts for SHAP horizontal bar visualizations, and Lucide React icons.

### Backend Architecture
- **Framework**: Express 5 running on Node.js 20+ with ES Modules (`"type": "module"`).
- **Design Pattern**: 3-Tier Layered Architecture:
  - **Controllers** (`src/controllers/`): HTTP request parsing, status codes, parameter validation.
  - **Domain Services** (`src/services/`): Business logic, orchestration, ML proxying, PDF generation.
  - **Repositories** (`src/repositories/`): Data access abstraction using Drizzle ORM query builders and database transactions (`db.transaction`).
- **Middleware Pipeline**:
  1. CORS Origin Whitelist with credential validation.
  2. Cookie Parser for HTTP-only refresh tokens.
  3. JSON body parsing (`express.json()`) and URL-encoded parsing.
  4. Static file serving for generated prescription PDFs (`/uploads`).
  5. Global request logger.
  6. Global centralized error handler (`(err, req, res, next)`).
- **Background Jobs**: `node-cron` daemon initialized in `server.js` running every minute to inspect upcoming appointments and dispatch dual Nodemailer emails.

### Database Architecture
- **Engine**: Neon Serverless PostgreSQL.
- **ORM / Schema Tooling**: Drizzle ORM (`drizzle-orm`) with Drizzle Kit for schema migrations (`drizzle-kit push`, `drizzle-kit generate`).
- **Relational Design**: 20 normalized relational tables with UUID primary keys (`gen_random_uuid()`), foreign keys with cascade constraints (`onDelete: "cascade"`), and composite indexes on lookup fields (`user_id`, `consultation_id`, `doctor_id`).
- **Data Integrity**: Enums for roles (`patient`, `doctor`, `admin`), consultation statuses (`scheduled`, `in_progress`, `completed`, `cancelled`), and prescription statuses (`draft`, `finalized`, `amended`).

### AI / ML Architecture
- **Runtime**: Python 3.10+ Flask microservice listening on port 8000 (`ai-model/app.py`).
- **Memory Optimization**: Lazy model artifact loading (`get_general_model_artifacts()`, `get_fever_model_artifacts()`) ensuring low-memory boot footprints (<512MB RAM for cloud tiers).
- **General Disease Subsystem**: 377 binary symptom vocabulary vectorizer feeding an `ExtraTreesClassifier` (100 estimators, max depth 20) predicting 41 disease classes.
- **Fever Differential Subsystem**: 25 binary symptom vectorizer feeding an XGBoost / Random Forest classifier predicting 5 tropical febrile diseases, coupled with a `shap.TreeExplainer` computing marginal feature contributions.
- **Conversational LLM Subsystem**: Node.js backend integration with HuggingFace Router running `meta-llama/Llama-3.1-8B-Instruct`.

### External Services
- **HuggingFace Inference Router**: REST inference for general medical assistant queries.
- **Neon Cloud**: Serverless PostgreSQL database hosting with pooled connections.
- **Google STUN**: Public Interactive Connectivity Establishment (ICE) servers (`stun:stun.l.google.com:19302`) for WebRTC NAT traversal.
- **Nodemailer SMTP**: Gmail SMTP relay for automated consultation reminder emails.

### Deployment Architecture
- **Frontend SPA**: Hosted on Vercel (`https://e-sanjeevani-2-0.vercel.app`) with SPA rewrite rules configured in `vercel.json`.
- **Backend API & WebSockets**: Hosted on Render (`https://e-sanjeevani-2-0.onrender.com`).
- **Python ML Server**: Containerized / virtual environment Flask application running on Render port 8000.
- **Database**: Cloud Neon PostgreSQL with SSL mode enabled (`sslmode=require`).

---

# 3. Complete Project Flow

```text
[User Opens App]
       │
       ▼
[Check Auth Status (GET /api/auth/me)] ────────► [Not Logged In] ──► [/auth (Login/Register)]
       │ (Valid JWT / Refresh Cookie)                                        │
       ▼                                                                     ▼
[Profile Check: Completed?] ──► [NO] ──► [/profile-setup or /doctor-profile-setup]
       │ [YES]
       ▼
[Route to Dashboard]
   ├── Doctor: [/doctor-dashboard] (View Schedule, Roster, Start Calls, Analytics)
   └── Patient: [/dashboard] (Book Doctors, View Records, Launch AI Triage)
```

---

### Detailed Feature Breakdown

#### Feature 1: Dual-Token Authentication & Silent Refresh
1. **What it does**: Authenticates users, issues short-lived JWT access tokens and long-lived rotating refresh tokens, and silently renews access tokens without user interruption.
2. **Why it exists**: Prevents XSS token theft by keeping refresh tokens in `httpOnly` cookies while maintaining fast, stateless authorization via access tokens.
3. **Frontend flow**: `client/src/pages/Auth/Auth.jsx` captures email/password $\to$ submits `POST /api/auth/login` $\to$ saves `accessToken` in memory/local storage $\to$ Axios interceptor attaches token to all requests $\to$ on 401 response, pauses requests in queue, calls `POST /api/auth/refresh`, and replays failed requests.
4. **Backend flow**: `authController.js` calls `auth.service.js` $\to$ verifies bcrypt password hash $\to$ signs 15-minute JWT access token $\to$ generates 7-day cryptographic refresh token $\to$ stores hashed refresh token in `refresh_tokens` table $\to$ sets HTTP-only cookie.
5. **Database interaction**: Reads `users` table; inserts/updates `refresh_tokens` table.
6. **Important files**: `server/src/controllers/authController.js`, `server/src/services/auth.service.js`, `server/src/middlewares/authMiddleware.js`, `client/src/utils/api.js`.
7. **Important functions**: `login()`, `refreshToken()`, `authMiddleware()`, `apiClient.interceptors.response.use()`.
8. **Interviewer Questions**:
   - *Q: Why store refresh tokens in the database if JWTs are supposed to be stateless?*  
     *A: Storing refresh tokens enables immediate server-side revocation on logout, password reset, or suspicious activity.*

#### Feature 2: Explainable Fever Differential Assessment (SHAP)
1. **What it does**: Evaluates 25 binary symptoms across 5 febrile diseases (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever), flags emergency red flags, and visually explains the top prediction using SHAP contribution bars.
2. **Why it exists**: Solves clinical ambiguity in tropical fevers where symptom overlap leads to misdiagnosis, and builds doctor trust via explainable AI.
3. **Frontend flow**: `client/src/components/AiTriage/AiTriage.jsx` displays a categorized 25-symptom grid $\to$ user selects symptoms $\to$ sends `POST /api/fever/assess` $\to$ renders ranked cards and `ShapContributionChart.jsx` (Recharts). If red flags are checked, opens `RedFlagEmergencyModal.jsx`.
4. **Backend flow**: Express `feverRoutes.js` proxies request to Flask `POST /predict-fever` $\to$ Flask executes `check_red_flags()` $\to$ builds feature DataFrame $\to$ predicts probabilities via XGBoost/RF $\to$ runs `shap.TreeExplainer` $\to$ normalizes contributions into positive (green) and negative (red) impacts $\to$ returns payload.
5. **Database interaction**: Optionally records triage session into `triage_sessions` and `triage_responses`.
6. **Important files**: `client/src/components/AiTriage/AiTriage.jsx`, `client/src/components/AiTriage/ShapContributionChart.jsx`, `server/src/routes/feverRoutes.js`, `ai-model/app.py`.
7. **Important functions**: `predict_fever()`, `get_shap_explanation()`, `check_red_flags()`.
8. **Interviewer Questions**:
   - *Q: What do the positive and negative bars in the SHAP chart represent?*  
     *A: A positive SHAP value indicates a symptom increased the model's output probability toward that specific disease, while a negative value pushed the probability away from it.*

#### Feature 3: Dynamic 5-Factor Doctor Matching Algorithm
1. **What it does**: Eliminates FIFO queues by ranking available doctors based on patient urgency, specialty match, slot availability, language, and doctor experience.
2. **Why it exists**: Ensures acute emergency patients receive immediate care from the most qualified and available specialist.
3. **Frontend flow**: Triggered after triage questionnaire completion in `AiTriage.jsx` $\to$ displays matched doctor recommendation $\to$ user confirms booking $\to$ redirects to video room or appointments list.
4. **Backend flow**: `triageController.js` invokes `doctorMatching.js` $\to$ calculates patient urgency (1-10) $\to$ queries candidate doctors by specialty from `DoctorProfileRepository` $\to$ loops through doctors and evaluates priority utility score $\to$ sorts descending $\to$ executes `createAutoMatchedConsultation` inside a database transaction (`db.transaction`).
5. **Database interaction**: Queries `doctor_profiles`, `doctor_availabilities`, `availability_slots`; inserts into `consultations`; updates `availability_slots.isBooked = true`.
6. **Important files**: `server/src/helpers/doctorMatching.js`, `server/src/helpers/urgencyScoring.js`, `server/src/repositories/doctorProfile.repository.js`.
7. **Important functions**: `calculateDoctorPriority()`, `matchDoctorBySpecialty()`, `createAutoMatchedConsultation()`.
8. **Interviewer Questions**:
   - *Q: How do you prevent race conditions when two patients match with the same doctor's slot simultaneously?*  
   - *A: By wrapping slot selection and booking inside an ACID database transaction (`db.transaction`) with transactional row locking.*

#### Feature 4: WebRTC Telemedicine Consultation & In-Call Workspace
1. **What it does**: Connects doctor and patient in an encrypted, peer-to-peer audio/video call with real-time text chat, audio-only pre-join toggles, and split-pane clinical copilot.
2. **Why it exists**: Enables remote clinical care without third-party teleconsultation SaaS dependencies.
3. **Frontend flow**: User enters `/video-call/:consultationId` $\to$ displays pre-join modal (mic/camera preview or audio-only check) $\to$ connects to Socket.IO $\to$ joins room $\to$ creates WebRTC offer/answer $\to$ streams media to `<video>` elements $\to$ doctor opens prescription/AI pane.
4. **Backend flow**: `server/src/socket/socketServer.js` listens for `join-room`, relays WebRTC SDP offers (`send-offer`), answers (`send-answer`), ICE candidates (`send-ice-candidate`), media mute toggles (`toggle-video`, `toggle-audio`), and in-call messages (`send-message`).
5. **Database interaction**: Fetches `consultations`, `patient_profiles`, and `ai_triage_chats`; stores chat messages in `chat_messages` table.
6. **Important files**: `client/src/pages/VideoCall/VideoCall.jsx`, `server/src/socket/socketServer.js`, `server/src/controllers/doctorAssistantController.js`.
7. **Important functions**: `initializeSocket()`, `handleUserJoined()`, `createOffer()`, `iceCandidateQueueRef`.
8. **Interviewer Questions**:
   - *Q: Why do you buffer ICE candidates in `iceCandidateQueueRef`?*  
   - *A: If an ICE candidate arrives from the remote peer before `setRemoteDescription` has executed, calling `addIceCandidate` will throw a DOMException. Buffering candidates until the remote description is set prevents dropped connections.*

#### Feature 5: First-Class Prescription Lifecycle & Vector PDF Generation
1. **What it does**: Allows doctors to draft, finalize, and amend medical prescriptions with automated medication duration calculation and server-rendered downloadable PDFs.
2. **Why it exists**: Elevates prescriptions from plain-text notes into auditable, legal medical entities with structured dosage timelines.
3. **Frontend flow**: Doctor fills diagnosis, medication items, advice, and follow-up days in `VideoCall.jsx` or `ClinicalRecords.jsx` $\to$ clicks "Finalize & Issue" $\to$ triggers `POST /api/prescriptions` $\to$ receives prescription object with `pdfUrl` $\to$ enables one-click PDF download.
4. **Backend flow**: `PrescriptionLifecycleService.issuePrescription()` verifies doctor ownership $\to$ creates `prescriptions` row $\to$ parses each medicine duration to compute `endDate` $\to$ inserts `prescription_items` $\to$ calls `PrescriptionPdfService` to stream vector PDF via PDFKit $\to$ marks status as `finalized` $\to$ creates medical record timeline entry.
5. **Database interaction**: Inserts into `prescriptions`, `prescription_items`, `medical_records`, `medical_record_attachments`.
6. **Important files**: `server/src/services/prescriptionLifecycle.service.js`, `server/src/services/prescriptionPdfService.js`, `server/src/database/schema/prescriptions.js`, `server/src/database/schema/prescriptionItems.js`.
7. **Important functions**: `issuePrescription()`, `amendPrescription()`, `generatePrescriptionPdf()`.
8. **Interviewer Questions**:
   - *Q: Why can't a doctor edit a finalized prescription directly using an SQL UPDATE?*  
   - *A: In medical jurisprudence, altering an issued prescription is illegal and dangerous. Our system enforces immutability: corrections create a new amended prescription linked to the original via `amendedFromId`.*

---

# 4. TECH STACK QUESTIONS

### React 19
- **Why React?**: React's component-based virtual DOM allows building complex, reactive clinical interfaces (video feeds, live chats, dynamic symptom grids, and patient records) with predictable one-way data flow.
- **Why React 19 specifically?**: React 19 provides upgraded concurrent rendering, improved action hooks, and optimized hydration, making real-time media dashboards highly responsive.
- **Where are hooks used?**:
  - `useState`: Form controls, modal visibility, chat messages, active clinical tabs.
  - `useEffect`: Socket.IO lifecycle, WebRTC event listeners, consultation data fetching, timer intervals.
  - `useRef`: Retaining WebRTC `RTCPeerConnection`, local/remote media stream references, ICE candidate queue buffers, and chat auto-scroll anchors without triggering component re-renders.
  - `useCallback`: Memoizing socket signaling callbacks in `VideoCall.jsx` to avoid teardown/reconnection loops.
- **What happens when state changes?**: React re-renders the component and its children, diffs the virtual DOM against the browser DOM, and efficiently updates only the modified nodes.

### Vite 8
- **Why Vite instead of Create React App?**: Vite leverages native browser ES Modules (ESM) during development and utilizes esbuild for pre-bundling dependencies, providing near-instant Hot Module Replacement (HMR) and sub-second startup compared to CRA's slow Webpack bundling.

### Node.js & Express 5
- **Why Node.js?**: Node's non-blocking, event-driven I/O model is ideal for I/O-intensive telemedicine applications handling concurrent REST API requests, WebSocket video signaling, and streaming PDF generation.
- **Why Express 5?**: Express 5 provides native Promise support in route handlers (automatically routing rejected promises to global error middleware without needing `express-async-errors`), an upgraded router, and hardened security defaults.
- **How does request-response flow work?**: Client request $\to$ CORS verification $\to$ cookie parsing $\to$ JSON body parsing $\to$ authentication middleware $\to$ schema validator $\to$ controller $\to$ domain service $\to$ Drizzle repository $\to$ PostgreSQL database $\to$ formatted JSON response.

### Neon Serverless PostgreSQL & Drizzle ORM
- **Why PostgreSQL over MongoDB?**: Telemedicine requires strict relational data integrity (foreign key cascades, unique constraints on slots, relational links between prescriptions, items, consultations, and users). MongoDB's schemaless design led to inconsistent doctor notes and orphaned data in Phase 1.
- **Why Drizzle ORM instead of Prisma or TypeORM?**: Drizzle is lightweight, has zero runtime overhead, provides full TypeScript/JavaScript type safety, generates clean SQL queries without heavy hidden abstraction layers, and integrates natively with Neon's serverless connection pool (`@neondatabase/serverless`).
- **What relationships exist?**:
  - 1-to-1: `users` $\leftrightarrow$ `patient_profiles`, `users` $\leftrightarrow$ `doctor_profiles`.
  - 1-to-Many: `doctor_availabilities` $\leftrightarrow$ `availability_slots`, `prescriptions` $\leftrightarrow$ `prescription_items`, `consultations` $\leftrightarrow$ `chat_messages`.
  - Many-to-1: `consultations` $\to$ `users` (patient), `consultations` $\to$ `users` (doctor).
  - Self-Referencing: `prescriptions.amendedFromId` $\to$ `prescriptions.id`.

### Socket.IO & WebRTC
- **Why Socket.IO?**: WebRTC requires a signaling channel to negotiate session metadata (Session Description Protocol / SDP) and network routing information (ICE candidates). Socket.IO provides reliable bi-directional WebSocket communication with automatic fallback to HTTP long-polling and built-in room clustering (`socket.join(consultationId)`).
- **Why WebRTC?**: WebRTC enables direct peer-to-peer audio and video transmission with end-to-end SRTP encryption, bypassing intermediate media servers to achieve low latency.

### Python Flask & Machine Learning
- **Why a separate Python Flask microservice?**: Python is the industry standard for scientific computing, Scikit-learn, XGBoost, and SHAP. Running ML directly inside Node.js via child processes or ONNX runtime limits access to cutting-edge explainability libraries like SHAP.
- **Why Flask instead of FastAPI?**: The service is a focused, synchronous prediction gateway. Flask paired with Gunicorn provides a simple, robust, low-memory footprint (<512MB RAM) that meets our deployment budget on Render.

---

# 5. PROJECT-SPECIFIC TECHNICAL QUESTIONS (50+ In-Depth Questions)

### Q1: Explain the 5-factor doctor matching formula and why each weight was chosen.
- **Difficulty**: Medium
- **What interviewer is testing**: Algorithmic thinking, domain knowledge, multi-criteria decision analysis.
- **Strong Interview Answer**:
  "Our matching formula replaces inefficient FIFO queues with a utility function:
  $$\text{Priority} = 0.40 \cdot U_{\text{norm}} + 0.25 \cdot S_{\text{match}} + 0.20 \cdot A_{\text{score}} + 0.10 \cdot L_{\text{score}} + 0.05 \cdot E_{\text{norm}}$$
  - $40\%$ Urgency ($U_{\text{norm}}$): Clinical safety is the highest priority; an emergency or acute case must always take precedence over a routine consultation.
  - $25\%$ Specialty Match ($S_{\text{match}}$): A patient with cardiac symptoms or dengue must be assigned to a relevant specialist (1.0) rather than a generalist (0.5).
  - $20\%$ Availability ($A_{\text{score}}$): Even the best specialist is useless if their next slot is in three weeks; availability decays smoothly from 1.0 ($\le 12$h) down to 0.2.
  - $10\%$ Language ($L_{\text{score}}$): Crucial in diverse populations (e.g., India) to avoid diagnostic miscommunication.
  - $5\%$ Experience ($E_{\text{norm}}$): A tie-breaker prioritizing veteran physicians when all other clinical factors are equal."
- **Deeper Follow-up**: *What happens if no specialist is available within 24 hours for a critical patient?*
- **Follow-up Answer**: *The algorithm falls back to matching a General Physician with immediate availability ($S_{\text{match}} = 0.5$, $A_{\text{score}} = 1.0$), ensuring emergency stabilization over delayed specialist matching.*

### Q2: How did you implement Explainable AI (SHAP) in the Fever Differential model?
- **Difficulty**: Hard
- **What interviewer is testing**: Machine learning explainability, game theory, API design.
- **Strong Interview Answer**:
  "In healthcare, black-box predictions are unacceptable because clinicians need to know *why* a model reached a conclusion. In `ai-model/app.py`, we initialize `shap.TreeExplainer` on our trained tree model. When the patient submits a 25-symptom binary vector, the model predicts class probabilities for Dengue, Malaria, Typhoid, Chikungunya, and Viral Fever. We then compute Shapley values for the top-ranked class. We filter active symptoms, sort them by absolute contribution, and map them to positive features (pushing towards the disease) and negative features (pushing away). These are sent to the client and rendered as color-coded horizontal bars via Recharts."
- **Deeper Follow-up**: *What is the mathematical foundation of Shapley values?*
- **Follow-up Answer**: *Shapley values stem from cooperative game theory. They calculate the average marginal contribution of a feature across all possible subsets (coalitions) of features, guaranteeing four axioms: efficiency, symmetry, dummy player, and additivity.*

### Q3: How do you handle WebRTC ICE candidate arrival before remote description is set?
- **Difficulty**: Hard
- **What interviewer is testing**: Real-time networking, asynchronous race condition handling, WebRTC state machine.
- **Strong Interview Answer**:
  "In WebRTC, ICE candidates can arrive over the signaling socket before the browser has finished calling `peerConnection.setRemoteDescription(offer/answer)`. If you immediately invoke `peerConnection.addIceCandidate(candidate)`, the WebRTC engine throws an error because it doesn't yet know the remote media descriptions. In `VideoCall.jsx`, I resolved this by introducing `iceCandidateQueueRef = useRef([])`. When a candidate arrives, we check if `peerRef.current.remoteDescription` is set. If not, we push it to the queue. As soon as `setRemoteDescription` resolves, we iterate through the buffered queue and flush all pending candidates via `addIceCandidate`."
- **Deeper Follow-up**: *What STUN servers did you use and what happens if both peers are behind symmetric NATs?*
- **Follow-up Answer**: *We configured Google's public STUN servers. If both peers are behind symmetric NATs, STUN cannot resolve peer endpoints; a TURN relay server (Traversal Using Relays around NAT) running Coturn would be required to relay media packets.*

### Q4: Explain the dual-token authentication pattern and why both cookies and headers are supported.
- **Difficulty**: Medium
- **What interviewer is testing**: Web security, session management, CORS/port isolation.
- **Strong Interview Answer**:
  "We implement dual-token authentication: a short-lived 15-minute JWT access token and a 7-day cryptographic refresh token stored in PostgreSQL. In production, the refresh token is stored in an `httpOnly`, `Secure`, `SameSite=None` cookie to prevent JavaScript XSS attacks. In `authMiddleware.js`, we prioritize the `Authorization: Bearer` header over cookies. This allows port-isolated local development across different localhost ports and supports mobile/third-party API clients, while cookie fallback guarantees browser security."
- **Deeper Follow-up**: *How do you invalidate tokens if a user changes their password or is banned?*
- **Follow-up Answer**: *When a user logs out or changes credentials, their record in the `refresh_tokens` table is deleted. Additionally, `authMiddleware.js` queries PostgreSQL on every request to verify `users.isActive == true`."

### Q5: Why is a finalized prescription immutable, and how do you handle corrections?
- **Difficulty**: Medium
- **What interviewer is testing**: Domain modeling, legal compliance, database design patterns.
- **Strong Interview Answer**:
  "In medical systems, modifying a finalized prescription is a legal liability because a patient might have already purchased or consumed the prescribed drugs. Therefore, our `prescriptions` table treats finalized records as append-only. When a doctor needs to amend an issued prescription, `PrescriptionLifecycleService.amendPrescription()` marks the original prescription's status as `'amended'` and creates a new prescription record with `amendedFromId` pointing to the original ID. This maintains an immutable, traceable audit trail of all medical revisions."
- **Deeper Follow-up**: *How does the UI represent this amendment chain?*
- **Follow-up Answer**: *The UI in `ClinicalRecords.jsx` displays an 'Amended' badge on the original record and links to the superseded revision with timestamps and doctor notes explaining the change.*

### Q6: How does the consultation reminder cron job work and what is a potential bug in its implementation?
- **Difficulty**: Hard
- **What interviewer is testing**: Background processing, edge case discovery, debugging skills.
- **Strong Interview Answer**:
  "`server/src/cron/consultationReminderJob.js` runs every minute (`* * * * *`). It computes `currentTime` as `HH:mm`, queries scheduled consultations matching today's date where `startTime == currentTime` and `reminderSent == false`, sends emails via Nodemailer, and sets `reminderSent = true`.
  A critical bug in this implementation is strict string equality: `eq(consultations.startTime, currentTime)`. If the Node.js event loop is blocked, the server restarts, or a database connection delays execution during that exact minute, the job skips that minute entirely, and the reminder for those consultations is permanently lost. A resilient design should check `lte(consultations.startTime, currentTime + 15min)` and track status with a range window."
- **Deeper Follow-up**: *Why not use Redis BullMQ instead of node-cron?*
- **Follow-up Answer**: *Node-cron was chosen for zero-dependency simplicity on Render. For enterprise scale, BullMQ on Redis provides persistent job queues, retries with exponential backoff, and distributed workers.*

### Q7: What dataset was used to train the Fever Differential model and why?
- **Difficulty**: Medium
- **What interviewer is testing**: Data engineering, medical AI data curation.
- **Strong Interview Answer**:
  "We curated a dataset of 1,500 clinical symptom profiles constructed programmatically from official World Health Organization (WHO) clinical fact sheets for tropical fevers. Public Kaggle datasets for fevers are notoriously noisy and contain duplicate or conflicting symptom vectors. By grounding our training distribution in WHO clinical case definitions, each disease (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever) has clear probabilistic distributions reflecting clinical reality (e.g., retro-orbital pain having high conditional probability in Dengue)."
- **Deeper Follow-up**: *What is the risk of training on synthetically generated clinical profiles?*
- **Follow-up Answer**: *Synthetic profiles may underestimate multi-morbidity interactions in real-world patients. It serves as clinical decision support, but prospective validation on real hospital EHR data is needed for clinical trials.*

### Q8: How does the system handle concurrent 401 Unauthorized errors in the frontend?
- **Difficulty**: Hard
- **What interviewer is testing**: Frontend concurrency, Axios interceptor architecture.
- **Strong Interview Answer**:
  "If multiple components trigger API requests simultaneously when the 15-minute access token expires, all requests return 401. Without coordination, the client would fire multiple concurrent `/auth/refresh` requests, causing token rotation race conditions. In `client/src/utils/api.js`, we maintain an `isRefreshing` boolean flag and a `failedQueue` array. The first 401 sets `isRefreshing = true` and triggers `/auth/refresh`. Subsequent 401 requests are converted into unresolved Promises pushed into `failedQueue`. Once the refresh request succeeds, `processQueue()` resolves all queued promises with the new token and replays the requests."
- **Deeper Follow-up**: *What happens if the refresh token itself is expired or invalid?*
- **Follow-up Answer**: *`processQueue` rejects all pending promises with the error, clears local tokens via `clearLocalToken()`, and redirects the user to `/auth`.*

### Q9: How are medication end dates calculated in the prescription subsystem?
- **Difficulty**: Easy
- **What interviewer is testing**: Date manipulation, business logic implementation.
- **Strong Interview Answer**:
  "Instead of running background cron jobs to update medication statuses from 'active' to 'completed', our backend calculates `endDate` deterministically at insertion:
  `endDate = startDate + duration_in_days`. When fetching active medications in `patientHistory.service.js`, the query simply checks:
  `where(and(eq(status, 'active'), gte(endDate, new Date())))`. This makes the active medication status a zero-maintenance computed property."
- **Deeper Follow-up**: *What if a patient discontinues a medication early due to side effects?*
- **Follow-up Answer**: *We provide an endpoint `PATCH /api/prescriptions/:id/items/:itemId/discontinue` allowing the physician to manually set `status = 'discontinued'`, overriding the computed end date.*

### Q10: How does the Red-Flag Emergency detector work?
- **Difficulty**: Medium
- **What interviewer is testing**: Clinical safety, guardrail design.
- **Strong Interview Answer**:
  "In `ai-model/app.py`, the `/predict-fever` endpoint executes `check_red_flags()` before running any ML model inference. It checks for critical clinical indicators like `bleeding`, `blood_in_vomit`, `breathing_difficulty`, `loss_of_consciousness`, and `cold_clammy_skin`. If any flag is present, the server bypasses the ML pipeline entirely and returns `red_flag_alert: true`. On the frontend, this intercepts the UI and displays a hard-blocking modal (`RedFlagEmergencyModal.jsx`) advising the user to immediately call emergency services or visit an emergency room."
- **Deeper Follow-up**: *Why bypass the ML model entirely on red flags?*
- **Follow-up Answer**: *Showing an ML probability score (e.g. '85% Dengue') to a patient with internal hemorrhage might encourage them to wait for an outpatient teleconsultation rather than seeking immediate emergency care.*

---

### Additional Project-Specific Questions (Q11 to Q55 Summary Matrix)

| # | Question | Difficulty | What is Tested | Core Technical Answer Summary |
|---|---|---|---|---|
| **Q11** | How does `AiTriage.jsx` handle the 377 symptom vocabulary? | Medium | Text vectorization | Vectorizes text input against `symptom_columns.pkl` using binary occurrence (0/1). |
| **Q12** | Why did you choose Drizzle ORM over Prisma? | Medium | Node.js tooling | Zero runtime footprint, faster startup, direct SQL-like query builder, serverless Neon compatibility. |
| **Q13** | How does `socketServer.js` handle room disconnections? | Medium | WebSockets | Listens for `disconnecting`, notifies remaining room peers with `user-left`, cleans up memory. |
| **Q14** | How does the audio-only mode work in `VideoCall.jsx`? | Easy | MediaStreams API | Passes `{ video: false, audio: true }` to `getUserMedia()`, notifies peer via `video-status-changed`, displays avatar initials. |
| **Q15** | How is PDF generation handled without blocking the Node event loop? | Hard | Node.js Streams | Uses PDFKit stream pipelines writing directly to filesystem chunks, avoiding monolithic buffer blocking. |
| **Q16** | What is the purpose of `patient_addresses` table? | Easy | Database normalization | Normalizes street, city, state, postal code, and geo-coordinates away from core `patient_profiles`. |
| **Q17** | How does `doctorAssistantController.js` retrieve call context? | Medium | Aggregation | Aggregates patient demographics, past consultations count, triage urgency, and recent diagnoses. |
| **Q18** | What happens if the Python Flask server crashes? | Medium | Fault tolerance | Express catch block catches Axios connection refusal (ECONNREFUSED) and returns a structured 503 response. |
| **Q19** | How is doctor authorization verified before accessing patient history? | Hard | Security / RBAC | Queries `consultations` table to verify at least one completed/scheduled consultation links doctor and patient. |
| **Q20** | Why are passwords hashed with bcrypt salt work factor 10? | Easy | Cryptography | Balances brute-force resistance against CPU computational latency (~100ms per hash). |
| **Q21** | How does the 10-point urgency scoring formula work in `urgencyScoring.js`? | Medium | Algorithmic logic | Adds +10 for critical symptoms, +7 for high, +4 for moderate, +1 for low, duration checks, age risk factor, clamped 0-10. |
| **Q22** | How do you avoid infinite re-renders in `VideoCall.jsx`? | Hard | React optimization | Stores WebRTC objects, media streams, and interval timers in `useRef` rather than `useState`. |
| **Q23** | What does `db.transaction()` accomplish in `doctorMatching.js`? | Hard | ACID transactions | Ensures consultation creation and slot booking occur atomically; rolls back if either operation fails. |
| **Q24** | How does the HuggingFace LLM integration handle prompt engineering? | Medium | Generative AI | Injects system instructions enforcing clinical persona, empathy, disclaimer notices, and conciseness. |
| **Q25** | How is CORS configured in `app.js`? | Medium | Network security | Dynamic origin whitelist matching local ports, Vercel subdomains, with `credentials: true`. |
| **Q26** | What indexes are defined in Drizzle schemas? | Medium | Database indexing | Foreign key indexes on `consultations(patient_id, doctor_id)`, `prescriptions(consultation_id)`. |
| **Q27** | How is file upload handled for lab reports? | Medium | Multer storage | Multer middleware intercepts `multipart/form-data`, validates MIME type (PDF/PNG/JPG), saves to disk. |
| **Q28** | Why use `ExtraTreesClassifier` for general diseases? | Medium | ML ensemble | Extremely Randomized Trees randomize split thresholds, reducing variance and overfitting on sparse binary data. |
| **Q29** | What metrics were used to evaluate the Fever model? | Medium | Model evaluation | Stratified 5-fold cross-validation, Macro F1-score, multiclass ROC-AUC, and confusion matrix. |
| **Q30** | How does `ShapContributionChart.jsx` sort features? | Easy | Data visualization | Sorts features by `Math.abs(value)` descending, taking top 8 most influential symptoms. |
| **Q31** | How are doctor consultation fees stored? | Easy | Schema design | Stored as integer/decimal in `doctor_profiles.consultationFee` with currency defaults. |
| **Q32** | What happens if a patient cancels a booked appointment? | Medium | Business workflow | Status changes to `'cancelled'`, and associated slot's `isBooked` flag is reverted to `false`. |
| **Q33** | How does the frontend handle token expiration during an active video call? | Hard | Resilient networking | Video call relies on WebRTC peer connection and WebSocket auth established at join time; REST calls refresh via Axios. |
| **Q34** | What is the purpose of `consultation_reports` table? | Easy | Clinical documentation | Stores post-call physician findings, ICD-10 notes, and summary advice. |
| **Q35** | How does `DoctorAnalytics.jsx` compute patient retention? | Medium | SQL Analytics | Aggregates repeat patient IDs across consultations grouped by calendar month. |
| **Q36** | Why did you choose Recharts for data visualization? | Easy | React libraries | Declarative React SVG components that support responsive containers and animations out of the box. |
| **Q37** | What is the time complexity of the doctor matching algorithm? | Hard | Algorithm analysis | $O(N \log N)$ where $N$ is the number of verified candidate doctors matching the target specialty. |
| **Q38** | How is SQL injection prevented in Drizzle ORM? | Easy | SQL security | Drizzle uses parameterized SQL queries by default for all inputs. |
| **Q39** | What happens if a user submits empty symptoms to `/predict`? | Easy | Input validation | Returns HTTP 400 Bad Request with `"Please provide symptoms"`. |
| **Q40** | How does lazy loading work in `ai-model/app.py`? | Hard | Memory optimization | Model artifacts are loaded into global variables only when the first request hits `/predict` or `/predict-fever`. |
| **Q41** | What is the role of `drizzle.config.js`? | Easy | Tooling config | Specifies schema path, dialect (`postgresql`), and database credentials for migrations. |
| **Q42** | How do you prevent multiple doctors from booking the same availability slot? | Medium | Unique constraints | Unique constraint on `(availability_id, start_time)` prevents duplicate slot definitions. |
| **Q43** | How is chat history loaded in `VideoCall.jsx`? | Medium | REST to WS bridge | Fetches past messages via `GET /api/chat/consultation/:id/messages` on mount; receives live messages via Socket. |
| **Q44** | What happens if Nodemailer SMTP credentials fail? | Medium | Error resilience | Error is caught and logged; the cron job does not crash and continues processing remaining reminders. |
| **Q45** | How are medical records deleted? | Easy | Referential integrity | Hard deletion uses cascading deletes on attachments, or soft-deletion flags. |
| **Q46** | What is the significance of `SameSite=None` in cookies? | Hard | Cross-origin security | Required when frontend (Vercel) and backend (Render) reside on different root domains with HTTPS. |
| **Q47** | How does `getInitials()` handle doctor names? | Easy | String manipulation | Strips titles ('Dr.', 'Mr.') via regex and extracts first and last initials. |
| **Q48** | Why use Gunicorn in production for Python Flask? | Medium | WSGI production | Flask's built-in server is single-threaded; Gunicorn provides multi-worker concurrency. |
| **Q49** | How does `NotificationService.js` work? | Easy | Browser APIs | Wraps HTML5 Audio notifications, browser Notification API, and React Hot Toast. |
| **Q50** | What is the difference between `triage_sessions` and `ai_triage_chats`? | Medium | Domain modeling | `triage_sessions` stores structured questionnaire state; `ai_triage_chats` logs raw ML model inputs/outputs. |
| **Q51** | How is doctor schedule availability configured? | Medium | Schedule logic | Doctors create recurring day-of-week slots with start and end times in 15/30-minute intervals. |
| **Q52** | How do you avoid memory leaks with Socket.IO in React? | Medium | React lifecycle | Returns a cleanup function in `useEffect` calling `socket.disconnect()` and `socket.off()`. |
| **Q53** | What is the advantage of vector PDF generation over HTML-to-PDF canvas? | Hard | Performance & clarity | PDFKit renders crisp, selectable vector text with tiny file sizes (~30KB) vs rasterized canvas bloat (~2MB). |
| **Q54** | How does the system prevent unauthorized patients from viewing other patients' prescriptions? | Medium | Authorization | Backend verifies `prescription.patientId === req.user.id` or assigned doctor ID before returning data. |
| **Q55** | Why does `authMiddleware.js` query PostgreSQL on every request? | Hard | Security vs latency trade-off | Ensures deactivated users or role revoking takes effect instantly, at the cost of one indexed DB lookup per request. |

---

# 6. CODE-LEVEL QUESTIONS

### Code Snippet 1: Doctor Priority Formula (`server/src/helpers/doctorMatching.js`)
```javascript
export const calculateDoctorPriority = (doctor, urgencyScore, availability) => {
  const urgencyNormalized = Math.min(urgencyScore / 10, 1);
  const urgencyComponent = urgencyNormalized * 0.4;
  const specialtyMatch = 1.0;
  const specialtyComponent = specialtyMatch * 0.25;
  const availableDate = new Date(availability.availableDate);
  const timeUntilAvailable = availableDate.getTime() - new Date().getTime();
  const daysUntilAvailable = timeUntilAvailable / (1000 * 60 * 60 * 24);

  let availabilityScore = 0;
  if (daysUntilAvailable <= 0.5) availabilityScore = 1.0;
  else if (daysUntilAvailable <= 1) availabilityScore = 0.9;
  else if (daysUntilAvailable <= 3) availabilityScore = 0.7;
  else if (daysUntilAvailable <= 7) availabilityScore = 0.5;
  else availabilityScore = Math.max(0.2, 1 - daysUntilAvailable / 30);
  const availabilityComponent = availabilityScore * 0.2;

  const languageScore = doctor.languagesSpoken?.length > 0 ? 1.0 : 0.8;
  const languageComponent = languageScore * 0.1;
  const experienceNormalized = Math.min((doctor.experience || 0) / 20, 1);
  const historyComponent = experienceNormalized * 0.05;

  return urgencyComponent + specialtyComponent + availabilityComponent + languageComponent + historyComponent;
};
```
- **File**: `server/src/helpers/doctorMatching.js`
- **Function**: `calculateDoctorPriority`
- **Interviewer Question**: *What is the time and space complexity of this function, and can `daysUntilAvailable` become negative?*
- **Strong Answer**:
  "Time complexity is $O(1)$ and space complexity is $O(1)$ as it involves constant-time arithmetic calculations. If `availability.availableDate` is earlier in the day than `new Date()`, `daysUntilAvailable` can evaluate to $\le 0$. Because the first condition checks `daysUntilAvailable <= 0.5`, it assigns a score of 1.0, treating same-day slots as highest availability. To be cleaner, we could clamp negative values with `Math.max(0, daysUntilAvailable)`."

---

### Code Snippet 2: Axios Silent Refresh Interceptor (`client/src/utils/api.js`)
```javascript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest.url === "/auth/refresh";
    const isLoginRequest = originalRequest.url === "/auth/login" || originalRequest.url === "/auth/register";

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isLoginRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest)).catch((err) => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshRes = await apiClient.post("/auth/refresh");
        if (refreshRes.data?.accessToken) setLocalToken(refreshRes.data.accessToken);
        isRefreshing = false;
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        clearLocalToken();
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```
- **File**: `client/src/utils/api.js`
- **Interviewer Question**: *Why is `originalRequest._retry = true` necessary? What catastrophic bug happens without it?*
- **Strong Answer**:
  "Without `originalRequest._retry = true`, if the replayed request fails with a 401 error again (e.g. if the refreshed token is also rejected or permissions changed), the interceptor would trigger another refresh call recursively. This creates an infinite HTTP request loop that can exhaust browser memory and crash the backend gateway."

---

### Code Snippet 3: Red-Flag Interception (`ai-model/app.py`)
```python
def check_red_flags(red_flag_data) -> list:
    if isinstance(red_flag_data, list):
        return [flag for flag in RED_FLAGS if flag in red_flag_data]
    elif isinstance(red_flag_data, dict):
        return [flag for flag in RED_FLAGS if red_flag_data.get(flag, False)]
    return []
```
- **File**: `ai-model/app.py`
- **Function**: `check_red_flags`
- **Interviewer Question**: *Why does this function handle both list and dict types for `red_flag_data`?*
- **Strong Answer**:
  "Frontend clients might serialize symptoms either as an array of active string keys (e.g. `['bleeding', 'confusion']`) or as an object map with booleans (e.g. `{'bleeding': True, 'confusion': False}`). Accepting both polymorphic structures guarantees backward compatibility and prevents runtime serialization errors between different API callers."

---

### Code Snippet 4: Strict Cron Time Equality Discrepancy
```javascript
// server/src/cron/consultationReminderJob.js
const currentTime = `${currentHour}:${currentMinute}`;
// ...
where(
  and(
    gte(consultations.consultationDate, todayStart),
    lte(consultations.consultationDate, todayEnd),
    eq(consultations.status, "scheduled"),
    eq(consultations.reminderSent, false),
    eq(consultations.startTime, currentTime) // <-- Strict minute match
  )
)
```
- **File**: `server/src/cron/consultationReminderJob.js`
- **Interviewer Question**: *What is the defect here and how would you optimize this query for production?*
- **Strong Answer**:
  "The defect is comparing `startTime` with strict string equality against `currentTime`. If the process is descheduled or delayed for even 61 seconds, the reminder window is missed. In production, we should store `scheduledStartTime` as an indexed SQL `TIMESTAMP WITH TIME ZONE` and query a time range: `WHERE scheduled_start_time BETWEEN NOW() AND NOW() + INTERVAL '15 minutes' AND reminder_sent = FALSE`."

---

# 7. API INTERVIEW QUESTIONS

### API Inventory Table

| Method | Endpoint | Purpose | Authentication | Request Body Summary | Response Summary | Important Logic |
|:---|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/register` | Register new user | Public | `{ name, email, password, role }` | `{ user, accessToken }` | Hashes password with bcrypt (10 rounds); rejects duplicate emails. |
| `POST` | `/api/auth/login` | Authenticate user | Public | `{ email, password }` | `{ user, accessToken }` | Issues 15m JWT + sets 7d HTTP-only refresh cookie; stores token hash in DB. |
| `POST` | `/api/auth/refresh` | Silent token renewal | Cookie | None (reads refresh cookie) | `{ accessToken }` | Rotates refresh token in DB, re-issues access token. |
| `POST` | `/api/consultations/book` | Reserve consultation | JWT (Patient) | `{ doctorId, slotId, date, symptoms }` | `{ consultation }` | ACID transaction marks `availability_slots.isBooked = true`. |
| `POST` | `/api/fever/assess` | Fever differential + SHAP | JWT | `{ symptoms: [...], red_flags: [...] }` | `{ top_ranking, shap_contributions }` | Proxies to Flask ML; intercepts red flags; computes SHAP values. |
| `POST` | `/api/ai-triage/predict`| General disease classifier | JWT | `{ symptoms: "high fever..." }` | `{ predictedDisease, confidence }` | Proxies to Flask `/predict`; vectorizes across 377 binary columns. |
| `POST` | `/api/prescriptions` | Create & finalize prescription| JWT (Doctor) | `{ consultationId, items: [...], ... }` | `{ prescription, pdfUrl }` | Validates doctor ownership; calculates medication end dates; renders PDFKit PDF. |
| `POST` | `/api/prescriptions/:id/amend`| Amend finalized prescription | JWT (Doctor) | `{ items: [...], doctorNotes, ... }` | `{ newPrescription }` | Sets original status `'amended'`; inserts new record linked via `amendedFromId`. |
| `GET` | `/api/patient-history/doctors/:docId/patients/:patId/history` | Longitudinal history | JWT (Doctor) | None | `{ consultations, medications, records }` | Enforces relationship check before returning full medical timeline. |
| `GET` | `/api/analytics/doctor`| Doctor practice analytics | JWT (Doctor) | None | `{ totalPatients, monthlyTrends, ... }` | Aggregates consultation volume and patient demographics. |

### API Deep-Dive Questions

#### Q: Explain why `POST /api/prescriptions/:id/amend` is a POST request rather than a PUT or PATCH request.
- **Answer**: "A `PUT` or `PATCH` request conventionally implies modifying an existing resource in place. However, in our architecture, finalized prescriptions are legally immutable and cannot be updated. Amending a prescription *creates a completely new resource* in the database with a new UUID and links it to the original via `amendedFromId`. Therefore, `POST` is semantically correct because it performs a creation operation."

#### Q: What status codes are returned by `/api/consultations/book` and what does each indicate?
- **Answer**:
  - `201 Created`: The consultation was booked and the slot was locked.
  - `400 Bad Request`: Validation failure (missing required fields or invalid slot format).
  - `401 Unauthorized`: Missing or expired access token.
  - `404 Not Found`: Selected doctor or slot does not exist.
  - `409 Conflict`: The requested slot was already booked by another patient.
  - `500 Internal Server Error`: Database transaction error.

---

# 8. DATABASE QUESTIONS

### Database Schema Overview
- **Database**: Neon Serverless PostgreSQL.
- **Tables (20)**: `users`, `refresh_tokens`, `patient_profiles`, `patient_addresses`, `doctor_profiles`, `doctor_availabilities`, `availability_slots`, `consultations`, `consultation_reports`, `medical_records`, `medical_record_attachments`, `prescriptions`, `prescription_items`, `chat_messages`, `ai_triage_chats`, `triage_sessions`, `triage_responses`, `triage_messages`.

### Schema Relationships
```text
users (id) ──1:1──< patient_profiles (user_id) ──1:1──< patient_addresses
users (id) ──1:1──< doctor_profiles (user_id)  ──1:M──< doctor_availabilities ──1:M──< availability_slots
users (id) ──1:M──< consultations (patient_id / doctor_id)
consultations (id) ──1:1──< prescriptions (consultation_id) ──1:M──< prescription_items
prescriptions (id) ──1:1(self)──< prescriptions (amended_from_id)
consultations (id) ──1:M──< chat_messages (consultation_id)
```

### Database Questions & Answers

#### Q: Why did you choose UUIDs instead of auto-incrementing integer IDs?
- **Answer**:
  1. **Security**: Auto-incrementing IDs (e.g. `/api/prescriptions/1042`) allow sequential ID enumeration attacks where malicious users scrape records by incrementing numbers.
  2. **Distributed Scalability**: UUIDv4 (`gen_random_uuid()`) allows generating unique identifiers across distributed microservices or client pre-allocations without requiring centralized database coordination.
  3. **Trade-off**: UUIDs occupy 16 bytes compared to 4 bytes for standard integers, causing slightly larger index sizes in B-Trees. We accepted this for data security.

#### Q: What happens when the `consultations` table grows to 10 million records?
- **Answer**:
  1. **Index Optimization**: Ensure composite B-tree indexes exist on `(patient_id, consultation_date DESC)` and `(doctor_id, consultation_date DESC)`.
  2. **Partitioning**: Implement PostgreSQL table partitioning by range on `consultation_date` (e.g. monthly partitions), allowing partition pruning during queries.
  3. **Cold Data Archival**: Move completed consultations older than 2 years to an archival cold storage table.
  4. **Connection Pooling**: Neon serverless connection pooling prevents exhaustion of database connections under high concurrency.

---

# 9. ALGORITHM & DSA QUESTIONS

### 1. Dynamic Doctor Matching Utility Algorithm
- **Problem**: Fairly and safely match urgent patients with available specialist doctors without manual human dispatcher bottlenecks.
- **Algorithm**: Multi-Criteria Utility Weighted Ranking.
- **Time Complexity**: $O(K + N \log N)$, where $K$ is candidate search and $N$ is sorting available doctors. Since $N \le 100$ per specialty, runtime is $<5$ milliseconds.
- **Space Complexity**: $O(N)$ to hold priority candidate objects.
- **Alternative**: Pure FIFO queue. Rejected because critical patients wait behind routine checkups.

### 2. Binary Symptom Vocabulary Vectorization
- **Problem**: Convert free-text symptom strings into a 377-dimensional binary feature vector for Scikit-learn inference.
- **Algorithm**: Substring matching over pre-compiled vocabulary list.
- **Time Complexity**: $O(V \cdot L)$, where $V = 377$ vocabulary terms and $L$ is user input string length.
- **Space Complexity**: $O(V)$ for the one-hot binary DataFrame row.
- **Alternative**: TF-IDF or Word2Vec embeddings. ExtraTrees model was specifically trained on discrete binary symptom indicators (0/1), making direct vectorization necessary.

### 3. Asynchronous ICE Candidate Buffer Queue
- **Problem**: Asynchronous race condition where WebRTC network packets arrive before the peer connection state machine has set the remote SDP description.
- **Algorithm**: Queue data structure (FIFO Buffer).
- **Time Complexity**: $O(1)$ amortized push; $O(M)$ flush where $M$ is candidate count.
- **Space Complexity**: $O(M)$ where $M \approx 5-20$ candidates.

---

# 10. AI / MACHINE LEARNING QUESTIONS

### General Disease Model Specs
- **Model Type**: `ExtraTreesClassifier` (Extremely Randomized Trees).
- **Dataset**: `Final_Augmented_dataset_Diseases_and_Symptoms.csv` (41 disease categories, 377 symptoms).
- **Hyperparameters**: `n_estimators=100`, `max_depth=20`, `min_samples_leaf=4`, `class_weight='balanced'`.
- **Inference Time**: ~15ms on CPU.

### Fever Differential Model Specs
- **Model Type**: `XGBoostClassifier` / `RandomForestClassifier`.
- **Dataset**: 1,500 curated WHO fever symptom profiles (`fever_model/data/`).
- **Features (25)**: `fever`, `high_fever`, `sudden_onset`, `headache`, `severe_headache`, `chills`, `sweating`, `body_pain`, `muscle_pain`, `joint_pain`, `severe_joint_pain`, `pain_behind_eyes`, `rash`, `nausea`, `vomiting`, `abdominal_pain`, `diarrhea`, `constipation`, `cough`, `sore_throat`, `runny_nose`, `fatigue`, `weakness`, `swollen_lymph_nodes`, `loss_of_appetite`.
- **Target Classes (5)**: `Dengue`, `Malaria`, `Typhoid`, `Chikungunya`, `Viral_Fever`.
- **Explainability**: `shap.TreeExplainer` computing feature Shapley contributions.

### Interview Q&A

#### Q: Why use ExtraTrees instead of Random Forest for the general disease classifier?
- **Answer**: "ExtraTrees (Extremely Randomized Trees) randomizes both the feature subset *and* the cut-point thresholds for each feature split, rather than calculating the optimal mathematical split threshold like Random Forest. For high-dimensional, sparse binary data (377 symptom columns where most entries are 0), this reduces variance, mitigates overfitting on rare symptoms, and significantly accelerates training time."

#### Q: What happens if a patient submits symptoms unrelated to any disease in the dataset?
- **Answer**: "The model calculates probabilities across all classes using `predict_proba`. If no symptoms match, probability distributes uniformly across all 41 classes (each ~2.4%). The server detects low maximum confidence ($<30\%$) and maps urgency to 'low' while advising general physician consultation. In the fever model, empty inputs return early with baseline guidance."

---

# 11. AI / LLM / RAG QUESTIONS

### Implementation Details
- **Model**: `meta-llama/Llama-3.1-8B-Instruct` accessed via the HuggingFace Router API.
- **Controller/Service**: `server/src/controllers/chatController.js`, `server/src/services/chat.service.js`.
- **Session Continuity**: Linked to `triage_sessions` and `triage_messages` in PostgreSQL.

### Interview Q&A

#### Q: How do you prevent the LLM from hallucinating medical advice or prescribing dangerous medications?
- **Answer**:
  "We employ strict system prompt engineering:
  1. **Clinical Persona**: Instructs the model that it is an informational pre-triage assistant, not a licensed medical practitioner.
  2. **Prescription Prohibition**: System prompt explicitly forbids generating specific drug dosages or recommending scheduled pharmaceuticals.
  3. **Mandatory Disclaimers**: Every response includes an automated disclaimer advising consultation with registered physicians.
  4. **Emergency Escalation**: Instructs the bot to detect emergency keywords and instruct the patient to dial emergency services."

#### Q: What happens if the external HuggingFace API times out or exceeds rate limits?
- **Answer**: "Our Axios client in `chat.service.js` wraps the request in a try-catch block with a 10-second timeout. If the HuggingFace router returns 429 (rate limited) or 504 (timeout), the service catches the error and returns a fallback clinical response: *'Our AI assistant is temporarily busy. Based on your symptoms, we recommend booking a direct video consultation with a General Physician.'*"

---

# 12. SECURITY QUESTIONS

### Security Audit Findings

| Dimension | Current Implementation | Potential Risk / Vulnerability | Hardening / Improvement |
|:---|:---|:---|:---|
| **Authentication** | Dual-token (15m JWT + 7d refresh token in DB). | Access tokens stored in client memory/local storage. | Store access tokens strictly in memory closure; use Web Workers. |
| **Cookie Security** | `httpOnly`, `Secure`, `SameSite=None`. | None (standard hardened practice). | Maintain HTTPS-only production deployment. |
| **Password Storage**| `bcryptjs` with 10 salt rounds. | Work factor 10 may become slow under high signup spikes. | Adequate for current load; argon2id can be evaluated. |
| **Authorization** | `authMiddleware.js` verifies roles and active status. | DB query on every request adds 5-15ms latency. | Cache user active status in Redis with 60s TTL. |
| **Record Access** | Doctor can only view records if a consultation exists. | If a consultation is cancelled, does doctor access persist? | Restrict historical view to completed/confirmed consultations. |
| **SQL Injection** | Drizzle ORM parameterized queries. | Minimal risk (ORM parameterizes all inputs). | Avoid raw SQL template interpolation (`sql.raw()`). |
| **Input Validation**| Joi schemas / Custom controllers. | Incomplete validation on nested prescription item lines. | Enforce strict Zod/Joi validation schemas on all inputs. |
| **CORS** | Strict origin check in `app.js`. | Localhost regex allows any localhost port in dev. | Limit dev origins to explicitly configured ports in `.env`. |

---

# 13. PERFORMANCE & SCALABILITY

### Scalability Analysis

#### 1. What is the current backend bottleneck?
- **Answer**: "The most significant bottleneck is `authMiddleware.js`. On *every single authenticated HTTP request*, it executes an SQL query to Neon PostgreSQL: `SELECT id, name, email, role, isActive FROM users WHERE id = userId`. At 10,000 requests per second, this creates 10,000 database read queries purely for token validation.
  **Fix**: Introduce a Redis caching layer with a 60-second TTL for user session status, or trust the signed JWT payload for 15 minutes and rely on a Redis blacklist only for revoked tokens."

#### 2. What happens when 1,000 concurrent video calls are active?
- **Answer**: "Because our WebRTC architecture is peer-to-peer (P2P), media streams flow directly between patient and doctor browsers without passing through our Node.js server. The server only handles lightweight signaling messages (SDP and ICE candidates). However, a single Node.js Socket.IO instance can hold ~10,000 concurrent WebSocket connections. If memory exceeds limits, we would scale Socket.IO horizontally using the `@socket.io/redis-adapter` to distribute signaling across multiple Node instances."

#### 3. Where would Redis caching help most?
- **Answer**:
  1. Doctor directory and slot availability queries (`/api/consultations/doctors/available`).
  2. User authentication and role caching.
  3. Real-time in-memory WebRTC room participant tracking.

---

# 14. DEPLOYMENT QUESTIONS

### Deployment Topology
- **Frontend Client**: Deployed on **Vercel** (`https://e-sanjeevani-2-0.vercel.app`).
  - Rewrites in `vercel.json` route all SPA paths (`/*`) to `/index.html`.
- **Backend API & WebSockets**: Deployed on **Render** (`https://e-sanjeevani-2-0.onrender.com`).
  - Environment variable `PORT` automatically injected by Render.
- **Python ML Microservice**: Deployed as an independent service on **Render** (Port 8000).
- **Database**: Cloud-hosted **Neon Serverless PostgreSQL**.

### Interview Questions

#### Q: How does CORS work when the frontend is on Vercel and the backend is on Render?
- **Answer**: "Browsers block cross-origin requests by default under the Same-Origin Policy. In `server/src/app.js`, Express uses the `cors` package configured with `origin: (origin, callback) => ...` and `credentials: true`. It validates the incoming `Origin` header against `https://e-sanjeevani-2-0.vercel.app`. The server returns `Access-Control-Allow-Origin: https://e-sanjeevani-2-0.vercel.app` and `Access-Control-Allow-Credentials: true`, allowing the browser to send and receive HTTP-only cookies across domains."

#### Q: What happens when Render's free tier spins down the Python service?
- **Answer**: "Render free tier spins down web services after 15 minutes of inactivity. When a patient submits symptoms, the first request experiences a ~50-second cold start. In `aiTriageClient.js`, we configure an HTTP timeout. If the request times out, the backend gracefully catches the error and advises the patient to book a direct consultation, preventing app crashes."

---

# 15. BUGS & PROBLEMS I MAY BE ASKED ABOUT

### Realistic Identified Problems & Bug Fixes

#### 1. The Strict String Match Bug in Consultation Reminders
- **Problem**: In `consultationReminderJob.js`, the query used `eq(consultations.startTime, currentTime)` where `currentTime` was computed as `HH:mm`.
- **Why it happens**: If the server restarted, experienced GC pauses, or lagged during that exact 60-second window, the job missed the minute, causing reminders to never be dispatched.
- **How to fix it**: Query a 15-minute sliding window with `lte(consultations.startTime, windowEnd)` and track status with a boolean flag.

#### 2. Scope Error in `feverRoutes.js`
- **Problem**: In `server/src/routes/feverRoutes.js`, `triageSessionId` was referenced when logging triage responses without being properly destructured from `req.body`.
- **Why it happened**: Legacy parameter renaming during the route refactor.
- **How it was fixed**: Destructured `triageSessionId` safely with default fallback: `const { triageSessionId = null } = req.body`.

#### 3. WebRTC ICE Candidate Drop on Fast Network Handshakes
- **Problem**: Peer connections failed intermittently during testing when caller and callee joined simultaneously.
- **Why it happened**: ICE candidates arrived before `setRemoteDescription` was completed by the browser.
- **How it was fixed**: Created `iceCandidateQueueRef` in `VideoCall.jsx` to buffer candidates and flush them immediately after remote description resolution.

---

# 16. DESIGN DECISION QUESTIONS ("WHY" Questions)

### Q1: Why PostgreSQL with Drizzle ORM instead of MongoDB with Mongoose?
- **Documented Reason**: Phase 1 used MongoDB, but clinical notes and scheduling suffered from schema drift and orphaned data.
- **Technical Rationale**: Telemedicine is fundamentally relational: consultations link patients and doctors; prescriptions link consultations and items; slots link to availabilities. PostgreSQL enforces foreign key constraints, atomic transactions (`db.transaction`), and ACID compliance. Drizzle ORM provides full TypeScript/JavaScript type safety with zero runtime overhead compared to Mongoose.
- **Trade-off**: Relational migrations (`drizzle-kit push`) require disciplined schema planning compared to MongoDB's schema-less flexibility.

### Q2: Why a dedicated Python Flask microservice instead of running ML in Node.js?
- **Technical Rationale**: Scikit-learn, XGBoost, and SHAP are mature, highly optimized Python C-extensions. Running these in Node via child processes or porting to TensorFlow.js would lose access to `shap.TreeExplainer` game-theoretic explainability.
- **Trade-off**: Requires managing two separate server deployments and handling inter-service network latency (~10-20ms per internal HTTP call).

### Q3: Why peer-to-peer WebRTC instead of a media server (SFU like Mediasoup/LiveKit)?
- **Technical Rationale**: 1-on-1 telemedicine consultations are exclusively 2-party calls (1 doctor + 1 patient). P2P WebRTC requires zero media server bandwidth, eliminates media server hosting costs, and provides end-to-end encryption.
- **Trade-off**: P2P does not scale to multi-party conferences (e.g. 5 family members joining a call) and lacks built-in server-side call recording.

---

# 17. HR + TECHNICAL HR QUESTIONS

### 1. "Tell me about your project."
> "I built E-Sanjeevani 2.0, a full-stack telemedicine and clinical AI platform. It tackles two major problems in digital healthcare: first, long, unorganized queues where critical patients wait behind routine cases; and second, the ambiguity of tropical fevers like Dengue and Malaria. I built the frontend with React 19, the backend with Express 5 and Neon PostgreSQL using Drizzle ORM, and integrated an explainable Python ML microservice using XGBoost and SHAP. It features real-time WebRTC video calls and automated, legally immutable digital prescriptions."

### 2. "What was the most challenging technical part of this project?"
> "The most challenging part was stabilizing the WebRTC video calling pipeline across different network conditions. Initially, calls frequently dropped or showed black screens because ICE candidates arrived before the remote SDP description was processed. I had to research WebRTC connection state machines and implement an ICE candidate queue buffer. Additionally, handling audio-only mode cleanly required dynamically toggling media stream tracks without tearing down the peer connection."

### 3. "What did you learn from building this project?"
> "I learned that in healthcare software, clinical safety and explainability matter more than raw algorithmic complexity. A 95% accurate model is useless to a doctor if it cannot explain *why* it made a prediction. Integrating SHAP feature attributions taught me how to bridge the gap between machine learning math and practical user trust."

### 4. "What would you do differently if you had more time?"
> "I would replace our keyword-based symptom parser with a fine-tuned BioBERT clinical transformer to extract symptoms from natural doctor-patient dialogue. I would also implement WebRTC screen sharing for reviewing uploaded X-ray and CT scans during active calls."

---

# 18. RAPID-FIRE QUESTIONS (Last-Minute Revision)

1. **Q: What is the primary database?**  
   **A:** Neon Serverless PostgreSQL.
2. **Q: What ORM is used?**  
   **A:** Drizzle ORM (`drizzle-orm`).
3. **Q: What frontend framework is used?**  
   **A:** React 19 with Vite 8.
4. **Q: What backend framework is used?**  
   **A:** Node.js with Express 5.
5. **Q: How are passwords hashed?**  
   **A:** `bcryptjs` with 10 salt rounds.
6. **Q: How long does an access token last?**  
   **A:** 15 minutes.
7. **Q: How long does a refresh token last?**  
   **A:** 7 days.
8. **Q: Where is the refresh token stored on the client?**  
   **A:** In an `httpOnly`, `Secure` cookie.
9. **Q: What ML model predicts general diseases?**  
   **A:** `ExtraTreesClassifier` (100 estimators, max depth 20).
10. **Q: How many symptom columns are in the general disease model?**  
    **A:** 377 binary columns.
11. **Q: How many disease classes are in the general model?**  
    **A:** 41+ classes.
12. **Q: What model predicts tropical fevers?**  
    **A:** `XGBoostClassifier` / `RandomForestClassifier`.
13. **Q: How many features does the fever model take?**  
    **A:** 25 binary features.
14. **Q: What are the 5 febrile diseases predicted?**  
    **A:** Dengue, Malaria, Typhoid, Chikungunya, Viral Fever.
15. **Q: What library generates explainable AI charts?**  
    **A:** `shap` (SHAP TreeExplainer) rendered with Recharts.
16. **Q: What is the doctor matching formula?**  
    **A:** $0.40 \cdot \text{Urgency} + 0.25 \cdot \text{Specialty} + 0.20 \cdot \text{Availability} + 0.10 \cdot \text{Language} + 0.05 \cdot \text{Experience}$.
17. **Q: What protocol handles real-time video?**  
    **A:** WebRTC (Peer-to-Peer).
18. **Q: What library handles WebRTC signaling?**  
    **A:** Socket.IO v4.
19. **Q: What library generates prescription PDFs?**  
    **A:** `pdfkit`.
20. **Q: What cron library sends appointment reminders?**  
    **A:** `node-cron` running every minute.
21. **Q: What mail service sends reminder emails?**  
    **A:** Nodemailer using Gmail SMTP.
22. **Q: What LLM powers the conversational triage chatbot?**  
    **A:** `Llama-3.1-8B-Instruct` via HuggingFace Router.
23. **Q: What happens when an issued prescription is amended?**  
    **A:** Original is marked `'amended'`, and a new record links to it via `amendedFromId`.
24. **Q: What port does the Python AI server run on?**  
    **A:** Port 8000.
25. **Q: What port does the Express backend run on?**  
    **A:** Port 5000 (`process.env.PORT`).
26. **Q: How are red flags handled in fever triage?**  
    **A:** Bypasses ML, returns `red_flag_alert: true`, opens emergency modal.
27. **Q: How is audio-only mode implemented?**  
    **A:** Requests `{ video: false, audio: true }` and displays initials avatar tile.
28. **Q: What is the primary key type across database tables?**  
    **A:** UUIDv4 (`gen_random_uuid()`).
29. **Q: What tool manages SQL migrations?**  
    **A:** Drizzle Kit (`drizzle-kit push`).
30. **Q: How are concurrent 401 refresh calls prevented?**  
    **A:** Using an `isRefreshing` boolean flag and a Promise queue (`failedQueue`).
31. **Q: Where is the frontend hosted?**  
    **A:** Vercel.
32. **Q: Where is the backend hosted?**  
    **A:** Render.
33. **Q: What public STUN servers are configured?**  
    **A:** Google STUN (`stun.l.google.com:19302`).
34. **Q: What is the range of the clinical urgency score?**  
    **A:** 1.0 to 10.0 (clamped).
35. **Q: What score is considered 'critical' urgency?**  
    **A:** $\ge 8.0$.
36. **Q: How are medication end dates computed?**  
    **A:** `startDate + duration_in_days`.
37. **Q: Can doctors view any patient's records?**  
    **A:** No, only patients who have an active or past consultation with them.
38. **Q: What is the purpose of `iceCandidateQueueRef`?**  
    **A:** Buffers ICE candidates arriving before `setRemoteDescription` resolves.
39. **Q: What file sets up CORS?**  
    **A:** `server/src/app.js`.
40. **Q: What file contains the doctor matching algorithm?**  
    **A:** `server/src/helpers/doctorMatching.js`.
41. **Q: What file contains urgency scoring?**  
    **A:** `server/src/helpers/urgencyScoring.js`.
42. **Q: What file serves ML predictions?**  
    **A:** `ai-model/app.py`.
43. **Q: What file renders the video call room?**  
    **A:** `client/src/pages/VideoCall/VideoCall.jsx`.
44. **Q: What icon library is used?**  
    **A:** `lucide-react`.
45. **Q: What notification library is used?**  
    **A:** `react-hot-toast` + HTML5 Audio.
46. **Q: What is the hallmark symptom of Dengue in the model?**  
    **A:** Retro-orbital pain (pain behind the eyes).
47. **Q: What is the hallmark symptom of Chikungunya?**  
    **A:** Severe / debilitating joint pain.
48. **Q: What is the hallmark symptom of Malaria?**  
    **A:** Chills and profuse sweating.
49. **Q: Does the system replace doctors?**  
    **A:** No, it operates on a human-in-the-loop decision support philosophy.
50. **Q: Is BioBERT transformer currently active in code?**  
    **A:** No, it is documented as a concept/roadmap item; current triage uses vocabulary matching.

---

# 19. TRICK / CROSS-QUESTIONING DRILL CHAINS

### Chain 1: Database Architecture
- **Interviewer**: Why did you use PostgreSQL instead of MongoDB?
- **Candidate**: Because telemedicine data is inherently relational—consultations, prescriptions, slots, and profiles must maintain strict referential integrity and ACID guarantees.
- **Interviewer**: Can't MongoDB handle transactions and relationships with `$lookup` and sessions?
- **Candidate**: MongoDB does support multi-document transactions, but it incurs high latency overhead because the engine wasn't architected for relational joins. In Phase 1 of this project, using MongoDB led to orphaned consultation records and inconsistent prescription notes.
- **Interviewer**: Then why did you use Drizzle ORM instead of Prisma?
- **Candidate**: Prisma uses an underlying Rust binary engine that increases cold start latency on serverless platforms and generates heavy query abstractions. Drizzle ORM is lightweight, generates transparent SQL, has zero runtime overhead, and connects natively to Neon PostgreSQL.

### Chain 2: Machine Learning & Explainability
- **Interviewer**: You used SHAP for explainability. Why not LIME?
- **Candidate**: LIME builds local surrogate linear models by perturbing input samples, which introduces sampling variance and instability—different runs can give different explanations for the exact same patient. SHAP calculates exact Shapley values with mathematical axioms (efficiency, symmetry, additivity), guaranteeing consistent feature attribution.
- **Interviewer**: Isn't SHAP computationally expensive? How can you run it during a live API call?
- **Candidate**: General Kernel SHAP is exponential ($O(2^{|F|})$), but for tree-based models like Random Forest and XGBoost, we use `shap.TreeExplainer`, which optimizes feature attribution calculation to polynomial time ($O(T \cdot L \cdot D^2)$). For 25 binary features, inference executes in under 25 milliseconds.

### Chain 3: WebRTC Video Call Engineering
- **Interviewer**: What happens if the doctor's internet flickers for 5 seconds during a WebRTC call?
- **Candidate**: WebRTC handles minor packet loss via ICE restarts and RTCP feedback packets. If the connection fails completely, the peer connection state transitions to `'disconnected'`. The socket stays active and allows the client to initiate a renegotiation handshake without reloading the webpage.
- **Interviewer**: Why not route the video through an SFU media server?
- **Candidate**: For a 1-to-1 doctor-patient consultation, an SFU adds unnecessary server bandwidth costs ($0.15/GB) and introduces a potential security point of failure. Peer-to-peer WebRTC provides direct end-to-end media encryption and near-zero server infrastructure cost.

---

# 20. "IF INTERVIEWER OPENS MY GITHUB" SECTION

If an interviewer inspects your GitHub repository (`aayush45123/E-sanjeevani-2.0`), here is exactly what they will see and what they will ask:

### 1. Root Directory Structure
- **Observation**: They will notice `client/`, `server/`, `ai-model/`, and `project_context.md`.
- **Question**: *"Why do you have two separate backends (`server` and `ai-model`) instead of running everything in Python or Node?"*
- **Answer**: *"We adopted a decoupled polyglot microservice pattern. Node.js is optimized for asynchronous I/O, WebSockets, and database persistence, while Python is the standard for machine learning, Scikit-learn, and SHAP. Decoupling them allows scaling the ML inference microservice independently from the real-time API gateway."*

### 2. `server/package.json`
- **Observation**: They will see `"drizzle-orm"`, `"express": "^5.2.1"`, `"socket.io"`, `"pdfkit"`, and `"mongoose": "^9.3.1"`.
- **Question**: *"Why is `mongoose` still listed in your dependencies if you migrated to PostgreSQL?"*
- **Answer**: *"That is a remnant dependency from Phase 1 of our development before we migrated to Drizzle ORM and Neon PostgreSQL. All active repositories and schemas in `server/src/database/schema/` use Drizzle ORM. Removing unused legacy dependencies is part of our upcoming dependency cleanup."*

### 3. `ai-model/models/` Directory
- **Observation**: They will see serialized `.pkl` files: `disease_model.pkl`, `fever_model.pkl`, `symptom_columns.pkl`.
- **Question**: *"Why did you commit `.pkl` files to Git instead of downloading them from an S3 bucket or model registry?"*
- **Answer**: *"For prototype and demo deployment simplicity on Render, keeping compact compressed model artifacts (<15MB total) directly in the repo enables zero-downtime container builds without requiring an external AWS S3 bucket or MLflow server."*

### 4. `server/src/server.js` (Legacy Comment Check)
- **Observation**: Line 29 has a comment: `// Keep enabled because current reminder job still uses MongoDB`.
- **Question**: *"Wait, does your reminder job use MongoDB or PostgreSQL?"*
- **Answer**: *"That is an outdated comment from our Phase 1 migration. If you inspect `server/src/cron/consultationReminderJob.js`, you'll see it directly imports `db` from `../config/neonDb.js` and queries Drizzle ORM PostgreSQL tables (`consultations` and `users`) using SQL joins."*

---

# 21. "EXPLAIN THIS FILE" SECTION (20 Core Files)

### 1. `server/src/helpers/doctorMatching.js`
- **Purpose**: Implements the 5-factor weighted priority doctor matching algorithm.
- **Key Functions**: `calculateDoctorPriority()`, `matchDoctorBySpecialty()`, `createAutoMatchedConsultation()`.
- **Dependencies**: `DoctorProfileRepository`, `AvailabilityRepository`, `TriageRepository`, `ConsultationRepository`.

### 2. `server/src/helpers/urgencyScoring.js`
- **Purpose**: Deterministically computes patient urgency score (1.0 to 10.0) from symptoms, duration, and age.
- **Key Functions**: `calculateUrgencyScore()`, `getUrgencyLevel()`, `getRecommendedSpecialties()`.
- **Dependencies**: None (pure algorithmic utility).

### 3. `server/src/services/prescriptionLifecycle.service.js`
- **Purpose**: Manages the complete lifecycle of prescriptions (draft, finalize, amend, discontinue).
- **Key Functions**: `issuePrescription()`, `finalizePrescription()`, `amendPrescription()`, `discontinueMedication()`.
- **Dependencies**: `PrescriptionRepository`, `PrescriptionPdfService`, `ConsultationRepository`.

### 4. `server/src/services/prescriptionPdfService.js`
- **Purpose**: Programmatically renders vector PDF medical prescriptions using PDFKit.
- **Key Functions**: `generatePrescriptionPdf()`.
- **Dependencies**: `pdfkit`, `fs`, `path`.

### 5. `server/src/socket/socketServer.js`
- **Purpose**: WebRTC signaling hub managing room entry, SDP offer/answer exchange, ICE candidates, and text chat.
- **Key Functions**: `initializeSocket()`, event handlers (`join-room`, `send-offer`, `send-answer`, `send-ice-candidate`).
- **Dependencies**: `socket.io`.

### 6. `ai-model/app.py`
- **Purpose**: Unified Flask microservice hosting general disease classification, fever differential assessment, and SHAP.
- **Key Functions**: `predict()`, `predict_fever()`, `check_red_flags()`, `get_shap_explanation()`.
- **Dependencies**: `flask`, `scikit-learn`, `xgboost`, `shap`, `joblib`, `pandas`.

### 7. `client/src/pages/VideoCall/VideoCall.jsx`
- **Purpose**: Master WebRTC consultation workspace for doctors and patients with split-pane clinical copilot.
- **Key Functions**: `initializePeerConnection()`, `handleOffer()`, `handleAnswer()`, `flushIceCandidates()`.
- **Dependencies**: `socket.io-client`, `lucide-react`, React hooks.

### 8. `client/src/utils/api.js`
- **Purpose**: Centralized Axios client with request and response interceptors managing silent 401 token refresh queue.
- **Key Functions**: `apiClient.interceptors.response.use()`, `processQueue()`.
- **Dependencies**: `axios`.

### 9. `server/src/middlewares/authMiddleware.js`
- **Purpose**: JWT verification middleware with database fallback check for user active status and roles.
- **Key Functions**: `authMiddleware`.
- **Dependencies**: `jsonwebtoken`, `drizzle-orm`, Neon DB config.

### 10. `server/src/cron/consultationReminderJob.js`
- **Purpose**: Background daemon running every minute to email upcoming consultation reminders.
- **Key Functions**: `initializeConsultationReminders()`.
- **Dependencies**: `node-cron`, `drizzle-orm`, `sendAppointmentEmail.js`.

### 11. `client/src/components/AiTriage/AiTriage.jsx`
- **Purpose**: Interactive symptom checker UI with 25 WHO fever categories, presets, and differential results.
- **Key Functions**: `handleAssess()`, `handleReset()`.
- **Dependencies**: `ShapContributionChart`, `RedFlagEmergencyModal`, `apiClient`.

### 12. `client/src/components/AiTriage/ShapContributionChart.jsx`
- **Purpose**: Visualizes SHAP feature attribution scores as color-coded horizontal bars.
- **Key Functions**: `ShapContributionChart`.
- **Dependencies**: `recharts` (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`).

### 13. `server/src/database/schema/prescriptions.js`
- **Purpose**: Drizzle PostgreSQL schema definition for the immutable `prescriptions` header entity.
- **Key Columns**: `id`, `consultationId`, `patientId`, `doctorId`, `status`, `amendedFromId`, `pdfUrl`.
- **Dependencies**: `drizzle-orm/pg-core`.

### 14. `server/src/database/schema/prescriptionItems.js`
- **Purpose**: Drizzle PostgreSQL schema for individual medication line items.
- **Key Columns**: `id`, `prescriptionId`, `medicineName`, `dosage`, `frequency`, `startDate`, `endDate`, `status`.
- **Dependencies**: `drizzle-orm/pg-core`.

### 15. `server/src/database/schema/consultations.js`
- **Purpose**: Schema defining telemedicine consultation appointments.
- **Key Columns**: `id`, `patientId`, `doctorId`, `consultationDate`, `startTime`, `status`, `urgencyScore`.
- **Dependencies**: `drizzle-orm/pg-core`.

### 16. `server/src/database/schema/doctorProfiles.js`
- **Purpose**: Schema defining doctor professional credentials, specializations, and verification status.
- **Key Columns**: `id`, `userId`, `specialization`, `experience`, `medicalRegistrationNumber`, `isVerified`.
- **Dependencies**: `drizzle-orm/pg-core`.

### 17. `server/src/routes/feverRoutes.js`
- **Purpose**: Express route proxying fever assessment requests to Python Flask with validation and logging.
- **Dependencies**: `express`, `axios`.

### 18. `server/src/controllers/doctorAssistantController.js`
- **Purpose**: In-call copilot API fetching patient medical history, triage score, and previous diagnoses for the doctor.
- **Dependencies**: `consultations`, `patient_profiles`, `ai_triage_chats`.

### 19. `client/src/pages/ClinicalRecords/ClinicalRecords.jsx`
- **Purpose**: Patient and doctor portal for viewing digital prescriptions, amendment chains, and lab uploads.
- **Dependencies**: `AmendPrescriptionModal`, `apiClient`.

### 20. `server/src/config/neonDb.js`
- **Purpose**: Database configuration initializing Neon serverless connection pool and Drizzle ORM client.
- **Key Functions**: `checkPostgresConnection()`.
- **Dependencies**: `@neondatabase/serverless`, `drizzle-orm/neon-serverless`.

---

# 22. PROJECT DEFENSE (Defending Your Architectural Choices)

### 1. "Isn't there already Practo, Apollo 24/7, or Government eSanjeevani? Why is this necessary?"
> "Commercial portals like Practo focus on directory monetization and ad-based physician listings. Government eSanjeevani operates on a strict first-come-first-serve queue with free-text prescription notes. None of these platforms integrate **Explainable AI** or **dynamic clinical urgency matching**. In tropical areas where Dengue and Malaria create severe outpatient surges, our platform provides explainable clinical triage, automatic red-flag diversion, and structured prescription tracking that existing platforms lack."

### 2. "What are the limitations of your machine learning models?"
> "The primary limitation is that our models are based on reported symptoms, not laboratory serology. Diseases like Dengue and Chikungunya cannot be definitively diagnosed without an NS1 antigen test or PCR. That is why our UI and API enforce medical disclaimers and explicitly treat outputs as *differential decision-support* rather than final diagnoses."

### 3. "What would break first if traffic spiked to 100,000 active users?"
> "The first component to degrade would be the Python Flask microservice if deployed on a single CPU instance, because computing SHAP TreeExplainer values under high concurrency would saturate CPU threads. To fix this, we would scale Flask horizontally behind an NGINX load balancer or AWS ECS container cluster with pre-warmed workers."

---

# 23. TOP 30 MOST IMPORTANT QUESTIONS (Essential Exam & Interview Pack)

### Project Fundamentals
1. **Q: What is the core problem E-Sanjeevani 2.0 solves?**  
   *A: Inefficient FIFO telemedicine queues, clinical ambiguity in overlapping tropical fevers, and unstructured, fragile medical prescriptions.*
2. **Q: Who are the target users?**  
   *A: Patients seeking triage and care, and licensed physicians managing schedules and consultations.*
3. **Q: How does this project differ from legacy eSanjeevani?**  
   *A: Legacy uses FIFO queues and free-text notes; 2.0 uses 5-factor urgency matching, explainable SHAP ML triage, and immutable structured prescriptions.*

### Architecture
4. **Q: Describe the overall architecture.**  
   *A: 4-tier system: React 19 SPA, Express 5 API Gateway, Neon PostgreSQL persistence, and Python Flask ML microservice.*
5. **Q: Why separate the Python ML microservice from Node.js?**  
   *A: To leverage Scikit-learn, XGBoost, and SHAP libraries without compromising Node's event loop.*
6. **Q: How is real-time media handled?**  
   *A: Peer-to-peer WebRTC audio/video with Socket.IO managing SDP and ICE signaling.*

### Code & Engineering
7. **Q: How do you handle simultaneous 401 errors on the client?**  
   *A: Axios response interceptor buffers requests in a Promise queue (`failedQueue`) while a single `/auth/refresh` executes.*
8. **Q: How is ICE candidate race condition solved in WebRTC?**  
   *A: `iceCandidateQueueRef` buffers candidates arriving before `setRemoteDescription` resolves.*
9. **Q: Why does `authMiddleware.js` query PostgreSQL?**  
   *A: To immediately invalidate deactivated users or changed roles rather than waiting for 15-minute JWT expiration.*

### Database
10. **Q: Why choose PostgreSQL over MongoDB?**  
    *A: Relational integrity, foreign key cascades, and ACID transactions for financial and clinical records.*
11. **Q: Why choose Drizzle ORM over Prisma?**  
    *A: Zero runtime overhead, faster startup times, and direct SQL-like query builder.*
12. **Q: How are prescription revisions modeled?**  
    *A: Self-referencing foreign key `amendedFromId` creating an immutable revision linked list.*

### AI & Machine Learning
13. **Q: How many features does the General Disease classifier take?**  
    *A: 377 binary symptom columns predicting 41+ classes via `ExtraTreesClassifier`.*
14. **Q: What is the role of SHAP in fever differential diagnosis?**  
    *A: Computes Shapley values showing which symptoms pushed probability toward or away from a diagnosis.*
15. **Q: How does the Red-Flag Emergency detector work?**  
    *A: Evaluates life-threatening symptoms (bleeding, dyspnea) and intercepts the user with an emergency modal before ML inference.*

### Security
16. **Q: How are refresh tokens stored securely?**  
    *A: Hashed in PostgreSQL database and delivered via `httpOnly`, `Secure`, `SameSite` cookies.*
17. **Q: How is doctor access to patient history secured?**  
    *A: Enforces an authorization check verifying an existing consultation links the doctor and patient.*
18. **Q: How is SQL injection prevented?**  
    *A: Drizzle ORM uses parameterized queries for all operations.*

### Deployment & Scalability
19. **Q: Where is the frontend and backend deployed?**  
    *A: Frontend on Vercel; Backend and Python microservice on Render; Database on Neon Cloud.*
20. **Q: How is CORS configured across origins?**  
    *A: Dynamic origin check in Express with `credentials: true` matching Vercel domains.*
21. **Q: What is the primary bottleneck at scale?**  
    *A: Database lookup in `authMiddleware.js` on every request; remediated with Redis caching.*

### Challenges & Defenses
22. **Q: Tell me about a difficult bug you solved.**  
    *A: WebRTC ICE candidate race conditions causing dropped calls, resolved with queue buffering.*
23. **Q: What is the defect in the reminder cron job?**  
    *A: Strict equality `startTime == currentTime` misses reminders if the server lags during that exact minute.*
24. **Q: Why are prescriptions immutable?**  
    *A: Legal compliance and medical auditability—modifying issued prescriptions in-place is illegal.*
25. **Q: How does audio-only consultation mode work?**  
    *A: Passes `{ video: false, audio: true }` to `getUserMedia`, syncs via sockets, and renders initials avatars.*
26. **Q: How are medication end dates computed?**  
    *A: `startDate + duration_in_days`, allowing deterministic active/completed status queries.*
27. **Q: What algorithm is used for doctor matching?**  
    *A: 5-Factor Multi-Criteria Utility Ranking ($40\%$ Urgency, $25\%$ Specialty, $20\%$ Availability, $10\%$ Language, $5\%$ Experience).*
28. **Q: What is the time complexity of the doctor matching algorithm?**  
    *A: $O(N \log N)$ where $N$ is candidate doctors matching the target specialty.*
29. **Q: What does the LLM assistant do?**  
    *A: Provides conversational pre-triage guidance using `Llama-3.1-8B-Instruct` via HuggingFace Router.*
30. **Q: What would you improve in the next version?**  
    *A: Train an on-premise BioBERT transformer for automatic symptom extraction from free-text notes.*

---

# 24. FINAL CHEAT SHEET & QUICK REVISION

| Aspect | Specification |
|:---|:---|
| **Project** | E-Sanjeevani 2.0 (AI Telemedicine & Triage Platform) |
| **Problem** | FIFO queue delays, tropical fever diagnostic confusion, lost prescription histories |
| **Solution** | 5-Factor doctor matching, explainable SHAP differential ML, immutable digital prescriptions |
| **Users** | Patients, Doctors, Healthcare Administrators |
| **Tech Stack** | React 19, Express 5, Neon PostgreSQL, Drizzle ORM, Python Flask, XGBoost, SHAP, Socket.IO |
| **Architecture** | 4-Tier Polyglot Microservice (Client, Node Gateway, Python AI, PostgreSQL) |
| **Database** | 20 normalized PostgreSQL schemas with UUIDv4 primary keys and foreign key cascades |
| **Authentication**| Dual-Token: 15-min JWT + 7-day DB-persisted refresh token in HTTP-only cookie |
| **Important APIs** | `POST /api/fever/assess`, `POST /api/consultations/book`, `POST /api/prescriptions` |
| **Algorithms** | 5-Factor Utility Matching, 10-Point Urgency Heuristic, SHAP TreeExplainer, ICE Queue |
| **Machine Learning**| ExtraTrees (377 features, 41 classes) + XGBoost Fever Differential (25 features, 5 classes) |
| **Deployment** | Vercel (SPA) + Render (Node Gateway & Python Server) + Neon (Cloud DB) |
| **Biggest Challenge**| WebRTC asynchronous ICE candidate race condition resolution |
| **Biggest Limitation**| Symptom-based triage cannot replace laboratory serology (NS1/PCR tests) |
| **Future Improvement**| Fine-tuned BioBERT transformer for automatic clinical note extraction |

---

## 10 Things I Must Remember

1. **Architecture is Decoupled**: Node.js handles I/O, WebSockets, and DB; Python handles Scikit-learn, XGBoost, and SHAP.
2. **Matching Replaces FIFO**: 5 factors: $40\%$ Urgency, $25\%$ Specialty, $20\%$ Availability, $10\%$ Language, $5\%$ Experience.
3. **Prescriptions are Immutable**: Corrections use `amendedFromId` creating an auditable revision chain.
4. **SHAP Provides Visual Trust**: Game-theoretic Shapley values render green (positive) and red (negative) symptom impact bars.
5. **Red Flags Intercept ML**: Life-threatening signs (bleeding, dyspnea) immediately bypass ML and trigger emergency warnings.
6. **WebRTC Uses ICE Buffering**: Prevents DOM exceptions when candidate packets arrive before remote SDP is processed.
7. **Dual-Token Auth**: 15m access token in memory + 7d refresh token in HTTP-only cookie + DB revocation check.
8. **Medication End Dates are Computed**: `startDate + duration_in_days` eliminates background status cron jobs.
9. **PostgreSQL Over MongoDB**: Strict relational integrity, foreign key cascades, and ACID transactions.
10. **Human-in-the-Loop Philosophy**: AI guides triage; licensed physicians retain 100% final prescription authority.
