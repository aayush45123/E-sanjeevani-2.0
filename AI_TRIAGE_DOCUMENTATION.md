# AI Triage Feature Documentation

## Overview

The AI Triage system is an intelligent health assessment feature that allows patients to input their symptoms, medical history, and other relevant information. The system analyzes this data using AI algorithms, generates urgency scores, provides preliminary assessments, and automatically matches patients with appropriate doctors if needed.

## Features

### 1. **Symptom Assessment**

- Patients can report multiple symptoms
- Each symptom includes:
  - Symptom name
  - Duration (e.g., "2 days", "1 week")
  - Severity level (mild, moderate, severe)
  - Optional detailed description

### 2. **Medical Profile Collection**

- Medical history
- Current medications
- Known allergies
- Additional notes

### 3. **AI Analysis & Scoring**

- **Urgency Score (0-10)**
  - 0-3: Low urgency (routine consultation)
  - 4-5: Moderate urgency (consult within days)
  - 6-7: High urgency (consult urgently)
  - 8-10: Critical urgency (emergency/auto-doctor matching)

### 4. **Auto Doctor Matching**

- When urgency score > 8:
  - System automatically matches a specialist doctor
  - Matches based on recommended specialties
  - Considers doctor availability, rating, and experience
  - Creates automatic consultation appointment

### 5. **Triage History**

- Patients can view history of all triage sessions
- Each history entry shows:
  - Assessment title
  - Urgency score (color-coded)
  - Assessment date
  - Recommended specialty
  - Doctor assignment status (if applicable)
- Click to view full details

### 6. **Detailed Assessment Report**

- Preliminary AI assessment
- Possible conditions with probabilities
- Recommended medical tests
- Recommended specialties
- Immediate recommendations
- Doctor information (if assigned)

## Backend Architecture

### Models

#### 1. **TriageSession** (`server/src/models/TriageSession.js`)

```javascript
{
  patientId: ObjectId (User),
  symptoms: [{
    symptom: String,
    duration: String,
    severity: String,
    description: String
  }],
  medicalHistory: String,
  currentMedications: String,
  allergies: String,
  additionalNotes: String,
  aiResponse: ObjectId (TriageResponse),
  urgencyScore: Number (0-10),
  status: String (pending, completed, awaiting_doctor, assigned_doctor),
  assignedDoctor: ObjectId (User),
  recommendedSpecialty: String,
  summaryTitle: String,
  summaryDescription: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **TriageResponse** (`server/src/models/TriageResponse.js`)

```javascript
{
  triageSessionId: ObjectId (TriageSession),
  patientId: ObjectId (User),
  symptoms: Array,
  preliminaryAssessment: String,
  possibleConditions: [{
    condition: String,
    probability: Number,
    description: String
  }],
  recommendedTests: [String],
  recommendedSpecialties: [String],
  urgencyScore: Number,
  urgencyLevel: String (low, moderate, high, critical),
  immediateRecommendations: [String],
  lifeStyleAdvice: [String],
  shouldAutoMatchDoctor: Boolean,
  createdAt: Date
}
```

### Services

#### 1. **Urgency Scoring Service** (`server/src/utils/urgencyScoring.js`)

**Functions:**

- `calculateUrgencyScore(symptoms, medicalHistory, age)` - Calculates 0-10 score
- `getUrgencyLevel(score)` - Returns 'critical', 'high', 'moderate', or 'low'
- `getRecommendedTests(symptoms, conditions)` - Suggests medical tests
- `getRecommendedSpecialties(symptoms, urgencyScore)` - Suggests doctor specialties
- `getImmediateRecommendations(urgencyScore, symptoms)` - Provides health recommendations

**Scoring Algorithm:**

- Keyword-based severity detection
- Symptom severity multiplier (mild: 1, moderate: 3, severe: 7)
- Duration consideration (chronic = +1)
- Age factor (children <5 and elderly >60 = +1)
- Maximum cap: 10, minimum: 0

#### 2. **Doctor Matching Service** (`server/src/utils/doctorMatching.js`)

**Functions:**

- `matchDoctorBySpecialty(specialties, urgencyScore)` - Finds best matching doctor
- `calculateDoctorPriority(doctor, urgencyScore, availability)` - Calculates priority score
- `createAutoMatchedConsultation(patientId, matchedDoctor, triageSessionId)` - Books appointment

**Matching Criteria:**

1. Specialty match (required)
2. Availability (within 7 days)
3. Experience level (for critical cases)
4. Rating score
5. Consultation fee
6. Time availability (same day > within 24h > within 3 days, etc.)

### Controllers

#### **triageController.js** (`server/src/controllers/triageController.js`)

**Endpoints:**

1. **POST /api/triage/create**
   - Creates new triage session
   - Validates symptoms
   - Stores patient information
   - Returns: `triageSessionId`

2. **POST /api/triage/process/:triageSessionId**
   - Processes triage and generates AI response
   - Calculates urgency score
   - Creates TriageResponse
   - Auto-matches doctor if score > 8
   - Returns: `triageResponse` and `autoMatchedConsultation` (if applicable)

3. **GET /api/triage/history**
   - Gets patient's triage history (last 10)
   - Returns summaries only (no full responses)
   - Sorted by most recent first

4. **GET /api/triage/details/:triageSessionId**
   - Gets full details of specific triage session
   - Includes all symptoms, assessment, and doctor info
   - Requires session ownership verification

### Routes

**File:** `server/src/routes/triageRoutes.js`

```javascript
POST   /api/triage/create                 - Create triage session
POST   /api/triage/process/:triageSessionId - Process and analyze
GET    /api/triage/history                - Get history summaries
GET    /api/triage/details/:triageSessionId - Get full details
```

All routes require authentication middleware.

## Frontend Architecture

### Components

#### 1. **AiTriage** (`client/src/components/AiTriage/AiTriage.jsx`)

Main component with 4-step flow:

- **Step 1: Symptoms** - Add symptoms with details
- **Step 2: Medical Info** - Enter medical history, medications, allergies
- **Step 3: Review** - Review all information before processing
- **Step 4: Response** - Display AI assessment and auto-matched doctor (if applicable)

**Features:**

- Add/remove multiple symptoms
- Dynamic form validation
- Progress indication
- Loading states
- Error handling

**API Calls:**

- `POST /api/triage/create` - Create session
- `POST /api/triage/process/{triageSessionId}` - Process triage

#### 2. **TriageHistory** (`client/src/components/TriageHistory/TriageHistory.jsx`)

Sidebar component showing triage history:

- Displays last 10 assessments
- Color-coded urgency badges
- Quick summary text
- Specialty tags
- Doctor assignment status
- Responsive scrollable list

**Features:**

- Auto-load on mount
- Click to select (opens detail view)
- Time-based date formatting (Today, Yesterday, etc.)
- Empty state messaging

**API Calls:**

- `GET /api/triage/history` - Fetch history

#### 3. **TriageDetailView** (`client/src/components/TriageDetailView/TriageDetailView.jsx`)

Modal/panel showing full assessment details:

- Complete symptoms with descriptions
- Medical history and medications
- AI preliminary assessment
- Possible conditions with probabilities
- Recommended tests and specialties
- Health recommendations
- Assigned doctor information (if applicable)

**Features:**

- Close button
- Scrollable for long content
- Color-coded sections
- Responsive design

**API Calls:**

- `GET /api/triage/details/{triageSessionId}` - Fetch full details

### Styling

Each component has a corresponding `.module.css` file with:

- Responsive design (mobile-first)
- Color scheme consistency
- Accessibility features
- Smooth transitions
- Color-coded urgency levels

## Integration Guide

### 1. **Update Main App Router**

Add route to `client/src/App.jsx`:

```javascript
import AiTriage from "./components/AiTriage/AiTriage";

// In routes
<Route path="/ai-triage" element={<AiTriage />} />;
```

### 2. **Update Sidebar/Navigation**

Add link in `client/src/components/DoctorSidebar/DoctorSidebar.jsx` or similar:

```javascript
import TriageHistory from "../TriageHistory/TriageHistory";

<TriageHistory onSelectTriage={handleSelectTriage} />;
```

### 3. **Update Server App.js**

Register route in `server/src/app.js`:

```javascript
const triageRoutes = require("./routes/triageRoutes");
app.use("/api/triage", triageRoutes);
```

### 4. **Ensure Authentication**

Middleware must be configured in route handlers.

## API Response Examples

### Create Triage Session

**Request:**

```json
POST /api/triage/create
{
  "symptoms": [
    {
      "symptom": "Fever",
      "duration": "2 days",
      "severity": "moderate",
      "description": "High fever with chills"
    }
  ],
  "medicalHistory": "Diabetes type 2",
  "currentMedications": "Metformin 500mg",
  "allergies": "Penicillin",
  "additionalNotes": "Recently traveled"
}
```

**Response:**

```json
{
  "message": "Triage session created successfully",
  "triageSessionId": "507f1f77bcf86cd799439011",
  "session": {
    /* session object */
  }
}
```

### Process Triage (Low Urgency)

**Request:**

```
POST /api/triage/process/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "message": "Triage completed",
  "triageResponse": {
    "urgencyScore": 3.5,
    "urgencyLevel": "low",
    "preliminaryAssessment": "...",
    "possibleConditions": [
      /* array */
    ],
    "recommendedTests": [
      /* array */
    ],
    "recommendedSpecialties": ["General Physician"],
    "immediateRecommendations": [
      /* array */
    ]
  }
}
```

### Process Triage (High Urgency - Auto-Match)

**Request:**

```
POST /api/triage/process/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "message": "Triage completed. Doctor auto-matched due to high urgency!",
  "triageResponse": {
    /* response object */
  },
  "autoMatchedConsultation": {
    "consultationId": "507f1f77bcf86cd799439012",
    "doctorName": "Dr. Rajesh Kumar",
    "specialization": "Cardiologist",
    "scheduledDate": "2024-05-15T10:00:00Z",
    "scheduledTime": "10:00 AM"
  }
}
```

### Get Triage History

**Request:**

```
GET /api/triage/history
```

**Response:**

```json
{
  "message": "Triage history retrieved",
  "triageHistory": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "summaryTitle": "HIGH: Chest Pain",
      "summaryDescription": "...",
      "urgencyScore": 8.5,
      "urgencyLevel": "high",
      "recommendedSpecialty": "Cardiologist",
      "status": "assigned_doctor",
      "createdAt": "2024-05-10T10:00:00Z",
      "assignedDoctor": {
        "_id": "507f1f77bcf86cd799439014",
        "fullName": "Dr. Rajesh Kumar",
        "specialization": "Cardiologist"
      }
    }
  ]
}
```

## Urgency Score Details

### Critical (8-10): Auto-Match Doctor

- Chest pain
- Difficulty breathing
- Severe bleeding
- Unconsciousness
- Allergic reactions
- Severe injuries
- Multiple severe symptoms

### High (6-7): Urgent Consultation

- Severe headaches
- High fever (>102°F)
- Severe abdominal pain
- Severe dizziness
- Continuous vomiting

### Moderate (4-5): Consult Within Days

- Mild fever (99-101°F)
- Persistent cough
- Sore throat
- Nausea
- General malaise

### Low (0-3): Routine Check

- Minor cold symptoms
- Minor cuts/bruises
- General checkup
- Preventive consultation

## Database Indexes (Recommended)

```javascript
// In TriageSession model
triageSessionSchema.index({ patientId: 1, createdAt: -1 });
triageSessionSchema.index({ status: 1 });
triageSessionSchema.index({ urgencyScore: 1 });

// In TriageResponse model
triageResponseSchema.index({ triageSessionId: 1 });
triageResponseSchema.index({ patientId: 1 });
triageResponseSchema.index({ urgencyScore: -1 });
```

## Error Handling

**Common Errors:**

1. **400 Bad Request** - Missing symptoms
2. **403 Forbidden** - Unauthorized access to session
3. **404 Not Found** - Session not found
4. **500 Server Error** - Processing error

**Client-side:**

- Validation before API calls
- User-friendly error messages
- Loading states
- Retry mechanisms

## Security Considerations

1. **Authentication** - All routes require valid token
2. **Authorization** - Users can only access their own triage sessions
3. **Data Validation** - Input validation on both frontend and backend
4. **Sensitive Data** - Medical data encrypted in transit and at rest
5. **HIPAA Compliance** - Ensure HIPAA compliance for PHI handling

## Future Enhancements

1. **Integration with Real AI/LLM** - Replace dummy AI with actual OpenAI/GPT integration
2. **Advanced Analytics** - Dashboard showing trends and patterns
3. **Drug Interaction Checker** - Check medication interactions
4. **Real-time Doctor Availability** - Live availability sync
5. **Symptom Severity Questionnaire** - More detailed symptom assessment
6. **Follow-up Reminders** - Automated follow-up notifications
7. **Export Reports** - PDF export of assessments
8. **Multi-language Support** - Support for multiple languages
9. **Voice Input** - Voice-based symptom input
10. **Integration with EHR** - Connect with electronic health records

## Testing Recommendations

1. **Unit Tests** - Test urgency scoring algorithm
2. **Integration Tests** - Test API endpoints
3. **E2E Tests** - Test complete triage flow
4. **Load Testing** - Test with multiple concurrent users

## Support & Troubleshooting

**Common Issues:**

1. **Auto-match not working** - Check doctor availability and specialties
2. **History not loading** - Verify authentication and database connection
3. **Score calculation errors** - Verify symptom keywords in urgency scoring service

## File Structure Summary

```
server/
├── models/
│   ├── TriageSession.js
│   └── TriageResponse.js
├── controllers/
│   └── triageController.js
├── routes/
│   └── triageRoutes.js
└── utils/
    ├── urgencyScoring.js
    └── doctorMatching.js

client/
└── src/
    └── components/
        ├── AiTriage/
        │   ├── AiTriage.jsx
        │   └── AiTriage.module.css
        ├── TriageHistory/
        │   ├── TriageHistory.jsx
        │   └── TriageHistory.module.css
        └── TriageDetailView/
            ├── TriageDetailView.jsx
            └── TriageDetailView.module.css
```
