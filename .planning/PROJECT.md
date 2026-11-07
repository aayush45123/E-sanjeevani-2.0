# E-Sanjeevani 2.0 — Project Specification & Context

> **Project Name**: E-Sanjeevani 2.0  
> **Tagline**: AI-Augmented Telemedicine, Clinical Triage & Longitudinal Patient Health Intelligence Platform  
> **Academic Institution**: K. J. Somaiya Institute of Technology, Mumbai (Department of Artificial Intelligence & Data Science)  
> **Status**: Production-Grade Brownfield Application (Phases 1–5 Implemented & Verified)  

---

## 1. Vision & Core Problem

### The Clinical Problem
India's current telemedicine platforms (including the national eSanjeevani program) process consultations via a rigid **First-Come-First-Serve (FCFS)** model. This creates dangerous bottlenecks:
1. **Critical emergencies wait behind routine seasonal queries.**
2. **Physicians suffer cognitive overload** handling repetitive non-critical queries that could be handled via home-care guidance.
3. **Doctors are matched arbitrarily** based on availability rather than specialized disease competence.
4. **Medical records are static document silos** without longitudinal analytical value: doctors miss escalating symptoms (e.g. Fever → Fever+Fatigue → Fever+Fatigue+Joint Pain) and physiological deterioration across visits.
5. **Tropical febrile illnesses** (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever) share high symptom overlap, leading to frequent initial misdiagnosis.

### The Solution: E-Sanjeevani 2.0
An end-to-end full-stack telemedicine platform engineered with **human-in-the-loop clinical AI decision support**:
- **Automated Clinical Urgency Scoring (1–10 scale)** to prioritize emergency cases.
- **5-Factor Dynamic Doctor Matching Utility** ($40\%$ Urgency, $25\%$ Specialty, $20\%$ Availability, $10\%$ Language, $5\%$ Experience).
- **Specialized 5-Category Triage AI Models** (25 diseases, 86–99% accuracy) with **SHAP Explainability** and 22 emergency red-flag interceptors.
- **Browser-Native WebRTC Video/Audio Consultations** with pre-join checks, audio-only mode, and an in-call 4-pane clinical assistant.
- **First-Class Immutable Prescriptions** with version-chained amendments and automated PDFKit vector PDF generation.
- **AI-Powered Longitudinal Patient Health Intelligence**: Multi-visit symptom trajectory detection, MEWS scoring, linear regression on 14 vitals, comparative matrices, RAG retrieval, and Llama-3.1-8B-Instruct clinical summaries with 100% JavaScript zero-downtime fallback.

---

## 2. Target Users & Personas

- **Patients**: End-users seeking preliminary symptom guidance, AI triage classification, scheduled or emergency specialist video consultations, digital prescription downloads, and longitudinal health records.
- **Doctors / Specialists**: Licensed clinicians managing availability slots, reviewing pending patients with triage urgency scores, conducting encrypted WebRTC consultations with live AI dossiers, issuing structured digital prescriptions, and viewing longitudinal patient trajectory analytics.
- **Administrators**: System management, doctor credential verification, and platform monitoring.

---

## 3. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│        Frontend: React 19 + Vite 6 + CSS Modules + Recharts     │
│    Patient Portal  │  Doctor Dashboard  │  WebRTC Video Room    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS REST / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│        Backend Gateway: Node.js v20 + Express.js 5               │
│    Auth Middleware │ Socket.IO Signaling │ Node-Cron Reminders  │
└──────────────┬───────────────────────────────┬──────────────────┘
               │ Drizzle ORM                   │ HTTP Proxy (:8000)
┌──────────────▼──────────────┐  ┌─────────────▼──────────────────┐
│ Neon Serverless PostgreSQL  │  │ Python Flask AI Microservice   │
│ 20 Normalized Relational    │  │ 5 Specialty Category Models    │
│ Tables                      │  │ SHAP XAI + Red-Flag Detection  │
└─────────────────────────────┘  │ Longitudinal Intelligence +    │
                                 │ Llama-3.1-8B via HuggingFace   │
                                 └────────────────────────────────┘
```

### Core Technologies
- **Client**: React 19, Vite, Recharts, Lucide Icons, CSS Modules, Axios.
- **Server**: Node.js 20 LTS, Express 5, Drizzle ORM, Socket.IO 4, PDFKit, Nodemailer, Bcrypt, JWT.
- **Database**: Neon Serverless PostgreSQL (20 tables with indexes, foreign keys, cascades).
- **AI / ML**: Python 3.11, Flask 3.0, Scikit-learn, XGBoost, Random Forest, SHAP, HuggingFace Inference Router.

---

## 4. Key Architectural Guarantees & Constraints

1. **Human-in-the-Loop Clinical Authority**: Every AI output is labeled as decision support. Final diagnosis and treatment remain exclusively with the licensed physician.
2. **Prescription Immutability**: Finalized prescriptions can never be edited or deleted; corrections create version-chained records linked via `amendedFromId`.
3. **Zero-Downtime Fallback**: If the Python AI microservice times out (>3.5s) or crashes, the Node.js backend executes a pure JavaScript fallback engine replicating MEWS, linear regression, and symptom recurrence detection.
4. **Dual-Token Auth Security**: 15-minute access JWTs paired with 7-day database-persisted rotating refresh tokens delivered via `httpOnly` secure cookies.

