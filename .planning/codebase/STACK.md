# Technology Stack
**Analysis Date:** 2026-11-07

## Languages

**Primary:**
- **JavaScript (ECMAScript Modules / Node.js & Browser)**: Full application stack runtime language across backend and frontend.
  - Backend: Node.js ES Modules (`"type": "module"` in `server/package.json`), powering REST routes, business logic, WebSocket server, and database queries under `server/src/`.
  - Frontend: React 19 JSX / ES Modules (`"type": "module"` in `client/package.json`), driving interactive clinical dashboards, telemedicine interfaces, and stateful hooks under `client/src/`.
- **Python (3.12)**: Machine learning and clinical intelligence microservice (`ai-model/.python-version`), executing multiclass triage models, SHAP explainability calculations, and longitudinal vitals tracking in `ai-model/app.py` and `ai-model/longitudinal_intelligence.py`.

**Secondary:**
- **SQL (PostgreSQL DDL/DML)**: Relational schema definition, constraints, enums, indexes, and queries configured via Drizzle ORM in `server/src/database/schema/` and executed on Neon Serverless PostgreSQL.
- **CSS3 / CSS Modules**: Scoped component styling (`client/src/**/*.module.css`) and global utility styling (`client/src/index.css`, `client/src/App.css`).
- **HTML5**: Base single-page application document markup (`client/index.html`).

## Runtime

**Environment:**
- **Node.js**: Minimum `v18.0.0+`, recommended `v20.x LTS` (running Express backend and Vite frontend development server).
- **Python**: `3.10+` (specifically configured for `3.12` via `ai-model/.python-version`).
- **Browser Runtime**: Modern evergreen browsers (Chrome, Edge, Firefox, Safari) with WebRTC (`RTCPeerConnection`, `getUserMedia`), HTML5 Canvas/Video, and WebSocket support.

**Package Manager:**
- **Node.js (npm)**:
  - Root: `package.json` with lockfile `package-lock.json` present.
  - Server: `server/package.json` with lockfile `server/.package-lock.json` present.
  - Client: `client/package.json` (managed via npm).
- **Python (pip)**:
  - Managed via `ai-model/requirements.txt` with locked version constraints.

## Frameworks

**Core:**
- **Express.js `^5.2.1`**: Core backend HTTP web application framework in `server/src/app.js`, providing routing, middleware, cookie parsing, CORS handling, and RESTful API endpoints.
- **Flask `3.0.3`**: Python WSGI microservice web framework in `ai-model/app.py`, serving disease predictions, 5-category triage inferences, SHAP explanations, and longitudinal analytics on port 8000.
- **Flask-Cors `4.0.1`**: Cross-origin request headers management for the Python microservice in `ai-model/app.py`.
- **React `^19.2.4` & `react-dom` `^19.2.4`**: Modern component-based user interface library in `client/src/main.jsx` and `client/src/App.jsx`.
- **React Router DOM `^7.13.1`**: Declarative client-side routing, route protection, and navigation in `client/src/App.jsx`.
- **Socket.IO `^4.8.3` (Server) & `socket.io-client` `^4.8.3` (Client)**: Real-time full-duplex WebSocket event bus used for WebRTC peer signaling, consultation presence management, and live chat in `server/src/socket/socketServer.js` and `client/src/pages/VideoCall/VideoCall.jsx`.

**Testing:**
- **Python Unit & Integration Tests**: Custom evaluation and diagnostic scripts in `ai-model/tests/` and `ai-model/scripts/evaluate_all_models.py`.
- **Database Test Scripts**: Custom connection test scripts in `server/src/database/test/`.
- *(Formal runner like Jest/Vitest or pytest is not currently configured as a package script; `server/package.json` test script is placeholder)*.

**Build/Dev:**
- **Vite `^8.0.1`**: Next-generation frontend build tool and development server (`client/vite.config.js`). Configured with `@vitejs/plugin-react` `^6.0.1` and HTTP/WebSocket proxies forwarding `/api`, `/socket.io`, and `/uploads` to `http://127.0.0.1:5000`.
- **Nodemon `^3.1.14`**: Hot-reloading development server monitor for Node.js in `server/package.json` (`npm run dev` executes `nodemon src/server.js`).
- **Drizzle Kit `^0.31.10`**: CLI companion for Drizzle ORM configured in `server/drizzle.config.js` (`db:generate`, `db:migrate`, `db:push`, `db:studio`).
- **Gunicorn `22.0.0`**: Production WSGI HTTP server for the Python Flask application (`ai-model/requirements.txt`).
- **ESLint `^9.39.4`**: Static code analysis and linting in `client/package.json` with `@eslint/js`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.

## Key Dependencies

**Critical:**
- **`drizzle-orm` `^0.45.2` & `@neondatabase/serverless` `^1.1.0`**: Type-safe relational ORM and serverless PostgreSQL client in `server/src/config/neonDb.js`, managing 20 normalized database tables, relationship queries, and automated table checks.
- **`ws` `^8.21.0`**: Required WebSocket transport adapter assigned to `neonConfig.webSocketConstructor` in `server/src/config/neonDb.js` to allow serverless PostgreSQL pooling in Node.js environments.
- **`openai` `^6.35.0`**: Unified AI client configured to target HuggingFace Inference API router (`https://router.huggingface.co/v1`) using `meta-llama/Llama-3.1-8B-Instruct` for conversational patient triage in `server/src/services/chat.service.js` and in-consultation doctor clinical assistance in `server/src/services/doctorAssistant.service.js`.
- **`scikit-learn` `1.6.1`**: Core scientific machine learning library in `ai-model/requirements.txt`, providing `RandomForestClassifier`, `ExtraTreesClassifier`, `LogisticRegression`, `StratifiedKFold`, and `LabelEncoder` for triage classification across 5 medical categories (Fever, Respiratory, Digestive, Skin, Urinary Tract).
- **`xgboost` `2.1.4`**: High-performance gradient boosted decision trees (`XGBClassifier`) evaluated and trained for fever differential diagnosis in `ai-model/fever_model/scripts/train_model.py`.
- **`shap` `0.46.0`**: SHAP (SHapley Additive exPlanations) framework utilizing `shap.TreeExplainer` in `ai-model/fever_model/scripts/explain_model.py` and `ai-model/app.py` to calculate exact mathematical symptom contributions ($\phi_i$) for clinician explainability.
- **`joblib` `1.4.2`**: High-throughput model persistence library used to load trained `.pkl` model weights, label encoders, and feature column arrays in `ai-model/app.py`.
- **`numpy` `1.26.4` & `pandas` `2.2.2`**: High-performance vector operations and DataFrame manipulations in `ai-model/app.py` and `ai-model/longitudinal_intelligence.py` for feature encoding and physiological vitals normalization.
- **`pdfkit` `^0.19.1`**: Server-side programmatic PDF generation engine in `server/src/services/prescriptionPdfService.js`, rendering formal clinical prescriptions with clinic branding, patient/doctor metadata, medication schedules, and digital signatures.
- **`nodemailer` `^9.0.3`**: Enterprise email transport engine in `server/src/emails/emailTransporter.js`, supporting Google OAuth2 and SMTP for sending appointment confirmations, waiting room alerts, and automated cron reminders.
- **`recharts` `^3.8.1`**: Declarative React charting library in `client/package.json`, rendering doctor consultation analytics, disease prevalence distributions, and patient longitudinal vitals charts.
- **`lucide-react` `^1.14.0` & `react-icons` `^5.6.0`**: Comprehensive SVG icon systems utilized across patient dashboards, clinical forms, video consultation controls, and navigation sidebars.

**Infrastructure:**
- **`multer` `^2.2.0`**: Multipart form-data handling middleware for file uploads (medical records, clinical history attachments, lab results) stored in `server/uploads/` via `server/src/routes/medicalRecordRoutes.js` and `server/src/routes/patientHistoryRoutes.js`.
- **`jsonwebtoken` `^9.0.3` & `bcryptjs` `^3.0.3`**: Secure token-based authentication (stateless access JWTs, encrypted passwords) in `server/src/controllers/authController.js` and `server/src/middlewares/authMiddleware.js`.
- **`node-cron` `^3.0.3`**: In-process background job scheduler in `server/src/cron/consultationReminderJob.js`, polling pending consultations every minute and triggering automated email notices.
- **`zod` `^4.4.3` & `validator` `^13.15.26`**: Strict schema definition and request validation middleware (`server/src/middlewares/validate.js`).
- **`cookie-parser` `^1.4.7` & `cors` `^2.8.6`**: Secure HTTP cookie parsing for auth tokens and CORS enforcement across allowed origins in `server/src/app.js`.
- **`date-fns` `^4.1.0`**: Modular date utilities for appointment slot generation, date parsing, and reminder window calculations.
- **`react-markdown` `^10.1.0`**: Markdown rendering engine in `client/src/pages/Triage/AITriageChat.jsx` for rendering structured LLM chatbot guidance safely.
- **`react-hot-toast` `^2.6.0`**: Non-blocking toast notifications for user interactions, API errors, and appointment updates.
- **`axios` `^1.13.6`**: Promise-based HTTP client in both `client/src/` (communicating with Node.js backend) and `server/src/ai/triageClient.js` (forwarding requests to Python Flask microservice).
- **`resend` `^6.12.2`**: Transactional email API client present in root `package.json`.
- **`mongoose` `^9.3.1`**: MongoDB ODM configured in `server/src/config/db.js` (retained as legacy fallback during migration to Neon PostgreSQL).

## Configuration

**Environment:**
- **Backend (`server/.env`)**:
  - `PORT`: Server port (default `5000`).
  - `CLIENT_URL`: Allowed client origin for CORS and Socket.IO (e.g. `http://localhost:5173`).
  - `DATABASE_URL`: Neon PostgreSQL pooled connection string (`postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require`).
  - `JWT_SECRET`: Secret key for signing short-lived access JWTs.
  - `REFRESH_TOKEN_SECRET`: Secret key for signing long-lived rotating refresh tokens.
  - `PYTHON_AI_URL`: Base URL for the Python ML microservice (default `http://127.0.0.1:8000`).
  - `HF_TOKEN`: HuggingFace API access token for accessing `meta-llama/Llama-3.1-8B-Instruct`.
  - `ENABLE_EMAIL`: Boolean switch (`"true"` / `"false"`) to toggle email dispatch.
  - `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, or `EMAIL_PASS`: Email credentials for OAuth2/SMTP transport.
- **Frontend (`client/.env`)**:
  - `VITE_API_URL`: Backend REST API URL (e.g. `http://localhost:5000/api`).
- **Python AI Microservice (`ai-model/.env`)**:
  - `PORT`: Microservice listening port (default `8000`).

**Build:**
- `client/vite.config.js`: Vite bundling configuration, React plugin registration, and dev server reverse-proxy mappings (`/api`, `/socket.io`, `/uploads`).
- `server/drizzle.config.js`: Drizzle Kit migration configuration specifying schema path (`./src/database/schema/index.js`), output folder (`./drizzle`), and PostgreSQL dialect.
- `vercel.json`: Single-page application route rewrites redirecting all traffic to `/index.html` for production deployments.

## Platform Requirements

**Development:**
- Node.js runtime `v18.0.0+` (v20 LTS recommended) and npm.
- Python runtime `3.10+` (3.12 recommended) with pip and virtual environment capability.
- Active network connectivity for Neon Serverless PostgreSQL and HuggingFace API access.
- Port availability: `5173` (Vite client), `5000` (Node.js server), `8000` (Python AI server).

**Production:**
- **Client**: Static SPA hosted on Vercel or cloud CDN with HTTP rewrite support.
- **Backend**: Node.js container or cloud host (e.g. Render, Railway, AWS ECS) with persistent disk or object storage for uploads.
- **Python ML Microservice**: Gunicorn WSGI container with scikit-learn, XGBoost, and SHAP binary wheels installed.
- **Database**: Neon Serverless PostgreSQL with pooling enabled.

---

*Stack analysis: 2026-11-07*
