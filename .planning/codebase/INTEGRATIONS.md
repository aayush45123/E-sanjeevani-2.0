# External Integrations
**Analysis Date:** 2026-11-07

## APIs & External Services

**Large Language Model (LLM) Inference:**
- **HuggingFace Inference Router**:
  - Purpose: Powers the conversational AI patient triage chatbot, generates in-consultation doctor clinical suggestions (drug interactions, follow-up advice), and compiles longitudinal clinical narratives.
  - Model: `meta-llama/Llama-3.1-8B-Instruct`
  - Endpoint: `https://router.huggingface.co/v1/chat/completions` (OpenAI-compatible wire format)
  - SDK/Client: `openai` (`OpenAI` client initialized with custom `baseURL`) in `server/src/services/chat.service.js`, `server/src/services/doctorAssistant.service.js`, and `server/src/services/triage.service.js`
  - Auth: `HF_TOKEN` environment variable
  - Fallback / Error Handling: Graceful degradation with fallback clinical recommendations and detailed console error reporting when `HF_TOKEN` is unavailable or rate-limited.

**WebRTC STUN & Media Relaying:**
- **Google & Twilio Public STUN Infrastructure**:
  - Purpose: Session Traversal Utilities for NAT (STUN) resolution, discovering public IP addresses and ports to establish direct peer-to-peer audio/video streaming between patient and doctor.
  - SDK/Client: Native browser `RTCPeerConnection` instantiated in `client/src/pages/VideoCall/VideoCall.jsx`
  - Configured STUN Servers:
    - `stun:stun.l.google.com:19302`
    - `stun:stun1.l.google.com:19302`
    - `stun:stun2.l.google.com:19302`
    - `stun:stun3.l.google.com:19302`
    - `stun:stun4.l.google.com:19302`
    - `stun:global.stun.twilio.com:3478`
  - Signaling Bus: Socket.IO WebSocket server in `server/src/socket/socketServer.js` (events: `join-room`, `user-joined`, `offer`, `answer`, `ice-candidate`, `end-call`).

**Transactional Email & Notifications:**
- **Google OAuth2 / SMTP (Nodemailer)**:
  - Purpose: Delivers critical appointment confirmations, patient welcome emails, doctor waiting room presence alerts, and per-minute scheduled consultation reminders.
  - SDK/Client: `nodemailer` in `server/src/emails/emailTransporter.js` and `server/src/cron/consultationReminderJob.js`
  - Auth: OAuth2 credentials (`EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`) or SMTP app password (`EMAIL_PASS`), controlled via `ENABLE_EMAIL`
  - Safety Harness: Built-in `safeTransporter` wrapper intercepts send failures gracefully without crashing HTTP requests or background jobs.
- **Resend (Optional / Alternative)**:
  - Purpose: Available in root `package.json` (`resend: ^6.12.2`) for alternative transactional email dispatch.

**Internal Microservice Integrations:**
- **Python Flask AI Microservice (`ai-model/app.py`)**:
  - Purpose: Executes CPU-bound machine learning inferences across 5 distinct disease categories, computes SHAP symptom contribution values, screens for clinical red flags, and computes longitudinal patient risk trends.
  - Service Location: Local microservice listening on port `8000` (`http://127.0.0.1:8000`), configurable via `PYTHON_AI_URL` in `server/.env`.
  - Client: `axios` HTTP client in `server/src/ai/triageClient.js` and `server/src/controllers/feverController.js`.
  - Primary Endpoints:
    - `POST /predict-triage`: Orchestrates multiclass predictions for Fever, Respiratory, Digestive, Skin, and Urinary Tract models, returning ranked diagnoses, probabilities, and SHAP explanations.
    - `POST /predict-fever`: Evaluates fever differential symptom vectors against 5 tropical febrile conditions (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever).
    - `GET /triage-health`: Diagnostics endpoint returning health status and feature vector dimension counts for each category model.
    - `GET /categories`: Delivers clinical metadata, feature inventories, and red flag trigger definitions.
    - `POST /longitudinal-health-analysis`: Analyzes historical vitals trajectories, recurring symptom clusters, and Modified Early Warning Scores (MEWS).

## Data Storage

**Databases:**
- **Neon Serverless PostgreSQL**:
  - Type: Cloud Serverless Managed PostgreSQL (version 14+) with auto-scaling and connection pooling.
  - Connection: `DATABASE_URL` environment variable (`postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require`).
  - Client / ORM: `drizzle-orm` (`drizzle-orm/neon-serverless`) together with `@neondatabase/serverless` and WebSocket transport `ws` (`neonConfig.webSocketConstructor = ws`) configured in `server/src/config/neonDb.js`.
  - Connection Management: Shared singleton `Pool` instance exportable across repositories and cron services.
  - Auto-Schema Enforcement: Direct DDL routines in `server/src/config/neonDb.js` (`ensurePrescriptionTablesExist()`, `ensureLongitudinalHealthTablesExist()`) ensure required enum types and tables are created automatically on boot.
  - Schema Structure: 20 normalized relational tables in `server/src/database/schema/index.js` managing users, authentication tokens, doctor/patient profiles, appointment slots, consultations, feedback, prescriptions, items, medical records, and longitudinal health metrics.
- **MongoDB (Legacy / Transitional)**:
  - Connection: `MONGO_URI` environment variable via `mongoose` in `server/src/config/db.js`. Retained during schema migration; active operational database is Neon PostgreSQL.

**File Storage:**
- **Local Filesystem Only**:
  - Static Directory Root: `server/uploads/` served via Express static middleware (`app.use("/uploads", express.static(...))` in `server/src/app.js`).
  - Prescriptions: `server/uploads/prescriptions/` — Automated clinical prescription PDF files generated via `PDFKit` in `server/src/services/prescriptionPdfService.js`.
  - Attachments & History: `server/uploads/attachments/` — Patient uploaded lab reports, past prescriptions, and clinical history files managed via `multer.diskStorage` in `server/src/routes/medicalRecordRoutes.js` and `server/src/routes/patientHistoryRoutes.js`.
  - Permitted Formats: PDF, JPEG, JPG, PNG (enforced via file extension and MIME type filtering with 10MB limits).

**Caching:**
- **None**:
  - All database queries and model predictions operate in real time without external caching layers (such as Redis or Memcached).

## Authentication & Identity

**Auth Provider:**
- **Custom Stateless JWT Authentication**:
  - Implementation: Dual-token strategy using `jsonwebtoken` and `bcryptjs` in `server/src/controllers/authController.js` and `server/src/middlewares/authMiddleware.js`.
  - Access Token: Short-lived HMAC-SHA256 JWT containing user ID and role, delivered via HTTP Authorization Bearer header or signed cookie (`JWT_SECRET`).
  - Refresh Token: Long-lived cryptographically signed token (`REFRESH_TOKEN_SECRET`) stored securely in PostgreSQL table `refresh_tokens` for token rotation upon expiration.
  - Password Security: Salted bcrypt hashing applied before storage in `users` table.
  - Role-Based Access Control (RBAC): Enforces granular authorization for `patient`, `doctor`, and `admin` roles in `server/src/middlewares/roleMiddleware.js`.

## Monitoring & Observability

**Error Tracking:**
- **Application-Level Try/Catch & Global Error Handling**:
  - Centralized Express error-handling middleware in `server/src/app.js` catching uncaught errors and dispatching structured JSON error responses (`{ success: false, message: ... }`).
  - Python Flask error handlers capturing tracebacks and outputting JSON error envelopes (`ai-model/app.py`).

**Logs:**
- **Console Standard Output (stdout/stderr)**:
  - Express HTTP Request Logger: Logs inbound route requests (`📨 GET /api/...` in `server/src/app.js`).
  - Socket Server Logger: Logs connection lifecycles, active room joins, and signaling exchanges (`[Socket] Connected: <id>` in `server/src/socket/socketServer.js`).
  - WebRTC Logger: Logs peer connection establishment, ICE candidates, and stream renegotiation in `client/src/pages/VideoCall/VideoCall.jsx`.
  - Cron Logger: Logs consultation polling status and email dispatch outcomes (`⏰ CONSULTATION REMINDER JOB:` in `server/src/cron/consultationReminderJob.js`).

## CI/CD & Deployment

**Hosting:**
- **Frontend**: Vercel Single Page Application hosting (`vercel.json` rewrites all requests to `/index.html`).
- **Backend**: Container or Node.js runtime host (Render, Railway, Fly.io, or AWS EC2).
- **Python AI Microservice**: Gunicorn WSGI container host on cloud virtual machine or microservice container.
- **Database**: Neon Serverless Cloud.

**CI Pipeline:**
- **None configured**: No active GitHub Actions or GitLab CI configuration files present in repository. Builds and tests are executed locally via npm and python scripts.

## Environment Configuration

**Required env vars:**
- **Backend (`server/.env`)**:
  - `PORT`: HTTP port for Node.js Express server (`5000`).
  - `CLIENT_URL`: Trusted frontend origin for CORS and Socket.IO (e.g. `http://localhost:5173` or production domain).
  - `DATABASE_URL`: Neon PostgreSQL pooled connection URI.
  - `JWT_SECRET`: Secret string for signing access tokens.
  - `REFRESH_TOKEN_SECRET`: Secret string for signing rotating refresh tokens.
  - `PYTHON_AI_URL`: Base URL for the Python Flask triage microservice (`http://127.0.0.1:8000`).
  - `HF_TOKEN`: HuggingFace API key for Llama 3.1 LLM queries.
  - `ENABLE_EMAIL`: Flag (`"true"` / `"false"`) controlling Nodemailer transport.
  - `EMAIL_USER`: Email account address for system notifications.
  - `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`: Google Cloud OAuth2 credentials for Gmail API email delivery.
- **Frontend (`client/.env`)**:
  - `VITE_API_URL`: Backend API endpoint base (e.g. `http://localhost:5000/api`).
- **Python Microservice (`ai-model/.env`)**:
  - `PORT`: Microservice port (`8000`).

**Secrets location:**
- Stored exclusively in local, uncommitted `.env` files within `server/`, `client/`, and `ai-model/` (enforced via `.gitignore`). Never checked into git.

## Webhooks & Callbacks

**Incoming:**
- **None**: The application exposes pure REST APIs and WebSocket listeners without incoming third-party webhooks (e.g., Stripe, Twilio webhooks are not currently configured).

**Outgoing:**
- **HuggingFace Router API**: Outgoing HTTP POST calls to `https://router.huggingface.co/v1/chat/completions` for LLM inference.
- **Internal Flask Microservice**: Outgoing HTTP POST calls to `http://127.0.0.1:8000/predict-triage`, `/predict-fever`, and `/longitudinal-health-analysis`.
- **Google OAuth2 / SMTP**: Outgoing SMTP/TLS socket connections to mail servers for notification dispatch.

---

*Integration audit: 2026-11-07*
