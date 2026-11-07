# E-Sanjeevani 2.0 — Milestone Roadmap

> **Current Milestone**: Milestone 2.0 (Completed) → Preparing Milestone 2.1 (Production Hardening & Advanced Ecosystem)  
> **Progress**: 5/5 Core Phases Completed (100%)  

---

## Completed Phases (Phases 1–5)

### Phase 1: Core Foundation & Modernization (Completed)
- **Goal**: Full-stack initialization, Neon Serverless PostgreSQL migration with Drizzle ORM, dual-token JWT + HTTP-only cookie auth, and patient/doctor onboarding wizard workflows.
- **Deliverables**:
  - 18 core normalized tables in Drizzle ORM
  - User authentication and role-based access control
  - Profile setup with medical history and location mapping
- **Status**: ✅ Completed & Verified

### Phase 2: Consultation & Real-Time Media Architecture (Completed)
- **Goal**: Complete scheduling, doctor slot management, booking lifecycle, and WebRTC peer-to-peer encrypted video consultations.
- **Deliverables**:
  - Doctor availability and discrete slot generation
  - Consultation lifecycle (`scheduled` → `in_progress` → `completed` / `cancelled`)
  - WebRTC video consultation with Socket.IO signaling, STUN fallback, and audio-only mode
  - In-call chat and automated email reminders via cron
- **Status**: ✅ Completed & Verified

### Phase 3: Clinical AI Triage & Differential Diagnosis (Completed)
- **Goal**: Implement multi-category disease prediction, explainable fever differential diagnosis, urgency scoring, and dynamic doctor matching.
- **Deliverables**:
  - 5-Category clinical triage ensemble (25 conditions, 86–99% accuracy)
  - 22 Emergency red-flag interceptors with hard-blocking referral modal
  - Fever differential assessment with SHAP TreeExplainer feature attributions
  - Rule-based clinical urgency scoring (1–10 scale)
  - 5-Factor doctor matching utility algorithm
- **Status**: ✅ Completed & Verified

### Phase 4: First-Class Prescription & Clinical Records Lifecycle (Completed)
- **Goal**: Transition prescriptions from unstructured notes to immutable clinical entities with automated lifecycle tracking and vector PDF rendering.
- **Deliverables**:
  - Relational `prescriptions` and `prescription_items` tables
  - Immutability with version-chained amendments (`amendedFromId`, `status: amended`)
  - Deterministic medication lifecycle tracking (`endDate = startDate + duration`)
  - Server-side PDF generation via PDFKit
  - Patient document upload system (lab reports, imaging)
- **Status**: ✅ Completed & Verified

### Phase 5: AI-Powered Longitudinal Patient Health Intelligence (Completed)
- **Goal**: Transform passive patient medical records into an active, multi-visit clinical intelligence layer.
- **Deliverables**:
  - Multi-visit symptom trajectory escalation alerts (e.g. Fever → Fever+Fatigue → Fever+Fatigue+Joint Pain)
  - Time-series linear regression slope calculation for 14 vitals & biomarkers
  - Modified Early Warning Score (MEWS) clinical deterioration engine
  - Comparative Health Parameter Matrix (Current vs Previous vs Baseline with $\Delta$ and %$\Delta$)
  - RAG historical clinical episode retrieval + Llama-3.1-8B-Instruct summary generation
  - 4-tab interactive Recharts clinical visualizer (Pyrexia, BP, SpO2/Glucose, Platelets)
  - Bedside Quick Vitals Logger modal
  - 100% JavaScript zero-downtime fallback engine
- **Status**: ✅ Completed & Verified

---

## Upcoming Milestone (Milestone 2.1)

### Phase 6: Production Hardening, Security & Infrastructure
- **Goal**: Resolve high-priority concerns from codebase mapping (`CONCERNS.md`), eliminate credential exposures, secure uploaded attachments, and optimize ML microservice concurrency.
- **Key Tasks**:
  1. Remove JWT/user profile storage from browser `localStorage` in favor of pure memory tokens.
  2. Implement authorization guards on `/uploads/attachments/` to prevent unauthorized document downloads.
  3. Replace server boot DDL auto-creation with automated Drizzle migration pipelines.
  4. Thread-safe model caching and batch inference memory optimization for Flask.
- **Status**: 📋 Ready for Planning (`/gsd-plan-phase 6` or `/gsd-discuss-phase 6`)

### Phase 7: Clinical Ecosystem & ABDM Interoperability
- **Goal**: Expand national healthcare integration and IoT accessibility.
- **Key Tasks**:
  1. Regional Indian language NLP (Hindi, Marathi, Tamil, Telugu) and voice triage.
  2. WebHID / Bluetooth IoT vitals device connectivity (pulse oximeter, blood pressure cuff).
  3. HL7 FHIR-compliant clinical export and Ayushman Bharat Digital Mission (ABDM) Health ID integration.
- **Status**: 📋 Backlog

