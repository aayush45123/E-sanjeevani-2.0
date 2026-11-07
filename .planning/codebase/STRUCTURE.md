</Architecture>
<Codebase Structure>
**Analysis Date:** 2026-11-07

## Directory Layout

```text
E-sanjeevani 2.0/
├── .planning/                              # Project governance, architectural specs & progress tracking
│   └── codebase/                           # Auto-generated system intelligence & codebase maps
│       ├── ARCHITECTURE.md                 # System architecture, data flow & component topology
│       ├── STRUCTURE.md                    # File organisation, routing map & module layout
│       ├── CONVENTIONS.md                  # Coding standards, style guides & formatting rules
│       ├── INTEGRATIONS.md                 # External services, databases & third-party APIs
│       └── STACK.md                        # Language, runtime, framework & dependency specifications
├── ai-model/                               # Python Flask microservice for ML triage & health intelligence
│   ├── data/                               # Clinical datasets for training (5 disease categories)
│   ├── evaluation_results/                 # Model metrics, confusion matrices & SHAP charts
│   ├── fever_model/                        # Dedicated fever classifier experiments & notebooks
│   ├── models/                             # Serialized joblib pipelines (*.pkl) and feature metadata (*.json)
│   ├── scripts/                            # Dataset synthesis & category model training scripts
│   ├── tests/                              # Unit & integration tests for Python triage pipelines
│   ├── app.py                              # Flask microservice entry point (Port 8000)
│   ├── longitudinal_intelligence.py        # Trajectory analysis, MEWS scoring & clinical RAG
│   └── requirements.txt                    # Python dependencies (Scikit-Learn, XGBoost, SHAP, etc.)
├── client/                                 # React 19 Frontend Single-Page Application (Vite 8)
│   ├── public/                             # Static assets, favicons & SVG logos
│   ├── src/
│   │   ├── assets/                         # UI icons, clinical illustrations, branding images
│   │   ├── components/                     # Reusable modular UI components & domain widgets
│   │   │   ├── AddressInput/               # Geocoded address selection widget
│   │   │   ├── AiTriage/                   # Interactive 5-category triage questionnaire
│   │   │   ├── ClinicalIntelligence/       # Physician assistant copilot & symptom matrix view
│   │   │   ├── DoctorSidebar/              # Clinician dashboard navigation sidebar
│   │   │   ├── Footer/                     # Global public footer component
│   │   │   ├── LongitudinalHealthIntelligence/ # Vital trends, MEWS alerts & progression chains
│   │   │   ├── MedicalRecords/             # Lab test & record upload modal dialogs
│   │   │   ├── Navbar/                     # Top navigation bar with role-based links & auth menu
│   │   │   ├── Sidebar/                    # Patient dashboard navigation sidebar
│   │   │   ├── Skeletons/                  # Zero-layout-shift Suspense fallback placeholders
│   │   │   └── TriageDetailView/           # Deep-dive triage report modal & recommendations
│   │   ├── hooks/                          # Custom React hooks (auth state, notification listeners)
│   │   ├── pages/                          # Routed page views
│   │   │   ├── Auth/                       # Patient & Doctor login / registration
│   │   │   ├── AvailableDoctors/           # Doctor directory with filtering & priority ordering
│   │   │   ├── ClinicalRecords/            # Centralised medical documents & lab uploads
│   │   │   ├── ConsultationBookingForm/    # Slot booking & symptom specification wizard
│   │   │   ├── Consultations/              # Chronological consultation list (active & past)
│   │   │   ├── ConsultedDoctors/           # History of clinicians previously consulted
│   │   │   ├── DoctorDashboard/            # Clinician command center, patient queue & schedules
│   │   │   ├── DoctorProfileEdit/          # Doctor clinic hours, address & fee management
│   │   │   ├── DoctorProfileSetup/         # Post-registration onboarding for clinicians
│   │   │   ├── Home/                       # Landing page with services & doctor discovery
│   │   │   ├── PatientDashBoard/           # Patient health overview, next appointments, quick actions
│   │   │   ├── PatientHistory/             # Complete longitudinal timeline of health encounters
│   │   │   ├── ProfileCompletion/          # Patient demographic, lifestyle & allergy onboarding
│   │   │   └── VideoCall/                  # WebRTC P2P audiovisual teleconsultation room
│   │   ├── styles/                         # Global CSS resets and custom variables
│   │   ├── utils/                          # API clients, axios interceptors, doctor scoring helpers
│   │   │   ├── api.js                      # Axios instance with dual-token auto-refresh logic
│   │   │   ├── auth.js                     # Local storage token utilities & session helpers
│   │   │   ├── doctorUtils.js              # Formatting & specialty classification helpers
│   │   │   └── remediesAndDoctorRecommender.js # Client-side doctor priority & distance calculation
│   │   ├── App.css                         # App-wide layout rules & theme definitions
│   │   ├── App.jsx                         # Root router, route guards & lazy component loader
│   │   └── main.jsx                        # React 19 entry point & WebRTC global polyfills
│   ├── package.json                        # Client dependencies (React 19, Recharts, Lucide, Axios)
│   └── vite.config.js                      # Vite build & bundler configuration
└── server/                                 # Node.js Express 5.x API Gateway & Socket Server
    ├── drizzle/                            # Drizzle ORM migration scripts & SQL snapshots
    ├── src/
    │   ├── ai/                             # Microservice HTTP adapters
    │   │   └── triageClient.js             # Client for Python Flask triage & intelligence endpoints
    │   ├── config/                         # Infrastructure & database configurations
    │   │   ├── db.js                       # Legacy database connection wrapper
    │   │   └── neonDb.js                   # Neon Serverless PostgreSQL Drizzle client pool
    │   ├── constants/                      # Application-wide constants & status enumerations
    │   ├── controllers/                    # HTTP request orchestrators (Express request/response)
    │   │   ├── analytics.controller.js     # Patient & Doctor analytical aggregates
    │   │   ├── authController.js           # Login, registration, token refresh & logout
    │   │   ├── chatController.js           # Consultation text chat messages
    │   │   ├── consultationController.js   # Booking, status transitions, doctor notes
    │   │   ├── doctorAssistantController.js# AI clinical copilot & contextual assistant
    │   │   ├── doctorAvailabilityController.js # Doctor slot schedules & calendar availability
    │   │   ├── doctorProfileController.js  # Doctor directory & profile management
    │   │   ├── feedbackController.js       # Post-consultation rating & review submission
    │   │   ├── medicalRecordController.js  # Document uploads, attachments & file serving
    │   │   ├── patientHistoryController.js # Comprehensive longitudinal history & vital metrics
    │   │   ├── patientProfileController.js # Patient demographic & medical profiles
    │   │   ├── prescriptionController.js   # Prescription issuing, amending & PDF streaming
    │   │   └── triageController.js         # Symptom intake & rule-based triage sessions
    │   ├── cron/                           # Background scheduled jobs
    │   │   └── consultationReminderJob.js  # Scheduled automated appointment reminder dispatcher
    │   ├── database/                       # Relational schema models (Drizzle ORM)
    │   │   └── schema/
    │   │       ├── aiTriageChats.js        # AI triage interaction histories
    │   │       ├── availabilitySlots.js    # Specific booking slot intervals
    │   │       ├── chatMessages.js         # Real-time text chat messages during calls
    │   │       ├── consultationFeedback.js # Patient ratings, doctor reviews & scores
    │   │       ├── consultationReports.js  # Diagnostic reports & clinical conclusions
    │   │       ├── consultations.js        # Core appointments & consultation records
    │   │       ├── doctorAvailabilities.js # Doctor schedule templates by date
    │   │       ├── doctorProfiles.js       # Doctor specialisation, experience, clinic address
    │   │       ├── enums.js                # PostgreSQL native ENUM type definitions
    │   │       ├── index.js                # Barrel export of all relational schema tables
    │   │       ├── medicalRecordAttachments.js # Uploaded files & document references
    │   │       ├── medicalRecords.js       # Patient historical medical reports & lab results
    │   │       ├── patientAddresses.js     # Patient geolocation & physical addresses
    │   │       ├── patientHealthMetrics.js # Time-series physiological vitals & MEWS scores
    │   │       ├── patientProfiles.js      # Patient clinical baseline (allergies, blood group)
    │   │       ├── prescriptionItems.js    # Individual medication dosage, frequency & duration
    │   │       ├── prescriptions.js        # First-class clinical prescription entities
    │   │       ├── refreshTokens.js        # Hashed refresh tokens for JWT rotation
    │   │       ├── triageMessages.js       # Structured symptom triage dialog entries
    │   │       ├── triageResponses.js      # Specific answers to triage questions
    │   │       ├── triageSessions.js       # Triage assessment records & urgency scores
    │   │       └── users.js                # Primary user entity (patient & doctor identities)
    │   ├── emails/                         # Nodemailer templates & dispatchers
    │   │   ├── emailTransporter.js         # SMTP transporter setup
    │   │   ├── sendAppointmentEmail.js     # Booking confirmation emails
    │   │   ├── sendConsultationReminderEmail.js # 1-hour pre-call notifications
    │   │   └── sendWelcomeEmail.js         # Post-registration welcome message
    │   ├── helpers/                        # Algorithmic & cross-cutting utility functions
    │   │   ├── cookieSettings.helper.js    # Secure cookie environment settings
    │   │   ├── doctorMatching.js           # 5-Factor Doctor Priority Matching Algorithm
    │   │   └── remediesAndDoctorRecommender.js # Geolocation & specialty recommendation engine
    │   ├── middlewares/                    # Express request pipeline filters
    │   │   ├── authMiddleware.js           # JWT Bearer / Cookie verification & user hydration
    │   │   └── uploadMiddleware.js         # Multer file upload storage & MIME type validation
    │   ├── repositories/                   # Encapsulated Drizzle ORM database query methods
    │   │   ├── aiTriage.repository.js      # Triage session persistence
    │   │   ├── availability.repository.js  # Slot generation & collision detection
    │   │   ├── consultation.repository.js  # Consultation filtering, joining & mutations
    │   │   ├── doctorProfile.repository.js # Candidate doctor lookups & specialty search
    │   │   ├── patientProfile.repository.js# Patient profile retrieval & updates
    │   │   ├── refreshToken.repository.js  # Token hashing, lookup, revocation & rotation
    │   │   ├── triage.repository.js        # Diagnostic response aggregation
    │   │   └── user.repository.js          # User identity, verification & credentials
    │   ├── routes/                         # Express router endpoint definitions
    │   │   ├── analyticsRoutes.js          # `/api/analytics`
    │   │   ├── authRoutes.js               # `/api/auth`
    │   │   ├── chatRoutes.js               # `/api/chat`
    │   │   ├── consultationRoutes.js       # `/api/consultations`
    │   │   ├── doctorAssistantRoutes.js    # `/api/doctor-assistant`
    │   │   ├── doctorAvailabilityRoutes.js # `/api/doctor-availability`
    │   │   ├── doctorProfileRoutes.js      # `/api/doctor-profile`
    │   │   ├── feedbackRoutes.js           # `/api/feedback`
    │   │   ├── feverRoutes.js              # `/api/triage-assessment`, `/api/fever`
    │   │   ├── medicalRecordRoutes.js      # `/api/medical-records`
    │   │   ├── patientHistoryRoutes.js     # `/api/patient-history`
    │   │   ├── patientProfileRoutes.js     # `/api/patient/profile`
    │   │   ├── prescriptionRoutes.js       # `/api/prescriptions`
    │   │   └── triageRoutes.js             # `/api/triage`
    │   ├── seeds/                          # Database seeding scripts (Mumbai doctors, mock records)
    │   ├── services/                       # Core domain business logic
    │   │   ├── analytics.service.js        # Aggregation of clinical metrics
    │   │   ├── auth.service.js             # Dual-token issuing, rotation & revocation
    │   │   ├── availability.service.js     # Scheduling slot generation & validation
    │   │   ├── chat.service.js             # Real-time chat message logging
    │   │   ├── consultation.service.js     # Booking workflow & status orchestration
    │   │   ├── doctorAssistant.service.js  # Contextual prompt engineering & clinical copilot
    │   │   ├── doctorProfile.service.js    # Doctor credentials verification
    │   │   ├── feedback.service.js         # Dynamic rating calculations
    │   │   ├── longitudinalIntelligence.service.js # Trajectory detection, MEWS & JS fallback
    │   │   ├── medicalRecord.service.js    # Document classification & attachment handling
    │   │   ├── patientHistory.service.js   # Timeline aggregation
    │   │   ├── patientProfile.service.js   # Patient profile completion validation
    │   │   ├── prescriptionLifecycle.service.js # Prescription state machine & amendments
    │   │   ├── prescriptionPdfService.js   # PDFKit printable prescription generator
    │   │   └── triage.service.js           # Urgency classification & intake
    │   ├── socket/                         # Real-time WebRTC signaling
    │   │   └── socketServer.js             # Socket.io room orchestration & SDP relay
    │   ├── validators/                     # Request validation schemas (Zod)
    │   │   ├── auth.validator.js           # Login & register input schemas
    │   │   ├── consultation.validator.js   # Appointment booking payload validation
    │   │   └── validation.middleware.js    # Generic Express validation middleware
    │   ├── app.js                          # Express application configuration & middleware stack
    │   └── server.js                       # Primary HTTP & WebSocket server bootloader (Port 5000)
    ├── package.json                        # Server dependencies (Express 5, Drizzle, Socket.io)
    └── drizzle.config.js                   # Drizzle Kit migration configuration
```

---

## Key File Locations

### Entry Points
- **Client SPA:** `client/src/main.jsx` (Mounts React 19 root, router, and WebRTC polyfills)
- **Server API Gateway & Sockets:** `server/src/server.js` (Binds HTTP server, checks Neon PostgreSQL connection, attaches Socket.io on port 5000)
- **Express App Configuration:** `server/src/app.js` (Sets up CORS, cookie-parser, request logging, and mounts all 14 API routers)
- **AI / ML Microservice:** `ai-model/app.py` (Flask server on port 8000 serving triage predictions and longitudinal intelligence)

### Configuration
- **Server Database Config:** `server/src/config/neonDb.js` (Initializes `@neondatabase/serverless` connection pool and exports `db` Drizzle instance)
- **Drizzle Kit Config:** `server/drizzle.config.js` (Points to schema directory `server/src/database/schema/index.js`)
- **Client Build Config:** `client/vite.config.js` (Vite 8 build plugins, code-splitting, and dev server proxies)
- **Client API Base Config:** `client/src/utils/api.js` (Configures Axios base URL, credentials, and token refresh interceptors)

### Core Business Logic
- **Dual-Token Auth & Session Security:** `server/src/services/auth.service.js`
- **5-Factor Doctor Priority Matching:** `server/src/helpers/doctorMatching.js`
- **Longitudinal Clinical Intelligence & JS Fallback:** `server/src/services/longitudinalIntelligence.service.js`
- **Longitudinal Python Trajectory & MEWS Engine:** `ai-model/longitudinal_intelligence.py`
- **Prescription Lifecycle State Machine:** `server/src/services/prescriptionLifecycle.service.js`
- **WebRTC Signaling & Room State:** `server/src/socket/socketServer.js`

### Testing
- **AI Model Test Suite:** `ai-model/tests/test_unified_triage.py` (Tests for 5-category disease inference pipelines)
- **Model Evaluation Scripts:** `ai-model/evaluation_results/ieee_fever_eval.py`

---

## Routing Map

### 1. Client Routing (`client/src/App.jsx`)

All routes use `React.lazy()` with matching `Skeletons` components as Suspense fallbacks:

| Path | Component / Page | Access Control / Guard | Description |
|------|-------------------|------------------------|-------------|
| `/` | `pages/Home/Home.jsx` | Public | Platform landing page with hero, services, and doctor highlights |
| `/auth` | `pages/Auth/Auth.jsx` | Unauthenticated only (redirects to `/dashboard` if logged in) | Unified login and sign-up form for patients and doctors |
| `/dashboard` | `pages/PatientDashBoard/` or `DoctorDashboard/` | Authenticated | Dynamic role-based redirection to Patient or Doctor dashboard |
| `/profile-setup` | `pages/ProfileCompletion/` | Patient (incomplete profile) | Guided onboarding collecting age, blood group, allergies, conditions |
| `/doctor-profile-setup` | `pages/DoctorProfileSetup/` | Doctor (incomplete profile) | Onboarding for clinicians collecting specialization, license, address |
| `/doctor-profile-edit` | `pages/DoctorProfileEdit/` | Doctor | Settings interface for updating clinic hours, consultation fees, bio |
| `/consultations` | `pages/Consultations/` | Authenticated | Overview of upcoming, ongoing, and completed teleconsultations |
| `/available-doctors` | `pages/AvailableDoctors/` | Patient | Directory of verified clinicians with filtering by specialty & location |
| `/consulted-doctors` | `pages/ConsultedDoctors/` | Patient | Quick re-booking and history of previously consulted physicians |
| `/clinical-records` | `pages/ClinicalRecords/` | Authenticated | Repository of medical records, lab reports, and uploaded documents |
| `/patient-history` | `pages/PatientHistory/` | Authenticated | Longitudinal timeline of health vitals, diagnoses, and prescriptions |
| `/consultation-booking`| `pages/ConsultationBookingForm/` | Patient | Appointment scheduler with slot selection and problem description |
| `/video-call/:consultationId` | `pages/VideoCall/` | Authenticated (Consultation Participant) | P2P WebRTC audiovisual room with chat and real-time vitals view |
| `/ai-triage` | `components/AiTriage/` | Patient | Interactive symptom questionnaire across 5 disease categories |
| `/doctor-dashboard/patients` | `pages/DoctorDashboard/MyPatients.jsx` | Doctor | Searchable directory of all patients with consultation records |
| `/doctor-dashboard/schedule` | `pages/DoctorDashboard/DoctorSchedule.jsx` | Doctor | Interactive calendar for managing availability slots and breaks |
| `/doctor-dashboard/analytics`| `pages/DoctorDashboard/DoctorAnalytics.jsx` | Doctor | Visual charts of patient demographics, visit frequency, and ratings |
| `/doctor-dashboard/records` | `pages/ClinicalRecords/ClinicalRecords.jsx` | Doctor | Clinician access to medical document archive |
| `/doctor-dashboard/help` | `pages/DoctorDashboard/DoctorHelp.jsx` | Doctor | Clinician support and guidelines |
| `*` | Wildcard | Public | 404 fallback routing back to home |

---

### 2. Express Server Routing Map (`server/src/app.js`)

All routes mounted under `/api/`:

| Base Mount | Route File | Key Endpoints | Auth Required |
|------------|------------|---------------|---------------|
| `/api/auth` | `routes/authRoutes.js` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` | Conditional |
| `/api/consultations` | `routes/consultationRoutes.js` | `POST /book`, `GET /my-consultations`, `GET /:id`, `PATCH /:id/status`, `POST /:id/notes` | Yes (`authMiddleware`) |
| `/api/patient/profile` | `routes/patientProfileRoutes.js` | `GET /`, `POST /complete`, `PUT /update` | Yes (Patient) |
| `/api/doctor-availability`| `routes/doctorAvailabilityRoutes.js`| `POST /set-slots`, `GET /slots/:doctorId`, `GET /my-availability` | Yes |
| `/api/doctor-profile` | `routes/doctorProfileRoutes.js` | `GET /`, `GET /:id`, `POST /setup`, `PUT /update`, `GET /specialties/list`, `GET /all/candidates` | Yes |
| `/api/triage-assessment`<br>`/api/fever` | `routes/feverRoutes.js` | `GET /health`, `GET /categories`, `POST /predict`, `POST /predict-category` | Yes |
| `/api/triage` | `routes/triageRoutes.js` | `POST /assess`, `GET /sessions`, `GET /sessions/:id` | Yes |
| `/api/doctor-assistant` | `routes/doctorAssistantRoutes.js` | `GET /data/:consultationId`, `POST /chat` | Yes (Doctor) |
| `/api/analytics` | `routes/analyticsRoutes.js` | `GET /doctor`, `GET /patient` | Yes |
| `/api/medical-records` | `routes/medicalRecordRoutes.js` | `POST /upload`, `GET /patient/:patientId`, `DELETE /:id` | Yes |
| `/api/prescriptions` | `routes/prescriptionRoutes.js` | `POST /`, `GET /:id`, `GET /consultation/:consultationId`, `GET /:id/download-pdf`, `PATCH /:id/amend` | Yes |
| `/api/patient-history` | `routes/patientHistoryRoutes.js` | `GET /:patientId`, `GET /:patientId/longitudinal`, `POST /:patientId/metrics`, `GET /:patientId/metrics` | Yes |
| `/api/chat` | `routes/chatRoutes.js` | `GET /:consultationId`, `POST /send` | Yes |
| `/api/feedback` | `routes/feedbackRoutes.js` | `POST /`, `GET /doctor/:doctorId` | Yes |

---

### 3. Python AI Microservice Routing Map (`ai-model/app.py`)

Hosted on `http://127.0.0.1:8000`:

| HTTP Method | Route | Description |
|-------------|-------|-------------|
| `GET` | `/` | Microservice status, loaded model counts, and supported categories |
| `GET` | `/triage-health` | Health and readiness check for all 5 category ML pipelines |
| `GET` | `/categories` | Clinical category configurations, feature name lists, and critical red flags |
| `POST` | `/predict-triage` | Main multi-category ML inference endpoint; computes urgency and primary disease |
| `POST` | `/predict-category` | Category-specific classification (e.g. Fever, Respiratory, Digestive) |
| `POST` | `/analyze-longitudinal-intelligence` | Executes symptom recurrence, OLS parameter slope, MEWS scoring & clinical RAG |
| `GET` | `/longitudinal-intelligence/demo` | Demonstration payload showcasing multi-visit escalation detection |

---

## Naming Conventions

### Files
- **React Components & Pages:** PascalCase (e.g., `PatientDashBoard.jsx`, `VideoCall.jsx`, `Navbar.jsx`).
- **Styles:** Matching component name with `.css` (e.g., `App.css`, `Navbar.css`).
- **Services & Helpers (Node.js):** camelCase with descriptor suffixes (e.g., `consultation.service.js`, `auth.service.js`, `doctorMatching.js`).
- **Repositories:** camelCase with `.repository.js` (e.g., `user.repository.js`, `consultation.repository.js`).
- **Routes:** camelCase with `Routes.js` (e.g., `consultationRoutes.js`, `prescriptionRoutes.js`).
- **Database Schemas:** camelCase (e.g., `consultations.js`, `patientHealthMetrics.js`, `enums.js`).
- **Python Modules:** snake_case (e.g., `longitudinal_intelligence.py`, `train_all_category_models.py`).

### Directories
- **Client Feature Modules:** PascalCase for component folders (e.g., `client/src/components/AiTriage/`, `client/src/pages/VideoCall/`).
- **Server Functional Folders:** lowercase kebab-case or single words (e.g., `server/src/controllers/`, `server/src/database/schema/`, `server/src/repositories/`).
- **Python Directories:** lowercase snake_case (e.g., `ai-model/fever_model/`, `ai-model/evaluation_results/`).

---

## Where to Add New Code

### Adding a New Healthcare Feature (e.g., Remote Vitals Device Ingestion)
1. **Database Schema:** Define new relational table in `server/src/database/schema/deviceReadings.js` and re-export in `server/src/database/schema/index.js`.
2. **Repository:** Implement type-safe queries in `server/src/repositories/deviceReading.repository.js`.
3. **Service Logic:** Create `server/src/services/deviceReading.service.js` with data cleaning and alert triggers.
4. **Controller & Route:** Add `server/src/controllers/deviceReading.controller.js` and `server/src/routes/deviceReadingRoutes.js`.
5. **Express App Mount:** Register the router in `server/src/app.js` under `/api/device-readings`.
6. **Client API Helper:** Add API caller functions to `client/src/utils/api.js`.
7. **Client Page / Component:** Create responsive view in `client/src/pages/DeviceReadings/` and add route in `client/src/App.jsx`.

### Adding a New ML Diagnostic Model
1. **Training & Serialization:** Train model in `ai-model/scripts/`, export serialized `.pkl` pipeline and feature `.json` to `ai-model/models/`.
2. **Microservice Handler:** Load model in `ai-model/app.py`, add category metadata to `CATEGORY_CONFIG`, and wire inference branch in `/predict-triage`.
3. **Node.js Adapter:** Update category definitions in `server/src/routes/feverRoutes.js`.
4. **Client Triage UI:** Add symptom options to `client/src/components/AiTriage/AiTriage.jsx`.

---

## Special Directories

- `server/uploads/`: Local filesystem storage for uploaded medical records and PDFs. *Generated at runtime; git-ignored.*
- `server/drizzle/`: Auto-generated migration files created by `drizzle-kit generate`. *Committed to git for database schema versioning.*
- `ai-model/models/`: Serialized scikit-learn/joblib machine learning models and encoders. *Committed to repository to ensure instant zero-cold-start inference.*
- `client/dist/`: Vite compiled output bundle for production deployment. *Generated during build; git-ignored.*

---

*Structure analysis: 2026-11-07*
