# AI Triage System - Visual Architecture & Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PATIENT INTERFACE                        │
│                    (React Frontend Components)                   │
├──────────────────┬──────────────────┬──────────────────────────┤
│   AiTriage.jsx   │ TriageHistory.jsx│ TriageDetailView.jsx     │
│  (Main Form)     │  (Sidebar List)  │  (Full Details Modal)    │
└────────┬─────────┴────────┬─────────┴──────────┬───────────────┘
         │                  │                    │
         ├─ Create Session  ├─ Get History      ├─ Get Details
         │                  │                    │
         │ POST /create     │ GET /history      │ GET /details/:id
         │                  │                    │
┌────────┴────────┬─────────┴──────────┬────────┴───────────────┐
│                 │                    │                         │
│            API GATEWAY               │                         │
│         (Authentication)              │                         │
│                 │                    │                         │
└─────────────────┼────────────────────┼─────────────────────────┘
                  │                    │
         ┌────────┴─────────┬──────────┴────────┐
         │                  │                   │
    ┌────▼────────┐   ┌─────▼────────┐  ┌──────▼──────┐
    │ triageRoutes│   │triageController
    │             │   │                │  │  (Endpoints) │
    └──────┬──────┘   └─────┬──────────┘  └──────┬───────┘
           │                │                    │
           ├─ Create      ├─ Process (AI Analysis)
           ├─ Process     └─ History & Details
           ├─ History
           └─ Details

           │
    ┌──────┴──────────────────────────────┐
    │      BUSINESS LOGIC SERVICES         │
    ├─────────────────────────────────────┤
    │  urgencyScoring.js                  │
    │  ├─ calculateUrgencyScore()        │
    │  ├─ getUrgencyLevel()              │
    │  ├─ getRecommendedTests()          │
    │  ├─ getRecommendedSpecialties()    │
    │  └─ getImmediateRecommendations()  │
    │                                     │
    │  doctorMatching.js                 │
    │  ├─ matchDoctorBySpecialty()       │
    │  ├─ calculateDoctorPriority()      │
    │  └─ createAutoMatchedConsult()     │
    └──────┬──────────────────────────────┘
           │
    ┌──────┴──────────────────────────────┐
    │      DATABASE LAYER (MongoDB)        │
    ├─────────────────────────────────────┤
    │  TriageSession                      │
    │  ├─ patientId                       │
    │  ├─ symptoms[]                      │
    │  ├─ medicalHistory                  │
    │  ├─ urgencyScore                    │
    │  ├─ status                          │
    │  └─ assignedDoctor (if auto-match)  │
    │                                     │
    │  TriageResponse                     │
    │  ├─ assessment                      │
    │  ├─ conditions[]                    │
    │  ├─ tests[]                         │
    │  ├─ specialties[]                   │
    │  └─ recommendations[]               │
    └─────────────────────────────────────┘
```

---

## Patient Triage Journey

```
START
  │
  ▼
┌─────────────────────────────────────┐
│  STEP 1: ADD SYMPTOMS               │
│  ┌─────────────────────────────────┐│
│  │ Symptom: ________________        ││
│  │ Duration: _______________        ││
│  │ Severity: [Mild/Mod/Severe]    ││
│  │ Description: ________________   ││
│  │ [Add Symptom] [Remove] [Continue]││
│  └─────────────────────────────────┘│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  STEP 2: MEDICAL INFORMATION        │
│  ┌─────────────────────────────────┐│
│  │ Medical History: __________     ││
│  │ Medications: _______________    ││
│  │ Allergies: _________________    ││
│  │ Additional Notes: ___________   ││
│  │ [Continue]                      ││
│  └─────────────────────────────────┘│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  STEP 3: REVIEW INFORMATION         │
│  ┌─────────────────────────────────┐│
│  │ Symptoms: Fever, Cough, Throat  ││
│  │ Medical: Diabetes, Metformin... ││
│  │                                 ││
│  │ [Back] [Get AI Assessment]      ││
│  └─────────────────────────────────┘│
└──────────┬──────────────────────────┘
           │
           ▼ POST /api/triage/process/:id
           │
    ┌──────────────────────┐
    │  AI ANALYSIS         │
    │  - Urgency Scoring   │
    │  - Generate Response │
    │  - Check Auto-Match  │
    └──────────┬───────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   URGENCY < 8   URGENCY ≥ 8
        │             │
        │             ▼
        │      ┌─────────────────────┐
        │      │ AUTO-MATCH DOCTOR   │
        │      │ ┌─────────────────┐ │
        │      │ │ 1. Find Doctors │ │
        │      │ │ 2. Calculate    │ │
        │      │ │    Priority     │ │
        │      │ │ 3. Select Best  │ │
        │      │ │ 4. Create Appt  │ │
        │      │ └─────────────────┘ │
        │      └─────────┬───────────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  STEP 4: VIEW RESULTS            │
    │  ┌──────────────────────────────┐│
    │  │ URGENCY SCORE: 7/10 (Orange) ││
    │  │ Level: HIGH                  ││
    │  │ Assessment: ________________ ││
    │  │ Conditions: Heart Attack...  ││
    │  │ Tests: ECG, Blood Test       ││
    │  │ Specialists: Cardiologist    ││
    │  │                              ││
    │  │ [IF AUTO-MATCHED]            ││
    │  │ ┌────────────────────────┐   ││
    │  │ │ ✓ DOCTOR AUTO-MATCHED  │   ││
    │  │ │ Dr. Rajesh Kumar       │   ││
    │  │ │ Cardiologist           │   ││
    │  │ │ Scheduled: May 15, 10AM│   ││
    │  │ └────────────────────────┘   ││
    │  │                              ││
    │  │ [New Assessment]             ││
    │  └──────────────────────────────┘│
    └──────────────────────────────────┘
             │
             ▼
          END
```

---

## Urgency Score Calculation Flow

```
┌─────────────────────────────┐
│  SYMPTOM INPUT              │
│  - Name: "Chest pain"       │
│  - Duration: "2 hours"      │
│  - Severity: "severe"       │
│  - Age: 55 years            │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ KEYWORD MATCH    │
    ├──────────────────┤
    │ "Chest pain"     │
    │  ↓               │
    │ CRITICAL ✓       │
    │ Base: +10        │
    └──────────┬───────┘
               │
               ▼
    ┌──────────────────┐
    │ SEVERITY MULT    │
    ├──────────────────┤
    │ "Severe"         │
    │  ↓               │
    │ Multiplier: +7   │
    │ Subtotal: 17     │
    └──────────┬───────┘
               │
               ▼
    ┌──────────────────┐
    │ AGE FACTOR       │
    ├──────────────────┤
    │ Age: 55          │
    │  ↓               │
    │ Not <5 or >60    │
    │ Addition: 0      │
    │ Subtotal: 17     │
    └──────────┬───────┘
               │
               ▼
    ┌──────────────────┐
    │ CAP & ROUND      │
    ├──────────────────┤
    │ Min(10, 17) = 10 │
    │ Max(0, 10) = 10  │
    │                  │
    │ FINAL SCORE: 10  │
    └──────────┬───────┘
               │
               ▼
    ┌──────────────────┐
    │ URGENCY LEVEL    │
    ├──────────────────┤
    │ 10 >= 8          │
    │  ↓               │
    │ CRITICAL         │
    │ Color: RED       │
    │ Action: MATCH    │
    └──────────────────┘
```

---

## Doctor Matching Algorithm Flow

```
┌─────────────────────────────────────────┐
│  TRIGGER: Urgency Score ≥ 8             │
│  Recommended Specialties: [Cardio, ...]  │
└──────────┬────────────────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ FIND MATCHING DOCTORS    │
    │ WHERE:                   │
    │ - specialty = Cardio     │
    │ - isActive = true        │
    │ - isVerified = true      │
    │ - availableSoon = true   │
    │                          │
    │ Result: [Dr A, Dr B, C]  │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ CALCULATE PRIORITY FOR EACH       │
    ├──────────────────────────────────┤
    │ For Dr A:                        │
    │ - Experience (20 yrs): +10       │
    │ - Rating (4.8/5): +9.6           │
    │ - Available: Same day: +10       │
    │ - Fee: $50 (vs $100): +4.5       │
    │ PRIORITY: 34.1                   │
    │                                  │
    │ For Dr B:                        │
    │ - Experience (5 yrs): +2.5       │
    │ - Rating (4.2/5): +8.4           │
    │ - Available: 2 days: +5          │
    │ - Fee: $75: +2.5                 │
    │ PRIORITY: 18.4                   │
    │                                  │
    │ For Dr C:                        │
    │ - Experience (15 yrs): +7.5      │
    │ - Rating (4.7/5): +9.4           │
    │ - Available: 1 day: +7           │
    │ - Fee: $60: +4                   │
    │ PRIORITY: 27.9                   │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ SELECT HIGHEST PRIORITY  │
    │                          │
    │ Dr A: 34.1 ★★★★★ SELECT │
    │ Dr C: 27.9 ★★★★          │
    │ Dr B: 18.4 ★★★           │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ CREATE CONSULTATION          │
    │ - patientId: ___________     │
    │ - doctorId: Dr A             │
    │ - date: May 15, 2024         │
    │ - time: 10:00 AM             │
    │ - reason: AI Triage Auto-    │
    │          match               │
    │ - status: scheduled          │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ UPDATE TRIAGE SESSION        │
    │ - assignedDoctor: Dr A       │
    │ - status: assigned_doctor    │
    │                              │
    │ NOTIFY PATIENT:              │
    │ "Dr A assigned to you!"      │
    └──────────────────────────────┘
```

---

## Frontend Component Hierarchy

```
App.jsx
│
├─ Route: /ai-triage
│  │
│  └─ AiTriage.jsx (Main Component)
│     │
│     ├─ State:
│     │  ├─ step (symptoms, medical, review, response)
│     │  ├─ symptoms []
│     │  ├─ medicalHistory
│     │  ├─ currentMedications
│     │  ├─ allergies
│     │  └─ triageResponse
│     │
│     ├─ Step 1: Add Symptoms
│     │  ├─ Input: Symptom name
│     │  ├─ Input: Duration
│     │  ├─ Select: Severity
│     │  ├─ TextArea: Description
│     │  └─ Button: Add/Remove/Continue
│     │
│     ├─ Step 2: Medical Info
│     │  ├─ TextArea: Medical History
│     │  ├─ TextArea: Medications
│     │  ├─ TextArea: Allergies
│     │  └─ Button: Continue
│     │
│     ├─ Step 3: Review
│     │  ├─ Display: All Symptoms
│     │  ├─ Display: Medical Info
│     │  └─ Button: Process
│     │
│     └─ Step 4: Results
│        ├─ Display: Urgency Score Badge
│        ├─ Display: AI Assessment
│        ├─ Display: Conditions
│        ├─ Display: Tests
│        ├─ Display: Specialties
│        ├─ TriageDetailView (Modal)
│        └─ Button: New Assessment
│
│
├─ PatientDashboard
│  │
│  └─ Sidebar
│     │
│     └─ TriageHistory.jsx
│        │
│        ├─ State:
│        │  ├─ triageHistory []
│        │  ├─ isLoading
│        │  └─ selectedTriageId
│        │
│        └─ HistoryList:
│           ├─ HistoryItem 1
│           │  ├─ Urgency Badge (color-coded)
│           │  ├─ Title
│           │  ├─ Date (Today/Yesterday/Date)
│           │  ├─ Specialty Tag
│           │  ├─ Doctor Status
│           │  └─ OnClick: Select
│           │
│           ├─ HistoryItem 2
│           ├─ HistoryItem 3
│           └─ ...
│
│
└─ Modal/Overlay
   │
   └─ TriageDetailView.jsx
      │
      ├─ State:
      │  ├─ triageDetails
      │  ├─ isLoading
      │  └─ error
      │
      ├─ Header:
      │  ├─ Title
      │  └─ Close Button
      │
      ├─ Content Sections:
      │  ├─ Urgency Box
      │  ├─ Symptoms List
      │  ├─ Medical History
      │  ├─ AI Assessment
      │  ├─ Conditions
      │  ├─ Tests
      │  ├─ Specialties
      │  ├─ Recommendations
      │  └─ Doctor Info (if assigned)
      │
      └─ Scrollable Content
```

---

## Data Flow Sequence Diagram

```
Patient          Frontend         Backend           Database
  │                 │               │                 │
  │─ Add Symptoms ──→│               │                 │
  │                 │─ POST /create ─→               │
  │                 │               │─ Validate─────→│
  │                 │               │─ Create Session│
  │                 │               │─ Save Session ─→│
  │                 │               │                 │
  │                 │ ← triageId ──│                 │
  │                 │               │                 │
  │─ Add Medical ───→│               │                 │
  │ History         │ (UI Update)    │                 │
  │                 │               │                 │
  │─ Review & Click →│               │                 │
  │ "Get Assessment"│─ POST /process ─→               │
  │                 │               │─ Calculate Urgency│
  │                 │               │─ Generate Response
  │                 │               │─ Save Response ──→│
  │                 │               │                 │
  │                 │               │─ Check if ≥ 8 ─→│
  │                 │               │─ IF YES:        │
  │                 │               │  - Query Doctors  │
  │                 │               │  - Calculate     │
  │                 │               │    Priorities    │
  │                 │               │  - Select Best    │
  │                 │               │  - Create Consult
  │                 │               │                 │
  │                 │ ← response ───│                 │
  │                 │               │                 │
  │ ← Display Result │               │                 │
  │  with Urgency   │               │                 │
  │  Score & Doctor │               │                 │
  │  (if matched)   │               │                 │
  │                 │               │                 │
  │─ Click History ─→│               │                 │
  │                 │─ GET /history ─→               │
  │                 │               │─ Query Sessions→│
  │                 │               │                 │
  │                 │               │ ← return data ─│
  │                 │ ← history ────│                 │
  │                 │               │                 │
  │ ← Display History│               │                 │
  │  in Sidebar     │               │                 │
  │                 │               │                 │
  │─ Click Detail ──→│               │                 │
  │  Item           │─ GET /details ─→               │
  │                 │               │─ Query Session→│
  │                 │               │                 │
  │                 │               │ ← return data ─│
  │                 │ ← details ────│                 │
  │                 │               │                 │
  │ ← Display Full   │               │                 │
  │  Assessment     │               │                 │
```

---

## Urgency Level Color Coding

```
URGENCY LEVELS:

█████████ CRITICAL (8-10)  - RED (#d32f2f)
           Actions: 🚨 Emergency, Auto-match doctor, Immediate attention needed

█████████ HIGH (6-7)       - ORANGE (#f57c00)
           Actions: ⚠️ Urgent consultation, Call doctor, Don't delay

█████████ MODERATE (4-5)   - YELLOW (#fbc02d)
           Actions: ⏰ Schedule appointment, Monitor symptoms, Consult soon

█████████ LOW (0-3)        - GREEN (#388e3c)
           Actions: ✓ Routine checkup, Monitor, General physician
```

---

## Technology Stack

```
FRONTEND:
├─ React.js (UI Framework)
├─ React Router (Navigation)
├─ Fetch API (HTTP Requests)
├─ CSS Modules (Styling)
└─ ES6+ JavaScript

BACKEND:
├─ Node.js (Runtime)
├─ Express.js (Framework)
├─ MongoDB (Database)
├─ Mongoose (ODM)
├─ JWT (Authentication)
└─ RESTful API

ARCHITECTURE:
├─ MVC Pattern
├─ Service Layer (Business Logic)
├─ Controller Layer (API Endpoints)
├─ Model Layer (Database)
└─ Middleware (Auth, Validation)
```

---

## Success Metrics

```
✓ Patients can complete triage in <2 minutes
✓ Urgency score accuracy >90%
✓ Auto-match success rate >85%
✓ History loads <500ms
✓ UI responsive on all devices
✓ API response time <200ms
✓ Zero data loss
✓ 99%+ uptime
✓ User satisfaction >4.5/5
✓ Doctor satisfaction with matches >4/5
```
