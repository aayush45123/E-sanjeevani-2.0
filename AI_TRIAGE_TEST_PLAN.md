# AI Triage - Test Plan & Test Cases

## Test Scenarios

### 1. CREATE TRIAGE SESSION

#### TC-1.1: Create Session with Single Symptom

**Precondition:** User is authenticated
**Steps:**

1. Navigate to AI Triage page
2. Enter symptom: "Headache"
3. Duration: "1 day"
4. Severity: "mild"
5. Click "Add Symptom"
6. Click "Continue"

**Expected Result:**

- Symptom added to list
- Session created successfully
- Redirects to review page
- triageSessionId returned

#### TC-1.2: Create Session with Multiple Symptoms

**Precondition:** User is authenticated
**Steps:**

1. Add first symptom: "Fever" (moderate, "2 days")
2. Add second symptom: "Cough" (mild, "2 days")
3. Add third symptom: "Sore throat" (moderate, "1 day")
4. Click "Continue"

**Expected Result:**

- All three symptoms displayed in review
- Session created with ID
- All data saved correctly

#### TC-1.3: Create Session with Medical History

**Precondition:** User is authenticated
**Steps:**

1. Add symptom: "Chest pain"
2. Fill Medical History: "History of heart disease"
3. Fill Medications: "Aspirin 100mg daily"
4. Fill Allergies: "Penicillin"
5. Click "Continue"

**Expected Result:**

- All medical information saved
- Session created successfully
- Medical data appears in review

#### TC-1.4: Validation - No Symptoms

**Steps:**

1. Try to click "Continue" without adding symptoms

**Expected Result:**

- Error message: "Please add at least one symptom"
- Session not created
- User stays on form

#### TC-1.5: Remove Symptom

**Steps:**

1. Add symptom "Fever"
2. Add symptom "Cough"
3. Click remove button on "Fever"

**Expected Result:**

- "Fever" removed from list
- "Cough" remains
- Count updated to 1 symptom

### 2. PROCESS TRIAGE & AI ANALYSIS

#### TC-2.1: Low Urgency Assessment

**Precondition:** Triage session created with mild symptoms
**Symptom:** "Mild cold", "Runny nose" (mild severity)
**Steps:**

1. Click "Get AI Assessment"
2. Wait for processing

**Expected Result:**

- Urgency Score: 0-3 (green badge)
- Urgency Level: "LOW"
- Assessment: "Routine consultation recommended"
- No doctor auto-matched
- Possible conditions shown
- Recommended tests displayed

#### TC-2.2: Moderate Urgency Assessment

**Precondition:** Triage session created with moderate symptoms
**Symptom:** "Fever" (moderate, "2 days"), "Body ache"
**Steps:**

1. Click "Get AI Assessment"

**Expected Result:**

- Urgency Score: 4-5 (yellow badge)
- Urgency Level: "MODERATE"
- Assessment: "Consult doctor within 2-3 days"
- No auto-match
- Recommendations provided

#### TC-2.3: High Urgency Assessment

**Precondition:** Triage session created with severe symptoms
**Symptoms:** "Severe headache", "High fever", "Neck stiffness"
**Steps:**

1. Click "Get AI Assessment"

**Expected Result:**

- Urgency Score: 6-7 (orange badge)
- Urgency Level: "HIGH"
- Assessment: "Urgent consultation needed"
- No auto-match (score < 8)
- Urgent recommendations shown

#### TC-2.4: Critical Urgency - Auto-Match Doctor

**Precondition:** Triage session created with critical symptoms
**Symptoms:** "Chest pain" (severe), "Difficulty breathing" (severe)
**Steps:**

1. Click "Get AI Assessment"
2. Wait for processing

**Expected Result:**

- Urgency Score: 8-10 (red badge)
- Urgency Level: "CRITICAL"
- "Doctor Auto-Matched" box appears
- Doctor name, specialty, scheduled time shown
- Automatically matched to available Cardiologist
- Status shows "assigned_doctor"

#### TC-2.5: Possible Conditions Display

**Steps:**

1. Complete triage with chest pain symptoms
2. Review response

**Expected Result:**

- Section "Possible Conditions" shows
- Multiple conditions listed (e.g., "Heart Attack", "Angina", "Muscle Strain")
- Each shows probability percentage and description
- Sorted by likelihood

#### TC-2.6: Recommended Tests Display

**Steps:**

1. Complete triage with fever symptoms
2. Review response

**Expected Result:**

- "Recommended Tests" section shown
- Tests appropriate to symptoms (e.g., "Blood Test", "Chest X-ray")
- Tests listed as bullet points
- Relevant to suspected conditions

#### TC-2.7: Specialty Recommendations

**Steps:**

1. Complete triage with joint pain
2. Review response

**Expected Result:**

- "Recommended Specialties" shown as tags
- Relevant specialties tagged (e.g., "Orthopedic", "Rheumatologist")
- Multiple specialties if needed

### 3. TRIAGE HISTORY

#### TC-3.1: View Triage History

**Precondition:** Patient has completed at least 1 triage
**Steps:**

1. Check sidebar TriageHistory component
2. View history list

**Expected Result:**

- History list populated
- Shows latest triage first
- Displays:
  - Urgency score badge (color-coded)
  - Assessment title
  - Assessment date
  - Specialty tag
  - Doctor assignment status (if applicable)

#### TC-3.2: History Entry Formatting

**Steps:**

1. Complete triage session
2. View in history immediately

**Expected Result:**

- Date shows as "Today" with time
- Next day shows as "Yesterday"
- Older shows as "Jan 10, 2024"
- Count badge shows total assessments

#### TC-3.3: Select History Entry

**Precondition:** At least 1 triage in history
**Steps:**

1. Click on history entry
2. Verify detail view opens

**Expected Result:**

- Entry highlights (active state)
- Selected triageId passed to parent
- Detail view can be opened

#### TC-3.4: Empty History State

**Precondition:** New patient with no triage sessions
**Steps:**

1. Check TriageHistory component

**Expected Result:**

- Empty message displayed: "No triage assessments yet"
- Helpful tip shown: "Your assessment history will appear here"
- No crash, graceful empty state

#### TC-3.5: Multiple History Entries

**Precondition:** Patient completed 5 triage sessions
**Steps:**

1. Create 5 different assessments
2. View history

**Expected Result:**

- All 5 entries displayed
- Sorted by date (newest first)
- Scrollable if > 6 items
- Each shows correct urgency score

#### TC-3.6: Color-Coded Urgency Badges

**Steps:**

1. View history with different urgency scores
   - Score 2: Green badge
   - Score 5: Yellow badge
   - Score 7: Orange badge
   - Score 9: Red badge

**Expected Result:**

- Each badge correct color
- Color consistent with score level

### 4. DETAIL VIEW

#### TC-4.1: View Full Assessment Details

**Precondition:** Triage completed and history available
**Steps:**

1. Click on history entry
2. Detail view loads

**Expected Result:**

- Full assessment displayed
- All sections visible:
  - Title
  - Urgency score
  - Assessment date
  - Symptoms with descriptions
  - Medical history
  - Medications
  - Allergies
  - AI assessment text
  - Possible conditions
  - Recommended tests
  - Specialty recommendations
  - Health recommendations

#### TC-4.2: Close Detail View

**Steps:**

1. Open detail view
2. Click close button (×)

**Expected Result:**

- Detail view closes
- Returns to previous view
- History selection cleared

#### TC-4.3: Detail View with Auto-Matched Doctor

**Precondition:** High urgency triage with auto-matched doctor
**Steps:**

1. Click high-urgency history entry
2. Scroll to doctor section

**Expected Result:**

- "Doctor Assigned" section shown
- Doctor name displayed
- Specialization shown
- Rating displayed (if available)
- Consultation time visible

#### TC-4.4: Detail View Scrolling

**Precondition:** Long assessment with many details
**Steps:**

1. Open detail view
2. Scroll through all content

**Expected Result:**

- Smooth scrolling
- All content accessible
- No content cut off
- Responsive on mobile

#### TC-4.5: Detail View - Symptoms Display

**Steps:**

1. View detail with multiple symptoms
2. Check symptoms section

**Expected Result:**

- Each symptom clearly displayed
- Symptom name, duration, severity shown
- Description (if provided) shown
- Color-coded severity

### 5. AUTO-MATCHING LOGIC

#### TC-5.1: Auto-Match Trigger

**Precondition:** System configured with available doctors
**Symptoms:** Critical urgency (score > 8)
**Steps:**

1. Enter chest pain (severe) + difficulty breathing (severe)
2. Process triage

**Expected Result:**

- Urgency score calculated as > 8
- shouldAutoMatchDoctor = true
- Doctor matching algorithm runs
- Most qualified doctor selected

#### TC-5.2: Doctor Selection Criteria

**Precondition:** Multiple cardiologists available
**Steps:**

1. Auto-match for heart symptoms
2. System evaluates doctors

**Expected Result:**

- Cardiologist selected (specialty match)
- Most experienced doctor prioritized
- Highest rated doctor preferred
- Nearest available slot selected
- Available within 24-48 hours preferred

#### TC-5.3: Consultation Auto-Creation

**Precondition:** Auto-match triggered
**Steps:**

1. System auto-matches doctor
2. Consultation appointment created

**Expected Result:**

- Consultation record created
- PatientId = current patient
- DoctorId = matched doctor
- Status = "scheduled"
- Scheduled date/time set
- Availability slot updated

#### TC-5.4: No Available Doctor

**Precondition:** No doctors with matching specialty available
**Symptoms:** Critical urgency
**Steps:**

1. All matching specialty doctors unavailable
2. Auto-match runs

**Expected Result:**

- No doctor matched
- Session status remains "completed"
- User can manually search for doctor
- Message: "No doctors available right now"
- Recommend consulting emergency

#### TC-5.5: Multiple Specialty Recommendations

**Precondition:** Symptoms suggest multiple specialties
**Symptoms:** "Chest pain" + "Severe anxiety"
**Steps:**

1. Process triage with auto-match

**Expected Result:**

- Recommended specialties: ["Cardiologist", "Psychiatrist"]
- Primary specialty prioritized (Cardiologist)
- Cardiologist matched
- Other specialties shown in recommendations

### 6. ERROR HANDLING

#### TC-6.1: Network Error During Session Creation

**Steps:**

1. Disconnect network
2. Try to create triage session
3. Observe error handling

**Expected Result:**

- Error message displayed: "Error creating triage session"
- Form not cleared
- User can retry

#### TC-6.2: Timeout During Processing

**Steps:**

1. Simulate slow server response
2. Click "Get AI Assessment"
3. Wait for timeout

**Expected Result:**

- Loading indicator shown
- Timeout error handled gracefully
- Retry option available
- No page crash

#### TC-6.3: Invalid Token

**Precondition:** Token expired or invalid
**Steps:**

1. Try API call with invalid token
2. Observe response

**Expected Result:**

- 401 Unauthorized error
- User redirected to login
- Session cleared

#### TC-6.4: Unauthorized Access

**Steps:**

1. Try to access another user's triage detail
2. Use another patient's triageSessionId

**Expected Result:**

- 403 Forbidden error
- Error message: "Unauthorized"
- Detail not displayed

#### TC-6.5: Validation Error - Empty Symptom

**Steps:**

1. Try to add symptom with empty name
2. Keep severity and duration blank

**Expected Result:**

- Validation prevents submission
- Error message shown
- Form not submitted

### 7. PERFORMANCE & STRESS TESTING

#### TC-7.1: Load History with 100+ Assessments

**Precondition:** Patient has 100+ triage sessions
**Steps:**

1. Load history
2. Check loading time

**Expected Result:**

- Limited to last 10 (for performance)
- Quick load < 1 second
- Pagination implemented

#### TC-7.2: Concurrent Sessions

**Steps:**

1. Multiple users create triage simultaneously
2. Process 10 concurrent requests

**Expected Result:**

- All sessions processed
- No data loss
- Correct data for each user
- No timeouts

#### TC-7.3: Large Medical History Text

**Steps:**

1. Paste 5000 character medical history
2. Create session

**Expected Result:**

- Text accepted
- Session created
- No truncation
- Data saved correctly

### 8. UI/UX TESTING

#### TC-8.1: Mobile Responsiveness

**Steps:**

1. Test on mobile (375px width)
2. Navigate through triage flow

**Expected Result:**

- All elements visible
- No horizontal scroll
- Buttons clickable
- Form fields usable
- History scrolls properly

#### TC-8.2: Tablet Responsiveness

**Steps:**

1. Test on tablet (768px width)
2. Navigate through triage flow

**Expected Result:**

- Layout optimized for tablet
- Two-column layout where appropriate
- Touch-friendly button sizes

#### TC-8.3: Color Contrast

**Steps:**

1. Check color combinations
2. Verify accessibility

**Expected Result:**

- Text readable (WCAG AA standard)
- Color-blind friendly (no red-green only)
- Urgency badges distinct

#### TC-8.4: Form Input Validation Feedback

**Steps:**

1. Try various invalid inputs
2. Check feedback messages

**Expected Result:**

- Clear error messages
- Error messages appear inline
- Highlighting of problematic fields

#### TC-8.5: Loading States

**Steps:**

1. Observe UI during API calls
2. Check loading indicators

**Expected Result:**

- Loading spinner visible
- Buttons disabled during processing
- "Processing..." text shown
- User prevented from double-submit

## Edge Cases

### Edge Case 1: User No Longer Exists

- Patient deleted but triage history remains
- Should handle gracefully

### Edge Case 2: Symptom with Special Characters

- Unicode characters in symptom
- Should save and display correctly

### Edge Case 3: Very Old Triage Session

- Session from 2020
- Should display correctly with proper date formatting

### Edge Case 4: Rapid Consecutive Requests

- User clicks "Get Assessment" multiple times quickly
- Should handle race conditions

### Edge Case 5: Maximum Symptom Limit

- User adds 50+ symptoms
- Should handle or limit gracefully

## Test Data

### Sample Test Accounts

```
Patient 1: patient@test.com / password123
Patient 2: patient2@test.com / password123
Doctor 1: doc1@test.com / password123 (Cardiologist)
Doctor 2: doc2@test.com / password123 (Neurologist)
Doctor 3: doc3@test.com / password123 (Pulmonologist)
```

### Sample Symptom Combinations

**Low Urgency:**

- Runny nose + mild cough
- Minor cut + small bruise
- General tiredness

**Moderate Urgency:**

- Fever 100°F + cough
- Mild headache + nausea
- Joint pain

**High Urgency:**

- Fever 103°F + severe cough + body ache
- Severe headache + neck stiffness
- Severe abdominal pain + vomiting

**Critical Urgency:**

- Chest pain + shortness of breath + dizziness
- Loss of consciousness
- Severe bleeding + shock symptoms
- Difficulty breathing + wheezing

## Test Execution Matrix

| Test Case | Backend | Frontend | Database | Integration | Status |
| --------- | ------- | -------- | -------- | ----------- | ------ |
| TC-1.1    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-1.2    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-2.1    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-2.4    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-3.1    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-4.1    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-5.1    | ✓       | ✓        | ✓        | ✓           | READY  |
| TC-8.1    | -       | ✓        | -        | ✓           | READY  |

## Known Limitations & Notes

1. **AI Assessment** - Currently using keyword-based scoring. Should be replaced with actual AI/ML model
2. **Real-time Updates** - History doesn't auto-refresh. User must refresh page
3. **Doctor Availability** - Depends on proper availability setup
4. **Notification** - No email/SMS notifications yet
5. **Export** - No PDF export feature yet

## Sign-off

- **QA Lead:** ********\_********
- **Development Lead:** ********\_********
- **Product Owner:** ********\_********
- **Date:** ********\_********
