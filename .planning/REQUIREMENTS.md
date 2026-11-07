# E-Sanjeevani 2.0 — Functional & Technical Requirements

> **Status**: Comprehensive Brownfield Requirements Specification  
> **Traceability**: Aligned with implemented code in `client/`, `server/`, `ai-model/`, and `database/`  

---

## 1. Completed Requirements (Phases 1–5)

### REQ-AUTH: Authentication, Authorization & Security
- [x] **REQ-AUTH-01**: Secure dual-token authentication (15-min JWT access token + 7-day database-persisted rotating refresh token in `httpOnly`, `SameSite=None` secure cookies).
- [x] **REQ-AUTH-02**: Role-Based Access Control (`patient`, `doctor`, `admin`) enforced via backend middleware and frontend guard hooks.
- [x] **REQ-AUTH-03**: Passwords hashed with `bcryptjs` (10 salt rounds).
- [x] **REQ-AUTH-04**: Onboarding profile completion gating (redirects incomplete doctors to `/doctor-profile-setup` and patients to `/profile-setup`).

### REQ-CLIN: Clinical Scheduling & Doctor Discovery
- [x] **REQ-CLIN-01**: Doctor availability management with day-level recurrence and discrete bookable time slots (`availability_slots`).
- [x] **REQ-CLIN-02**: Doctor discovery catalog with filtering by medical specialty, spoken language, fees, and rating.
- [x] **REQ-CLIN-03**: Atomic slot reservation locking on consultation confirmation with automatic release on cancellation.
- [x] **REQ-CLIN-04**: Scheduled background reminder job (`consultationReminderJob.js`) transmitting dual-channel email alerts (doctor & patient) via Nodemailer.

### REQ-AI-TRIAGE: Clinical Triage & Differential Diagnosis
- [x] **REQ-AI-01**: Rule-based clinical urgency calculation (1–10 scale) factoring critical symptoms (+10), severe symptoms (+7), moderate symptoms (+4), comorbidity multipliers (+2 to +3), and age-risk factors.
- [x] **REQ-AI-02**: Emergency Red-Flag detection with 22 clinical triggers (crushing chest pain, severe dyspnea, anaphylaxis, blood in vomit, hematuria) intercepting the triage flow with a hard-blocking emergency hospital referral modal.
- [x] **REQ-AI-03**: 5-Category clinical triage architecture covering 25 conditions across Fever, Respiratory, Digestive, Skin, and Urinary Tract domains.
- [x] **REQ-AI-04**: Fever Differential Assessment engine using WHO-grounded symptom distributions for Dengue, Malaria, Typhoid, Chikungunya, and Viral Fever.
- [x] **REQ-AI-05**: Explainable AI (SHAP TreeExplainer & feature log-odds) rendered as green/red divergent feature contribution bar charts.
- [x] **REQ-AI-06**: Dynamic 5-Factor Doctor Matching Algorithm:
  $$\text{Priority Score} = 0.40 \cdot U_{\text{norm}} + 0.25 \cdot S_{\text{match}} + 0.20 \cdot A_{\text{score}} + 0.10 \cdot L_{\text{score}} + 0.05 \cdot E_{\text{norm}}$$
- [x] **REQ-AI-07**: Conversational AI clinical chatbot integrated with `meta-llama/Llama-3.1-8B-Instruct` via HuggingFace API.

### REQ-RTC: Telemedicine Video Consultation
- [x] **REQ-RTC-01**: Browser-native encrypted WebRTC audio/video consultations using Socket.IO signaling and Google public STUN servers.
- [x] **REQ-RTC-02**: Pre-join check-in room with camera/mic inspection and "Join with video off" audio-only mode.
- [x] **REQ-RTC-03**: In-call 4-pane clinical workspace for attending physicians:
  1. *Intelligence Tab*: Longitudinal trends & trajectory alerts
  2. *Patient Info & AI Summary Tab*: Demographics, triage score, symptom history
  3. *Digital Prescription Tab*: Structured medicine prescription form
  4. *Clinical AI Copilot Tab*: Drug interaction and dosage assistant
- [x] **REQ-RTC-04**: Real-time in-call text chat persisted to `chat_messages` table.

### REQ-RX: Digital Prescription Management
- [x] **REQ-RX-01**: Prescriptions as first-class relational entities (`prescriptions`, `prescription_items`).
- [x] **REQ-RX-02**: Finalized prescription immutability with version-chained amendments (`amended_from_id`, status: `amended`).
- [x] **REQ-RX-03**: Deterministic medication lifecycle tracking (`endDate = startDate + duration`) computing active vs. completed status.
- [x] **REQ-RX-04**: Server-side vector PDF generation via PDFKit with clinic branding, doctor registration number, and digital timestamp.

### REQ-LONGIT: AI-Powered Longitudinal Health Intelligence
- [x] **REQ-LONGIT-01**: Multi-visit symptom trajectory detection matching a 14-symptom canonical ontology and issuing critical escalation alerts (e.g. Fever → Fever+Fatigue → Fever+Fatigue+Joint Pain).
- [x] **REQ-LONGIT-02**: Time-series regression analysis tracking 14 physiological parameters with ordinary least-squares slope computation ($m$) to classify trends as worsening, improving, or stable.
- [x] **REQ-LONGIT-03**: Modified Early Warning Score (MEWS, 0–14 scale) calculated from vitals to alert on acute deterioration.
- [x] **REQ-LONGIT-04**: Comparative Health Parameter Matrix computing absolute $\Delta$ and %$\Delta$ against baseline and previous consultations.
- [x] **REQ-LONGIT-05**: RAG retrieval over patient consultations, prescriptions, and lab records to inform LLM clinical summaries.
- [x] **REQ-LONGIT-06**: Interactive 4-tab Recharts dashboard (Pyrexia & Pulse, Blood Pressure, SpO2 & Glucose, Platelet trends) with clinical reference lines.
- [x] **REQ-LONGIT-07**: Bedside Quick Vitals Logger modal for immediate measurement recording during consultations.
- [x] **REQ-LONGIT-08**: 100% JavaScript fallback engine providing zero downtime if the Python AI service is unreachable.

---

## 2. Next-Phase / Future Requirements (Phase 6+)

### REQ-SEC: Security & Production Hardening
- [ ] **REQ-SEC-01**: Eliminate access token and sensitive user profile storage in browser `localStorage`.
- [ ] **REQ-SEC-02**: Enforce authentication and authorization middleware on `/uploads/attachments/` static files.
- [ ] **REQ-SEC-03**: Remove automated DDL `CREATE TABLE IF NOT EXISTS` execution on server startup; transition to strict Drizzle migration runner.
- [ ] **REQ-SEC-04**: Thread-safe ML model caching and memory optimization for concurrent requests in `ai-model/app.py`.

### REQ-ADV: Advanced Clinical & Interoperability Capabilities
- [ ] **REQ-ADV-01**: Multilingual NLP intake (Hindi, Marathi, Bengali, Tamil, Telugu) and voice-first interaction for rural telemedicine.
- [ ] **REQ-ADV-02**: Bluetooth / WebHID IoT vital sign streaming (pulse oximeter, blood pressure cuff, glucometer).
- [ ] **REQ-ADV-03**: Fine-tuned clinical BioBERT transformer replacing rule/dictionary symptom tokenization.
- [ ] **REQ-ADV-04**: HL7 FHIR-compliant JSON export and Ayushman Bharat Digital Mission (ABDM) Health ID interoperability.
- [ ] **REQ-ADV-05**: Emergency ambulance and regional hospital referral API webhooks.

