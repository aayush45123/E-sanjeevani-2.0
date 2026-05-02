# AI Triage - Implementation Quick Start

## Quick Setup Steps

### Backend Integration

#### Step 1: Add Route to Server

**File:** `server/src/app.js`

Add this line where other routes are defined:

```javascript
const triageRoutes = require("./routes/triageRoutes");
app.use("/api/triage", triageRoutes);
```

**Complete example:**

```javascript
// app.js
const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const triageRoutes = require("./routes/triageRoutes"); // Add this

app.use("/api/auth", authRoutes);
app.use("/api/triage", triageRoutes); // Add this

module.exports = app;
```

#### Step 2: Verify Models Exist

Ensure these files are created in `server/src/models/`:

- ✓ `TriageSession.js`
- ✓ `TriageResponse.js`

#### Step 3: Verify Services Exist

Ensure these files are created in `server/src/utils/`:

- ✓ `urgencyScoring.js`
- ✓ `doctorMatching.js`

#### Step 4: Verify Controller Exists

- ✓ `server/src/controllers/triageController.js`

#### Step 5: Verify Routes Exist

- ✓ `server/src/routes/triageRoutes.js`

### Frontend Integration

#### Step 1: Add Route to App

**File:** `client/src/App.jsx`

Add import:

```javascript
import AiTriage from "./components/AiTriage/AiTriage";
```

Add route (in your Routes/Router config):

```javascript
<Route path="/ai-triage" element={<AiTriage />} />
```

#### Step 2: Add Triage to Sidebar (Optional)

**File:** `client/src/components/[YourSidebarComponent]/[YourSidebarComponent].jsx`

Add import:

```javascript
import TriageHistory from "../TriageHistory/TriageHistory";
```

Add component in sidebar JSX (in left panel):

```jsx
{
  /* Triage History Section */
}
<div style={{ marginTop: "20px" }}>
  <TriageHistory
    onSelectTriage={(triageId) => {
      // Handle triage selection if needed
      console.log("Selected triage:", triageId);
    }}
  />
</div>;
```

#### Step 3: Create Navigation Link (Optional)

Add link to navbar/menu pointing to `/ai-triage`:

```javascript
<Link to="/ai-triage">AI Triage</Link>
```

### Database Setup (Optional)

If you want to add indexes for better performance, update your models:

**TriageSession.js** - Add after schema definition:

```javascript
triageSessionSchema.index({ patientId: 1, createdAt: -1 });
triageSessionSchema.index({ status: 1 });
triageSessionSchema.index({ urgencyScore: 1 });
```

**TriageResponse.js** - Add after schema definition:

```javascript
triageResponseSchema.index({ triageSessionId: 1 });
triageResponseSchema.index({ patientId: 1 });
triageResponseSchema.index({ urgencyScore: -1 });
```

### Testing the Integration

1. **Start Backend Server**

   ```bash
   cd server
   npm start
   ```

2. **Start Frontend Dev Server**

   ```bash
   cd client
   npm run dev
   ```

3. **Test the Flow**
   - Navigate to `http://localhost:5173/ai-triage` (or your frontend URL)
   - Add a symptom (e.g., "Chest pain" with "severe" severity)
   - Fill in optional medical history
   - Click "Continue"
   - Review information
   - Click "Get AI Assessment"
   - View results with urgency score

4. **Test Auto-Match (High Urgency)**
   - Add multiple severe symptoms (e.g., "Chest pain", "Difficulty breathing")
   - If urgency score ≥ 8, a doctor should be auto-matched
   - Look for the "Doctor Auto-Matched" section in results

5. **Test History**
   - Create multiple triage assessments
   - Check sidebar for TriageHistory component
   - Click on history items to view details

## API Testing with cURL

### Create Triage Session

```bash
curl -X POST http://localhost:5000/api/triage/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symptoms": [
      {
        "symptom": "Fever",
        "duration": "2 days",
        "severity": "moderate",
        "description": "High fever with chills"
      }
    ],
    "medicalHistory": "Diabetes",
    "currentMedications": "Metformin",
    "allergies": "Penicillin"
  }'
```

### Process Triage

```bash
curl -X POST http://localhost:5000/api/triage/process/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get History

```bash
curl -X GET http://localhost:5000/api/triage/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Details

```bash
curl -X GET http://localhost:5000/api/triage/details/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Urgency Score Testing

### Test Low Urgency (0-3)

Symptoms: "Mild cold", "Runny nose"
Expected: Low urgency, routine consultation

### Test Moderate Urgency (4-5)

Symptoms: "Fever" (moderate severity, "2 days")
Expected: Moderate urgency, consult within days

### Test High Urgency (6-7)

Symptoms: "Severe headache", "High fever", "Neck stiffness"
Expected: High urgency, urgent consultation recommended

### Test Critical Urgency (8-10) - Auto-Match

Symptoms: "Chest pain" (severe), "Difficulty breathing" (severe)
Expected: Critical urgency (≥8), doctor auto-matched

## Troubleshooting

### Issue: 404 Not Found on /api/triage/create

**Solution:**

- Verify routes are registered in `server/src/app.js`
- Check server is running on correct port
- Verify authentication middleware is not blocking requests

### Issue: Token not recognized

**Solution:**

- Ensure `Authorization: Bearer TOKEN` header is correct
- Verify token is valid and not expired
- Check middleware configuration

### Issue: Auto-match not working

**Solution:**

- Verify `urgencyScore > 8`
- Check if doctors exist in database
- Verify doctor availability is set up
- Check DoctorProfile and DoctorAvailability models

### Issue: History showing empty

**Solution:**

- Verify TriageSession records are saved to database
- Check patientId is correct
- Verify authentication is working
- Check MongoDB connection

### Issue: CSS not loading properly

**Solution:**

- Verify `.module.css` imports are correct
- Check CSS module names match component
- Clear browser cache
- Check dev server is running

## Performance Tips

1. **Pagination** - For users with many triage sessions, implement pagination in history
2. **Caching** - Cache history on frontend to reduce API calls
3. **Database Indexes** - Add indexes as mentioned above
4. **Lazy Loading** - Load TriageDetailView only when clicked

## Security Checklist

- [x] Authentication required on all routes
- [x] Authorization - users can only see their own data
- [x] Input validation on symptom data
- [x] Error messages don't leak sensitive info
- [x] Token validation in middleware
- [x] CORS properly configured

## Next Steps

1. ✓ Integrate with real AI/LLM (OpenAI API, etc.)
2. ✓ Add email notifications for auto-matched consultations
3. ✓ Add SMS notifications
4. ✓ Create admin dashboard for triage analytics
5. ✓ Add follow-up consultation scheduling
6. ✓ Implement triage report export as PDF
7. ✓ Add multilingual support

## Files Created

### Backend

- ✓ `server/src/models/TriageSession.js`
- ✓ `server/src/models/TriageResponse.js`
- ✓ `server/src/controllers/triageController.js`
- ✓ `server/src/routes/triageRoutes.js`
- ✓ `server/src/utils/urgencyScoring.js`
- ✓ `server/src/utils/doctorMatching.js`

### Frontend

- ✓ `client/src/components/AiTriage/AiTriage.jsx`
- ✓ `client/src/components/AiTriage/AiTriage.module.css`
- ✓ `client/src/components/TriageHistory/TriageHistory.jsx`
- ✓ `client/src/components/TriageHistory/TriageHistory.module.css`
- ✓ `client/src/components/TriageDetailView/TriageDetailView.jsx`
- ✓ `client/src/components/TriageDetailView/TriageDetailView.module.css`

### Documentation

- ✓ `AI_TRIAGE_DOCUMENTATION.md`
- ✓ `AI_TRIAGE_QUICKSTART.md` (this file)

## Support

For issues or questions, refer to:

1. `AI_TRIAGE_DOCUMENTATION.md` - Detailed documentation
2. Code comments in individual files
3. Error messages in browser console
4. Server logs for API errors
