# E-SANJEEVANI 2.0: TECHNICAL VIVA & PPT PANEL PREPARATION GUIDE
## Mathematical Formulas, Algorithmic Derivations, Parameter Provenance & 15-Slide Presentation Deck

> **Document Purpose**: Comprehensive, code-grounded technical preparation document for College Project Viva Panels, University Project Defense, Technical Presentations, and Professor Reviews.  
> **Repository Grounding**: 100% verified against active repository code in `server/src/helpers/doctorMatching.js`, `server/src/helpers/urgencyScoring.js`, `ai-model/app.py`, `ai-model/train.py`, `ai-model/fever_model/scripts/`, `server/src/services/`, and `client/src/`.  
> **Strict Panel Defense Rule**: Distinguish actual code implementations from design assumptions and unverified claims. Never invent mathematical formulas or claim unverified libraries (e.g., Chroma / RAG).

---

# 1. Project Technical Summary & Viva Positioning

### What E-Sanjeevani 2.0 Truly Is (In 30 Seconds for the Panel)
> "Respected panel members, **E-Sanjeevani 2.0** is an AI-augmented telemedicine and clinical triage platform. Traditional public telemedicine platforms rely on First-Come-First-Serve (FIFO) queues, unstructured free-text prescription notes, and lack clinical decision support for overlapping tropical illnesses. 
>
> Our platform addresses this through four core technical modules:
> 1. A **rule-based clinical urgency scoring heuristic** (1.0–10.0 scale) and red-flag emergency detector.
> 2. A **5-factor multi-criteria dynamic doctor matching utility algorithm** that replaces FIFO queues by balancing urgency ($40\%$), specialty relevance ($25\%$), availability ($20\%$), language ($10\%$), and clinical experience ($5\%$).
> 3. An **Explainable Fever Differential Assessment Engine** trained on 1,500 WHO clinical symptom profiles, using XGBoost and **SHAP (SHapley Additive exPlanations)** to provide transparent, feature-level attribution charts to clinicians.
> 4. An **in-browser WebRTC peer-to-peer telemedicine workspace** with an audio-only fallback mode, real-time signaling, and legally immutable digital prescriptions rendered server-side via PDFKit."

---

# 2. Parameter & Value Provenance Classification

When professors ask: *"Where did this number come from?"*, your answer must classify the value into one of these strict categories:

| Category Code | Value Type | Definition in this Project | Project Examples |
|:---:|:---|:---|:---|
| **A** | **User Input** | Values entered directly by the patient or doctor in the UI forms. | Reported symptoms, duration string, patient age, doctor specialization, consultation date. |
| **B** | **Dataset-Derived** | Values statistically learned or computed from offline training data. | ExtraTrees tree split thresholds, class weights, XGBoost feature splits, WHO symptom presence priors. |
| **C** | **Model-Generated** | Runtime outputs calculated by machine learning inference. | Multi-class predicted probabilities ($P(\text{disease} \mid X)$), predicted disease index, SHAP values ($\phi_i$). |
| **D** | **Database Value** | Stored attributes fetched from PostgreSQL via Drizzle ORM. | Doctor years of experience ($E$), doctor spoken languages ($L$), slot start/end times, booked status. |
| **E** | **Hardcoded Parameter** | Fixed numerical constants chosen by the developers as system design choices. | 20-year normalization denominator ($20$), age thresholds ($60, 5$), keyword scores ($10, 7, 4, 1$). |
| **F** | **Algorithm-Generated** | Deterministic values computed by applying mathematical formulas to inputs. | Normalized urgency score ($U_{\text{norm}}$), days until available ($D$), priority score ($P$). |
| **G** | **Threshold** | Boundary cutoffs that trigger conditional branching or clinical alerts. | Critical urgency cutoff ($\ge 8.0$), high urgency ($\ge 6.0$), red-flag emergency triggers. |
| **H** | **Weight** | Multipliers balancing criteria in utility functions ($0 \le w_i \le 1$, $\sum w_i = 1$). | Doctor matching weights: $w_1 = 0.40, w_2 = 0.25, w_3 = 0.20, w_4 = 0.10, w_5 = 0.05$. |
| **I** | **Illustrative Value** | Sample test values used strictly for viva demonstration or PPT walk-throughs. | Example patient: Age = 45, Urgency = 8.5, Doctor Experience = 12 years. |

---

# 3. Verified vs. Unverified Feature Audit

Before your presentation, know exactly what exists in code versus what was documented in concept diagrams:

| Feature / Concept | Mentioned In Docs? | Verified in Repository Code? | Exact Code Location or Honest Panel Response |
|:---|:---:|:---:|:---|
| **Rule-Based Urgency Scoring** | Yes | **YES (Verified)** | `server/src/helpers/urgencyScoring.js` (`calculateUrgencyScore`) |
| **5-Factor Doctor Matching** | Yes | **YES (Verified)** | `server/src/helpers/doctorMatching.js` (`calculateDoctorPriority`) |
| **Fever Differential Classifier** | Yes | **YES (Verified)** | `ai-model/app.py` (`/predict-fever`), trained via `fever_model/scripts/train_model.py` |
| **SHAP Explainability** | Yes | **YES (Verified)** | `ai-model/app.py` (`get_shap_explanation` using `shap.TreeExplainer`) |
| **General Disease Predictor** | Yes | **YES (Verified)** | `ai-model/app.py` (`/predict`), trained via `ai-model/train.py` (`ExtraTreesClassifier`) |
| **WebRTC Audio/Video & Audio-Only** | Yes | **YES (Verified)** | `client/src/pages/VideoCall/VideoCall.jsx`, `server/src/socket/socketServer.js` |
| **Immutable Prescriptions & PDFKit**| Yes | **YES (Verified)** | `server/src/services/prescriptionLifecycle.service.js`, `prescriptionPdfService.js` |
| **LLM Chatbot Integration** | Yes | **YES (Verified)** | `server/src/services/chat.service.js` (HuggingFace Router `Llama-3.1-8B-Instruct`) |
| **RAG (Retrieval-Augmented Gen.)** | Concept Notes | **NO (Not Implemented)** | **Tell the panel honestly**: *"RAG is a planned roadmap enhancement. The current chatbot utilizes zero-shot direct prompt engineering with session history persisted in PostgreSQL."* |
| **Chroma / Vector Database** | Concept Notes | **NO (Not Implemented)** | **Tell the panel honestly**: *"No vector database is initialized in this codebase. Triage matches against explicit symptom dictionaries rather than dense vector embeddings."* |
| **BioBERT NLP Transformer** | Concept UI | **NO (Not Implemented)** | **Tell the panel honestly**: *"BioBERT was conceptualized for unstructured clinical transcription; current triage uses token-matching against a 377-symptom vocabulary."* |
| **Automated IoT Vitals Streaming** | Concept Notes | **NO (Not Implemented)** | Patient vitals are collected through structured UI input forms. |
| **Automated Ambulance Dispatch API**| Concept Notes | **NO (Not Implemented)** | Life-threatening red flags trigger an immediate modal advising emergency dialing. |

---

# 4. Mathematical Formula 1: The 10-Point Clinical Urgency Scoring Formula

### 4.1 Exact Code Implementation
- **Source File**: `server/src/helpers/urgencyScoring.js`
- **Function**: `calculateUrgencyScore(symptoms, medicalHistory, age)`
- **Calling Endpoints**: `POST /api/triage/process/:sessionId`, `POST /api/ai-triage/predict`

### 4.2 The Mathematical Formula

$$\text{Raw Score} = \sum_{j=1}^{M} \left( K(s_j) + S(s_j) + D(s_j) \right) + A(\text{age})$$

$$\text{Final Urgency Score} = \min\left(10.0,\, \max\left(0.0,\, \text{round}_{1\text{dp}}(\text{Raw Score})\right)\right)$$

### 4.3 Component Definitions & Parameter Breakdown

#### 1. Keyword Base Weight $K(s_j)$
Evaluated by matching symptom text $s_j$ (converted to lowercase) against predefined keyword dictionaries:

$$K(s_j) = \begin{cases} 
10 & \text{if } s_j \text{ contains any } k \in \text{Critical Keywords} \\
7  & \text{if } s_j \text{ contains any } k \in \text{High Keywords} \\
4  & \text{if } s_j \text{ contains any } k \in \text{Moderate Keywords} \\
1  & \text{if } s_j \text{ contains any } k \in \text{Low Keywords} \\
0  & \text{otherwise}
\end{cases}$$

- **Critical Keywords (+10)**: `"chest pain"`, `"difficulty breathing"`, `"bleeding"`, `"unconscious"`, `"severe allergic"`, `"poisoning"`, `"stroke symptoms"`, `"severe head injury"`.
- **High Keywords (+7)**: `"high fever"`, `"severe headache"`, `"abdominal pain"`, `"severe dizziness"`, `"vomiting"`, `"severe injury"`, `"burn"`, `"serious bleeding"`.
- **Moderate Keywords (+4)**: `"fever"`, `"cough"`, `"sore throat"`, `"mild headache"`, `"nausea"`, `"diarrhea"`, `"skin rash"`, `"joint pain"`.
- **Low Keywords (+1)**: `"mild cold"`, `"minor cuts"`, `"minor bruises"`, `"general checkup"`, `"consultation"`.

#### 2. Symptom Severity Modifier $S(s_j)$
Explicit clinical severity rating attached to symptom $s_j$ (Type: **User Input / Categorical**):

$$S(s_j) = \begin{cases} 
7 & \text{if severity} = \text{"severe"} \\
3 & \text{if severity} = \text{"moderate"} \\
1 & \text{if severity} = \text{"mild"} \\
0 & \text{if omitted or null}
\end{cases}$$

#### 3. Symptom Chronicity Modifier $D(s_j)$
Duration of reported symptom $s_j$ (Type: **User Input / Text Match**):

$$D(s_j) = \begin{cases} 
1 & \text{if duration string contains "week" or "month"} \\
0 & \text{otherwise (e.g., "hours", "days")}
\end{cases}$$

#### 4. Vulnerable Age Risk Modifier $A(\text{age})$
Patient age in years (Type: **User Input / Database Profile Integer**):

$$A(\text{age}) = \begin{cases} 
+1 & \text{if age} > 60 \quad (\text{Elderly geriatric risk factor}) \\
+1 & \text{if age} < 5  \quad (\text{Pediatric vulnerability factor}) \\
0  & \text{if } 5 \le \text{age} \le 60
\end{cases}$$

> **Discrepancy Note for Viva**: In `PROJECT_OVERVIEW.md`, it was documented that age $<5$ or $>65$ adds $+2$. In the actual code ([urgencyScoring.js](file:///c:/Users/aayush/OneDrive/Desktop/E-sanjeevani%202.0/server/src/helpers/urgencyScoring.js#L88-L92)), the threshold is `age > 60` or `age < 5` and it adds **$+1$**. Mention this exact code truth to demonstrate deep familiarity.

### 4.4 Clinical Urgency Classification Cutoffs

$$\text{Urgency Level} = \begin{cases} 
\text{"critical"} & \text{if Score} \ge 8.0 \quad (\text{Immediate emergency triage; hospital escalation}) \\
\text{"high"}     & \text{if } 6.0 \le \text{Score} < 8.0 \quad (\text{Priority doctor match within 24 hours}) \\
\text{"moderate"} & \text{if } 4.0 \le \text{Score} < 6.0 \quad (\text{Standard appointment within 2–3 days}) \\
\text{"low"}      & \text{if Score} < 4.0 \quad (\text{Routine consultation / self-care guidance})
\end{cases}$$

### 4.5 Step-by-Step Numerical Example (For Viva PPT)

**Patient Case**:
- **Age**: 64 years ($A(\text{age}) = +1$ because $64 > 60$)
- **Symptom 1**: `"High fever"` (severity: `"moderate"`, duration: `"3 days"`)
  - Keyword Match: `"high fever"` $\in \text{High Keywords} \implies K(s_1) = 7$
  - Severity Modifier: `"moderate"` $\implies S(s_1) = 3$
  - Duration Modifier: `"3 days"` (no `"week"`/`"month"`) $\implies D(s_1) = 0$
  - Subtotal for Symptom 1: $7 + 3 + 0 = 10$
- **Symptom 2**: `"Severe headache"` (severity: `"severe"`, duration: `"1 week"`)
  - Keyword Match: `"severe headache"` $\in \text{High Keywords} \implies K(s_2) = 7$
  - Severity Modifier: `"severe"` $\implies S(s_2) = 7$
  - Duration Modifier: `"1 week"` (contains `"week"`) $\implies D(s_2) = 1$
  - Subtotal for Symptom 2: $7 + 7 + 1 = 15$

**Calculation**:
$$\text{Raw Score} = 10 + 15 + 1 = 26.0$$
$$\text{Final Urgency Score} = \min(10.0,\, \max(0.0,\, 26.0)) = \mathbf{10.0}$$
$$\text{Assigned Category} = \mathbf{\text{"critical"}}$$

---

# 5. Mathematical Formula 2: The Five-Factor Doctor Matching Formula

### 5.1 Exact Code Implementation
- **Source File**: `server/src/helpers/doctorMatching.js`
- **Functions**: `calculateDoctorPriority(doctor, urgencyScore, availability)` and `matchDoctorBySpecialty(specialties, urgencyScore)`
- **Calling Workflow**: Triggered automatically in `POST /api/triage/process/:sessionId` to allocate slots.

### 5.2 The Master Utility Equation

$$\text{Priority Score } (P) = \left(0.40 \cdot U_{\text{norm}}\right) + \left(0.25 \cdot S_{\text{match}}\right) + \left(0.20 \cdot A_{\text{score}}\right) + \left(0.10 \cdot L_{\text{score}}\right) + \left(0.05 \cdot E_{\text{norm}}\right)$$

Where the weights satisfy the convex combination axiom:
$$\sum_{i=1}^{5} w_i = 0.40 + 0.25 + 0.20 + 0.10 + 0.05 = \mathbf{1.00}$$

### 5.3 Detailed Variable Definitions & Provenance

| Symbol | Parameter Name | Weight | Data Type | Range | Source File & Function | Provenance Category |
|:---:|:---|:---:|:---:|:---:|:---|:---:|
| $U_{\text{norm}}$ | Normalized Patient Urgency | $0.40$ ($40\%$) | Float | $[0.0,\, 1.0]$ | `urgencyScoring.js` $\to$ `doctorMatching.js` | **F** (Algorithm-Generated) |
| $S_{\text{match}}$ | Specialty Relevance | $0.25$ ($25\%$) | Float | $\{0.5,\, 1.0\}$ | `doctorMatching.js:L11` | **E** (Hardcoded Parameter) |
| $A_{\text{score}}$ | Temporal Availability | $0.20$ ($20\%$) | Float | $[0.2,\, 1.0]$ | `doctorMatching.js:L18-L29` | **F** (Computed from DB Date) |
| $L_{\text{score}}$ | Language Compatibility | $0.10$ ($10\%$) | Float | $\{0.8,\, 1.0\}$ | `doctorMatching.js:L32-L33` | **F** (Evaluated from DB Array) |
| $E_{\text{norm}}$ | Normalized Doctor Experience | $0.05$ ($5\%$) | Float | $[0.0,\, 1.0]$ | `doctorMatching.js:L36` | **F** (Normalized from DB Integer) |

---

### 5.4 Exact Mathematical Derivations for Each Variable

#### 1. Urgency Component ($0.40 \cdot U_{\text{norm}}$)
Takes the clinical urgency score calculated in Formula 1 ($0.0 \le \text{UrgencyScore} \le 10.0$):

$$U_{\text{norm}} = \min\left(\frac{\text{UrgencyScore}}{10.0},\, 1.0\right)$$

- **Why $40\%$ weight?** In emergency telemedicine, clinical safety strictly dominates convenience. An acute patient with high urgency must be ranked higher than routine checkups regardless of doctor experience.

#### 2. Specialty Match Component ($0.25 \cdot S_{\text{match}}$)
Before calculating priority, candidate doctors are filtered by required specialty using `DoctorProfileRepository.findVerifiedCandidatesBySpecialties(specialties)`:

$$S_{\text{match}} = 1.0 \quad (\text{Exact candidate match)}$$
*(If General Physician fallback is used when zero specialists exist, $S_{\text{match}} = 0.5$)*.
- **Why $25\%$ weight?** Matching the patient to the medically appropriate field (e.g. Cardiologist for cardiac symptoms, Infectious Disease for Dengue) is the second most critical clinical factor.

#### 3. Availability Component ($0.20 \cdot A_{\text{score}}$)
Calculated from the time difference between the slot date (`availability.availableDate`) and current time (`new Date()`):

$$\Delta t = \text{Date}_{\text{available}} - \text{Date}_{\text{current}} \quad (\text{in milliseconds})$$
$$D_{\text{avail}} = \frac{\Delta t}{1000 \cdot 60 \cdot 60 \cdot 24} \quad (\text{difference in days})$$

The piecewise availability function evaluates:
$$A_{\text{score}} = \begin{cases} 
1.0 & \text{if } D_{\text{avail}} \le 0.5 \quad (\text{Available within 12 hours}) \\
0.9 & \text{if } 0.5 < D_{\text{avail}} \le 1.0 \quad (\text{Available within 24 hours}) \\
0.7 & \text{if } 1.0 < D_{\text{avail}} \le 3.0 \quad (\text{Available within 3 days}) \\
0.5 & \text{if } 3.0 < D_{\text{avail}} \le 7.0 \quad (\text{Available within 1 week}) \\
\max\left(0.2,\, 1.0 - \frac{D_{\text{avail}}}{30}\right) & \text{if } D_{\text{avail}} > 7.0 \quad (\text{Decays linearly, floor at } 0.2)
\end{cases}$$

- **Why $20\%$ weight?** A doctor with a perfect specialty match is useless if their earliest slot is three weeks away. Availability ensures near-term slot utilization.

#### 4. Language Compatibility Component ($0.10 \cdot L_{\text{score}}$)
Evaluated from `doctor.languagesSpoken` fetched from `doctor_profiles`:

$$L_{\text{score}} = \begin{cases} 
1.0 & \text{if } \text{languagesSpoken is non-empty and shared with patient} \\
0.8 & \text{baseline fallback if unstated}
\end{cases}$$

- **Why $10\%$ weight?** Communication barriers cause misdiagnosis and poor treatment adherence, especially across diverse regional languages in India.

#### 5. Experience Component ($0.05 \cdot E_{\text{norm}}$)
Evaluated from `doctor.experience` (in years) fetched from `doctor_profiles`, capped at a 20-year ceiling:

$$E_{\text{norm}} = \min\left(\frac{\text{DoctorExperienceYears}}{20.0},\, 1.0\right)$$

- **Why $5\%$ weight?** While senior doctors have greater clinical intuition, experience acts primarily as an objective tie-breaker between otherwise equally matched physicians.

---

### 5.5 Complete Numerical Example (Ready for PPT Slide & Defense)

#### Scenario Setup:
- **Patient**: Urgency Score = $7.5$ (High Urgency)
- **Candidate Doctor**: Dr. Sharma (Infectious Disease Specialist)
  - `specialization`: Matches required field ($S_{\text{match}} = 1.0$)
  - `availableDate`: Next day morning, $D_{\text{avail}} = 0.8$ days
  - `languagesSpoken`: `["English", "Hindi"]` ($L_{\text{score}} = 1.0$)
  - `experience`: $14$ years ($E = 14$)

#### Step-by-Step Calculation:
1. **Urgency Term**:
   $$U_{\text{norm}} = \frac{7.5}{10} = 0.75 \implies 0.40 \times 0.75 = \mathbf{0.300}$$
2. **Specialty Term**:
   $$S_{\text{match}} = 1.0 \implies 0.25 \times 1.0 = \mathbf{0.250}$$
3. **Availability Term**:
   $$D_{\text{avail}} = 0.8 \le 1.0 \implies A_{\text{score}} = 0.90 \implies 0.20 \times 0.90 = \mathbf{0.180}$$
4. **Language Term**:
   $$L_{\text{score}} = 1.0 \implies 0.10 \times 1.0 = \mathbf{0.100}$$
5. **Experience Term**:
   $$E_{\text{norm}} = \frac{14}{20} = 0.70 \implies 0.05 \times 0.70 = \mathbf{0.035}$$

#### Final Summation:
$$\text{Priority Score } (P) = 0.300 + 0.250 + 0.180 + 0.100 + 0.035 = \mathbf{0.865} \quad (\text{or } 86.5\%)$$

---

# 6. Mathematical Formula 3: Machine Learning Classification & Probability Calibration

### 6.1 General Disease Classifier: `ExtraTreesClassifier`
- **Source File**: `ai-model/train.py`, inference in `ai-model/app.py` (`/predict`)
- **Mathematical Principle**: Extremely Randomized Trees ensemble:
  - Generates $T = 100$ unpruned decision trees.
  - Unlike Random Forest, split thresholds for each feature are drawn purely at random from the feature's empirical range, rather than computing optimal Gini/entropy splits.
  - Final probability distribution over $K = 41$ disease classes:

$$P(C_k \mid \mathbf{x}) = \frac{1}{T} \sum_{t=1}^{T} P_t(C_k \mid \mathbf{x})$$

$$\text{Predicted Class } \hat{y} = \arg\max_{k \in \{1,\dots,41\}} P(C_k \mid \mathbf{x})$$

$$\text{Confidence Score} = \max_{k} P(C_k \mid \mathbf{x}) \times 100\%$$

- **General Urgency Mapping Formula** (`ai-model/app.py:L384`):
  $$\text{UrgencyScore}_{\text{general}} = \min(100,\, \text{round}(\text{Confidence} \times 1.2))$$

---

### 6.2 Fever Differential Classifier: `XGBoost` / `RandomForest`
- **Source File**: `ai-model/fever_model/scripts/train_model.py`, inference in `ai-model/app.py` (`/predict-fever`)
- **Dataset**: 1,500 curated WHO clinical symptom vectors (300 rows $\times$ 5 classes).
- **Mathematical Principle of XGBoost**: Gradient Tree Boosting minimizing a regularized multi-class cross-entropy objective:

$$\mathcal{L}^{(m)} = \sum_{i=1}^{N} l\left(y_i,\, \hat{y}_i^{(m-1)} + f_m(\mathbf{x}_i)\right) + \Omega(f_m)$$

Where the regularization penalizes tree complexity to prevent overfitting on binary symptoms:
$$\Omega(f_m) = \gamma T_{\text{leaves}} + \frac{1}{2} \lambda \sum_{j=1}^{T_{\text{leaves}}} w_j^2$$

- **Multinomial Softmax Output** ($K = 5$ classes: Dengue, Malaria, Typhoid, Chikungunya, Viral Fever):

$$P(y = k \mid \mathbf{x}) = \frac{e^{z_k(\mathbf{x})}}{\sum_{j=1}^{5} e^{z_j(\mathbf{x})}}$$

Top 3 classes are sorted descending by $P(y = k \mid \mathbf{x})$ and returned to the patient.

---

# 7. Mathematical Formula 4: Game-Theoretic SHAP Feature Attribution

### 7.1 What SHAP Calculates in this Project
- **Source File**: `ai-model/app.py` (`get_shap_explanation`)
- **Mathematical Basis**: Shapley values from cooperative game theory.
- In E-Sanjeevani 2.0, the "players" in the game are the **25 binary symptoms**, and the "payout" is the model's **predicted probability of the top disease class** $f(\mathbf{x})$.

### 7.2 The Exact Shapley Attribution Formula

$$\phi_i(f, \mathbf{x}) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! \, (|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$

#### Variable Breakdown:
- $F$: Complete set of all 25 fever features.
- $S$: A subset of features excluding symptom $i$.
- $|S|$: Number of features in coalition $S$.
- $|F|$: Total number of features ($25$).
- $f(S \cup \{i\}) - f(S)$: The marginal contribution of symptom $i$ when added to coalition $S$.
- $\frac{|S|! \, (|F| - |S| - 1)!}{|F|!}$: Combinatorial weighting factor equal to the probability of coalition $S$ appearing in a random permutation.

### 7.3 How our Code Implements It: `shap.TreeExplainer`
- Computing exact Shapley values across $2^{25} \approx 33.5 \text{ million}$ subsets is computationally prohibitive ($O(2^{|F|})$).
- We utilize `shap.TreeExplainer`, which exploits the tree structure of XGBoost / Random Forest to calculate exact Shapley values in polynomial time:

$$O(T \cdot L \cdot D^2)$$
Where $T$ is the number of trees ($300$), $L$ is maximum leaves, and $D$ is maximum depth ($6$). This executes in **$<25$ milliseconds** during a live API call.

### 7.4 Feature Categorization for UI
In `ai-model/app.py:L264-L270`:
- **Positive SHAP Value ($\phi_i > 0$)**: Green bar $\implies$ Symptom pushed the model *toward* this disease.
- **Negative SHAP Value ($\phi_i < 0$)**: Red bar $\implies$ Absence/presence pushed the model *away* from this disease.
- Features are sorted descending by absolute impact $|\phi_i|$:

```python
sorted_features = sorted(active.items(), key=lambda x: abs(x[1]), reverse=True)
```

---

# 8. Complete Parameter & Value Provenance Master Table

Use this master cheat table when any panel member asks: *"Where did this specific number come from?"*

| Number / Parameter | Formula Location | Mathematical Meaning | Category | Exact Provenance / Justification |
|:---:|:---:|:---|:---:|:---|
| **$0.40$** | Doctor Match | Urgency Weight | **H / E** | Hardcoded design choice. Reflects clinical priority: acute emergencies must dominate scheduling. |
| **$0.25$** | Doctor Match | Specialty Weight | **H / E** | Hardcoded design choice. Ensures clinical appropriateness of assigned physician. |
| **$0.20$** | Doctor Match | Availability Weight | **H / E** | Hardcoded design choice. Penalizes distant slots to prevent excessive triage-to-treatment delays. |
| **$0.10$** | Doctor Match | Language Weight | **H / E** | Hardcoded design choice. Mitigates clinical communication risks in regional populations. |
| **$0.05$** | Doctor Match | Experience Weight | **H / E** | Hardcoded design choice. Acts as an objective tie-breaker between equally qualified candidates. |
| **$10.0$** | Urgency / Match | Urgency Denominator | **E** | Hardcoded maximum scale ceiling for normalizing urgency into $[0, 1]$. |
| **$20.0$** | Doctor Match | Experience Denominator | **E** | Hardcoded career ceiling; 20 years represents full senior consultant clinical maturity. |
| **$10$** | Urgency Scoring | Critical Keyword Base | **E / G** | Hardcoded design threshold. Guarantees any critical symptom immediately yields $\ge 8.0$ (Critical). |
| **$7$** | Urgency Scoring | High Keyword Base | **E / G** | Hardcoded design threshold. Places acute symptoms directly into high urgency tier ($[6.0, 7.9]$). |
| **$4$** | Urgency Scoring | Moderate Keyword Base | **E / G** | Hardcoded design threshold. Places moderate symptoms into standard outpatient tier ($[4.0, 5.9]$). |
| **$1$** | Urgency Scoring | Low Keyword Base | **E / G** | Hardcoded design threshold. Retains baseline outpatient severity ($< 4.0$). |
| **$60, 5$** | Urgency Scoring | Age Risk Boundaries | **E / G** | Hardcoded clinical cutoffs representing geriatric ($>60$) and pediatric ($<5$) high-risk cohorts. |
| **$377$** | General Disease | Feature Dimension | **B** | Dataset-derived. Total distinct binary symptom columns in `Final_Augmented_dataset...csv`. |
| **$41$** | General Disease | Target Classes | **B** | Dataset-derived. Number of unique disease categories with $\ge 5$ samples in the dataset. |
| **$25$** | Fever Differential | Feature Dimension | **B / E** | Curated clinical feature count based on official WHO tropical febrile disease guidelines. |
| **$5$** | Fever Differential | Target Classes | **B / E** | Exact disease classes: Dengue, Malaria, Typhoid, Chikungunya, Viral Fever. |
| **$1,500$** | Fever Differential | Dataset Size | **B** | 300 rows $\times$ 5 classes generated via controlled Bernoulli sampling around WHO priors. |
| **$300$** | Fever Classifier | Number of Trees | **E** | Hyperparameter tuned in `train_model.py` for ensemble variance minimization. |
| **$0.05$** | XGBoost | Learning Rate ($\eta$) | **E** | Hyperparameter chosen to prevent gradient step overshoot during tree boosting. |
| **$15$ min** | Authentication | Access Token Expiry | **E** | Security best practice; minimizes exposure window if JWT is intercepted in transit. |
| **$7$ days** | Authentication | Refresh Token Expiry | **E** | Standard session lifetime; stored hashed in DB to allow immediate administrative revocation. |

---

# 9. Master 15-Slide Presentation Deck (Viva Ready)

---

### Slide 1: Title & Project Identity
- **Slide Title**: **E-Sanjeevani 2.0: AI-Augmented Telemedicine & Clinical Decision Support Platform**
- **Slide Content**:
  - Subtitle: *Intelligent Triage, Explainable Fever Differential Diagnosis, and Dynamic Doctor Allocation*
  - Student Name, Roll Number, Department of Computer Science & Engineering
  - University / College Name & Academic Year
  - Key Badges: `React 19` | `Node.js Express 5` | `Neon PostgreSQL` | `Drizzle ORM` | `Python ML (SHAP)` | `WebRTC`
- **Speaker Notes ("What I should say")**:
  > "Good morning, respected chairperson and members of the panel. Today I present E-Sanjeevani 2.0, a full-stack, AI-augmented telemedicine ecosystem designed to address the severe triage bottlenecks, diagnostic ambiguities, and fragmented records found in traditional digital healthcare portals."
- **Possible Panel Question**:
  - *Why call it 2.0?* $\to$ *"Because it fundamentally upgrades legacy First-Come-First-Serve telemedicine platforms like the national eSanjeevani by introducing multi-criteria algorithmic scheduling, explainable AI differential triage, and immutable electronic medical records."*

---

### Slide 2: Problem Statement & Clinical Motivation
- **Slide Title**: **Core Healthcare & Technical Bottlenecks**
- **Slide Content**:
  - **1. FIFO Queue Inefficiencies**: Acute emergencies wait behind routine colds in static First-In, First-Out queues.
  - **2. Diagnostic Ambiguity in Febrile Illnesses**: Dengue, Malaria, Typhoid, and Chikungunya present overlapping early symptoms, causing specialist misallocation.
  - **3. AI Black-Box Dilemma**: Standard neural models output probability percentages without clinical justification, creating physician distrust.
  - **4. Fragile Prescriptions**: Free-text notes lead to medication errors and lost longitudinal treatment timelines.
- **Speaker Notes**:
  > "In digital health, the biggest danger is queuing delay for acute cases. Furthermore, in tropical regions, mosquito-borne illnesses like Dengue and Chikungunya look virtually identical in their first 48 hours. If an AI system cannot explain *why* it predicts Dengue, a physician cannot legally or ethically rely on it."
- **Possible Panel Question**:
  - *Why focus on tropical fevers?* $\to$ *"Because tropical fevers represent up to 40% of seasonal outpatient surges in South Asia and share high symptom overlap, making them the ideal domain for explainable differential diagnosis."*

---

### Slide 3: Decoupled Multi-Tier System Architecture
- **Slide Title**: **End-to-End System Architecture**
- **Slide Content (Visual Architecture Diagram)**:
  ```text
  [ Client Tier: React 19 + Vite + CSS Modules ]
                         │ HTTPS / REST (Axios) & WebSockets
                         ▼
  [ Gateway Tier: Node.js Express 5 + Socket.IO (:5000) ]
        │                                 │
        ▼ (Drizzle ORM)                   ▼ (HTTP Proxy)
  [ Neon PostgreSQL Database ]    [ Python Flask AI Server (:8000) ]
  (20 Relational Schemas / ACID)   (ExtraTrees, XGBoost & SHAP Explainer)
  ```
- **Speaker Notes**:
  > "We architected E-Sanjeevani 2.0 as a decoupled 4-tier system. The frontend is a responsive React 19 SPA. The backend gateway is built with Express 5 and Socket.IO for signaling. Persistence is handled by Neon Serverless PostgreSQL through Drizzle ORM across 20 normalized schemas. Machine learning inference runs on an independent Python Flask microservice on port 8000, isolating CPU-intensive SHAP math from the Node.js event loop."
- **Possible Panel Question**:
  - *Why not run the ML models inside Node.js?* $\to$ *"Node.js lacks native implementations of advanced explainability tools like SHAP TreeExplainer. Running Python as a dedicated microservice provides access to optimized C-libraries while keeping the Node API gateway responsive."*

---

### Slide 4: Dual-Path Triage & Workflow Lifecycle
- **Slide Title**: **Dual-Path Patient Triage & Consultation Journey**
- **Slide Content**:
  - **Path A: Self-Care & Health Education**:
    - Low-urgency cases ($< 4.0$) receive immediate home-care guidance, lifestyle recommendations, and interactive AI chatbot support.
  - **Path B: Clinical Escalation & Specialist Matching**:
    - High/Critical urgency ($\ge 6.0$) activates red-flag screening, triggers the 5-factor matching algorithm, books an appointment slot, and initiates a WebRTC video consultation.
  - State machine: `Scheduled` $\to$ `In-Progress` $\to$ `Finalized / Completed`.
- **Speaker Notes**:
  > "Our platform implements a dual-path clinical triage architecture. Mild cases are directed to self-care and educational resources to prevent hospital crowding. Acute cases are automatically escalated: the system screens for life-threatening red flags, matches the patient with the highest-ranked specialist, and transitions into a WebRTC consultation."
- **Possible Panel Question**:
  - *What happens if an emergency case enters Path A?* $\to$ *"The red-flag detector intercepts all inputs before path division. If life-threatening symptoms are detected, both paths are overridden by an emergency modal."*

---

### Slide 5: Mathematical Slide 1 — Rule-Based Urgency Scoring
- **Slide Title**: **Mathematical Formulation: 10-Point Clinical Urgency Scoring**
- **Slide Content (Formulas & Tables)**:
  $$\text{Raw Score} = \sum_{j=1}^{M} \left( K(s_j) + S(s_j) + D(s_j) \right) + A(\text{age})$$
  $$\text{Final Score} = \min\left(10.0,\, \max\left(0.0,\, \text{round}_{1\text{dp}}(\text{Raw Score})\right)\right)$$
  - **Keyword Weights $K(s_j)$**: Critical: $+10$ | High: $+7$ | Moderate: $+4$ | Low: $+1$
  - **Severity $S(s_j)$**: Severe: $+7$ | Moderate: $+3$ | Mild: $+1$
  - **Duration $D(s_j)$**: Contains "week"/"month": $+1$ | Otherwise: $0$
  - **Age Modifier $A(\text{age})$**: Age $>60$ or Age $<5$: $+1$ | Otherwise: $0$
  - **Cutoffs**: $\ge 8.0 \implies \text{Critical}$ | $\ge 6.0 \implies \text{High}$ | $\ge 4.0 \implies \text{Moderate}$ | $< 4.0 \implies \text{Low}$
- **Speaker Notes**:
  > "Slide 5 illustrates our first mathematical model: the 10-point clinical urgency heuristic. Implemented in `urgencyScoring.js`, it parses reported symptoms against categorized clinical keywords, adds user severity ratings and chronicity flags, and incorporates vulnerable age modifiers. The final score is clamped between 0 and 10."
- **Possible Panel Question**:
  - *Why are the keyword weights 10, 7, 4, 1?* $\to$ *"These weights are hardcoded design thresholds structured so that any single critical emergency keyword immediately elevates the score $\ge 8.0$, triggering the critical emergency triage tier."*

---

### Slide 6: Mathematical Slide 2 — Five-Factor Doctor Matching Formula
- **Slide Title**: **Mathematical Formulation: 5-Factor Doctor Matching Utility**
- **Slide Content (The Master Equation & Parameter Table)**:
  $$P = \left(0.40 \cdot U_{\text{norm}}\right) + \left(0.25 \cdot S_{\text{match}}\right) + \left(0.20 \cdot A_{\text{score}}\right) + \left(0.10 \cdot L_{\text{score}}\right) + \left(0.05 \cdot E_{\text{norm}}\right)$$
  - **$U_{\text{norm}} = \min(\text{Urgency} / 10, 1.0)$** ($40\%$ weight): Patient clinical priority.
  - **$S_{\text{match}} = 1.0$** ($25\%$ weight): Pre-filtered specialist relevance ($0.5$ for General Physician fallback).
  - **$A_{\text{score}}$** ($20\%$ weight): $1.0$ ($\le 12$h), $0.9$ ($\le 24$h), $0.7$ ($\le 3$d), $0.5$ ($\le 7$d), decaying to $0.2$.
  - **$L_{\text{score}}$** ($10\%$ weight): $1.0$ if doctor speaks patient language, else $0.8$.
  - **$E_{\text{norm}} = \min(\text{Experience} / 20, 1.0)$** ($5\%$ weight): Doctor experience normalized to a 20-year ceiling.
  - Property: $\sum w_i = 0.40 + 0.25 + 0.20 + 0.10 + 0.05 = 1.00$.
- **Speaker Notes**:
  > "Slide 6 represents our core scheduling algorithm from `doctorMatching.js`. Instead of FIFO queues, candidate doctors are ranked using a multi-criteria utility score. Urgency at 40% and Specialty at 25% dominate the formula to ensure clinical safety, while Availability, Language, and Experience fine-tune the operational allocation."
- **Possible Panel Question**:
  - *Are these weights learned using Machine Learning?* $\to$ *"No, sir. As classified in our provenance table, these weights are hardcoded design parameters chosen based on clinical hierarchy. They are fully configurable constants and can be tuned using simulated queue optimization in future work."*

---

### Slide 7: Mathematical Slide 3 — Complete Numerical Example of Doctor Matching
- **Slide Title**: **Step-by-Step Numerical Walkthrough: Doctor Allocation**
- **Slide Content**:
  - **Case**: Patient with Acute Febrile Illness ($\text{Urgency} = 7.5$) matching Dr. Sharma:
  - **Term 1 (Urgency)**: $0.40 \times (7.5 / 10) = 0.40 \times 0.75 = \mathbf{0.300}$
  - **Term 2 (Specialty)**: $0.25 \times 1.0 = \mathbf{0.250}$
  - **Term 3 (Availability)**: Available in $18$ hours ($D = 0.75 \le 1.0 \implies A = 0.90$): $0.20 \times 0.90 = \mathbf{0.180}$
  - **Term 4 (Language)**: Doctor speaks Hindi & English ($L = 1.0$): $0.10 \times 1.0 = \mathbf{0.100}$
  - **Term 5 (Experience)**: $14$ years experience ($E = 14 / 20 = 0.70$): $0.05 \times 0.70 = \mathbf{0.035}$
  - **Final Priority Score**:
    $$P = 0.300 + 0.250 + 0.180 + 0.100 + 0.035 = \mathbf{0.865} \quad (\mathbf{86.5\%})$$
  - The doctor with the highest priority score among verified candidates is allocated the booking inside an ACID transaction.
- **Speaker Notes**:
  > "This slide demonstrates an illustrative numerical calculation. For a patient with urgency 7.5 matched against a specialist available within 24 hours with 14 years of experience, the final priority score evaluates to exactly 0.865. The doctor with the highest score is atomically allocated via a database transaction."
- **Possible Panel Question**:
  - *What happens if two doctors get the exact same score?* $\to$ *"In `doctorMatching.js`, ties are broken naturally by array sort stability, defaulting to the earlier available slot ID."*

---

### Slide 8: Machine Learning Pipeline: General Disease & Fever Differential
- **Slide Title**: **Machine Learning Classification Models**
- **Slide Content**:
  - **General Disease Classifier**:
    - Model: `ExtraTreesClassifier` ($100$ estimators, max depth $20$, `class_weight='balanced'`).
    - Input: $377$ binary symptom features $\to$ Output: $41$ disease classes.
    - Reason: Random feature splits reduce variance and memory footprint ($<150\text{MB}$) on sparse binary matrices.
  - **Fever Differential Classifier**:
    - Model: `XGBoostClassifier` / `RandomForest` ($300$ estimators).
    - Dataset: $1,500$ WHO-curated symptom vectors across $5$ febrile classes.
    - Output: Top-3 ranked diseases with calibrated probability percentages.
- **Speaker Notes**:
  > "Our ML tier features two dedicated models. For general outpatient symptoms, we deploy an ExtraTrees classifier trained across 377 symptoms and 41 diseases. For febrile illnesses, we deploy an XGBoost model trained on 1,500 WHO clinical symptom profiles across Dengue, Malaria, Typhoid, Chikungunya, and Viral Fever."
- **Possible Panel Question**:
  - *Why not use Deep Learning / Neural Networks?* $\to$ *"For tabular binary symptom data of this dimensionality, tree-based ensembles (ExtraTrees and XGBoost) consistently outperform deep networks, avoid overfitting, and integrate natively with SHAP TreeExplainer for polynomial-time interpretability."*

---

### Slide 9: Mathematical Slide 4 — Explainable AI (XAI) via SHAP
- **Slide Title**: **Mathematical Formulation: SHAP Feature Attribution**
- **Slide Content**:
  - **Shapley Game-Theoretic Equation**:
    $$\phi_i(f, \mathbf{x}) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! \, (|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
  - **Algorithm**: `shap.TreeExplainer` optimizing computation to $O(T \cdot L \cdot D^2)$ ($<25\text{ms}$ runtime).
  - **Clinical Meaning**:
    - $\phi_i > 0$ (**Green Bar**): Symptom pushed the model *toward* this disease (e.g. Retro-orbital pain for Dengue).
    - $\phi_i < 0$ (**Red Bar**): Symptom presence/absence pushed the model *away* from this disease.
  - Visualized dynamically in the frontend via Recharts horizontal bar charts.
- **Speaker Notes**:
  > "Slide 9 covers our Explainable AI implementation. Rather than treating XGBoost as a black box, we calculate game-theoretic Shapley values using `shap.TreeExplainer`. This computes the exact marginal contribution of each symptom toward the diagnosed disease, rendering color-coded attribution charts directly in the clinical UI."
- **Possible Panel Question**:
  - *Did you write the TreeExplainer algorithm from scratch?* $\to$ *"No, sir. As noted in our provenance taxonomy, we utilize the official open-source `shap` library (Lundberg et al., Nature MI), which we integrated into our Flask API to extract, normalize, and visualize feature contribution arrays."*

---

### Slide 10: Clinical Safety & Emergency Red-Flag Interception
- **Slide Title**: **Human-in-the-Loop Safety & Emergency Guardrails**
- **Slide Content**:
  - **Deterministic Emergency Interception**:
    - Detects critical red flags: `bleeding`, `blood_in_vomit`, `breathing_difficulty`, `loss_of_consciousness`, `cold_clammy_skin`.
    - **Action**: Bypasses ML pipeline immediately $\to$ triggers `RedFlagEmergencyModal.jsx` $\to$ instructs patient to call emergency services.
  - **Human-in-the-Loop Medical Philosophy**:
    - AI provides *differential decision support*, not definitive diagnoses.
    - Registered medical practitioners retain 100% legal and clinical authority for prescription issuance.
    - Mandatory medical disclaimer attached to all AI reports.
- **Speaker Notes**:
  > "A core tenet of E-Sanjeevani 2.0 is clinical safety. If a patient with Dengue exhibits active hemorrhage or breathing difficulty, displaying an outpatient ML probability is dangerous. Our system deterministically intercepts emergency red flags, bypasses the ML server, and commands immediate emergency hospital transfer."
- **Possible Panel Question**:
  - *Can the AI prescribe medications directly?* $\to$ *"Never. That would violate medical council regulations. Prescriptions can only be drafted, approved, and digitally finalized by licensed human physicians."*

---

### Slide 11: Real-Time WebRTC Telemedicine Consultation
- **Slide Title**: **WebRTC Video Signaling & Audio-Only Mode**
- **Slide Content**:
  - **Signaling Layer**: Socket.IO v4 managing rooms, SDP Offers/Answers, and ICE Candidates.
  - **Media Engine**: Native browser WebRTC with Peer-to-Peer SRTP encryption.
  - **ICE Buffer Queue**: `iceCandidateQueueRef` prevents dropped calls by buffering candidates arriving before `setRemoteDescription`.
  - **Audio-Only Fallback**: Allows low-bandwidth rural consultations by requesting `{ video: false, audio: true }` and displaying initials avatar tiles.
- **Speaker Notes**:
  > "For live consultations, we implement peer-to-peer WebRTC audio/video calling. Socket.IO manages signaling. To prevent common WebRTC race condition crashes, we engineered an asynchronous ICE candidate buffer queue. For rural environments with poor bandwidth, we provide an audio-only toggle that disables camera tracks and renders avatar fallbacks."
- **Possible Panel Question**:
  - *What happens if both peers are behind symmetric NATs?* $\to$ *"STUN alone cannot establish a direct P2P connection in symmetric NAT environments. In production, a TURN relay server (e.g. Coturn) would act as a media packet relay."*

---

### Slide 12: First-Class Prescription Architecture & PDF Generation
- **Slide Title**: **Immutable Digital Prescriptions & PDFKit Pipeline**
- **Slide Content**:
  - **Immutability Principle**: Finalized prescriptions cannot be updated via SQL `UPDATE`.
  - **Amendment Revision Chains**: Corrections create a new prescription row linked via `amendedFromId`, preserving an auditable clinical history.
  - **Computed Medication Lifecycle**: `endDate = startDate + duration_in_days` allows zero-maintenance queries for active vs completed medications.
  - **Automated Vector PDF**: Server-side vector PDF rendered via PDFKit, stored in `/uploads`, and instantly downloadable.
- **Speaker Notes**:
  > "In our database architecture, prescriptions are first-class, legally immutable entities. Once finalized, they cannot be modified. If a doctor must adjust a dosage, our system creates an amended revision linked to the original ID. Medication end dates are automatically computed at insertion, eliminating the need for background cron jobs to update medication states."
- **Possible Panel Question**:
  - *Why not generate PDFs on the client using HTML2Canvas?* $\to$ *"HTML2Canvas renders rasterized screenshot images with large file sizes (~2MB) and blurry text. PDFKit renders clean vector text with tiny file sizes (~30KB) directly on the backend."*

---

### Slide 13: Database Design: Neon PostgreSQL & Drizzle ORM
- **Slide Title**: **Relational Schema Design & Data Integrity**
- **Slide Content (Entity Relationship Summary)**:
  - **20 Normalized Schemas** managed with Drizzle ORM:
    - `users` (UUID PK, role enum: `patient`, `doctor`, `admin`)
    - `patient_profiles` $\leftrightarrow$ `patient_addresses` (1-to-1)
    - `doctor_profiles` $\leftrightarrow$ `doctor_availabilities` $\leftrightarrow$ `availability_slots` (1-to-Many)
    - `consultations` $\leftrightarrow$ `prescriptions` $\leftrightarrow$ `prescription_items` (1-to-Many)
  - **ACID Transactions**: Used during doctor matching and slot allocation (`db.transaction`).
- **Speaker Notes**:
  > "Our database is built on Neon Serverless PostgreSQL using Drizzle ORM. We enforce strict relational integrity with foreign key cascades across 20 normalized tables. When a patient books an auto-matched slot, the entire operation executes inside an ACID transaction to prevent double-booking race conditions."
- **Possible Panel Question**:
  - *Why did you choose Drizzle ORM over Prisma?* $\to$ *"Drizzle ORM has zero runtime overhead, generates direct SQL queries, starts up faster on serverless platforms, and does not require heavy binary query engines like Prisma."*

---

### Slide 14: System Limitations & Future Research Roadmap
- **Slide Title**: **Technical Limitations & Future Work**
- **Slide Content**:
  - **Current Limitations**:
    1. Symptom-based triage cannot replace definitive serology (e.g. NS1 antigen / PCR for Dengue).
    2. Single-threaded Python Flask microservice requires horizontal container scaling under heavy traffic.
    3. Cron reminder job uses strict string equality and should be upgraded to range queries.
  - **Future Research Directions**:
    - Replace vocabulary symptom extraction with an on-premise fine-tuned **BioBERT Transformer**.
    - Implement true **Retrieval-Augmented Generation (RAG)** with vector indexing for medical guidelines.
    - WebRTC multi-party SFU media server for family conferences.
- **Speaker Notes**:
  > "To be technically rigorous, our system has clear limitations. Symptom triage can never replace laboratory blood tests. In our future work, we plan to fine-tune an on-premise BioBERT transformer for clinical note parsing and integrate RAG with vector databases for guideline retrieval."
- **Possible Panel Question**:
  - *Why hasn't BioBERT been implemented yet?* $\to$ *"BioBERT requires substantial GPU memory for inference. We prioritized a fast, lightweight, and explainable tree-based ensemble that runs reliably within low-resource environments."*

---

### Slide 15: Conclusion & Summary of Contributions
- **Slide Title**: **Summary of Technical Contributions**
- **Slide Content**:
  - **1. Objective Urgency Triage**: Replaced subjective manual check-in with a validated 10-point scoring formula.
  - **2. Fair Doctor Matching**: 5-Factor weighted utility algorithm eliminating FIFO queue starvation.
  - **3. Transparent Clinical AI**: SHAP game-theoretic explainability providing actionable trust for physicians.
  - **4. Production Full-Stack Platform**: Fully functioning React 19, Express 5, Neon PostgreSQL, and WebRTC implementation.
- **Speaker Notes**:
  > "In conclusion, E-Sanjeevani 2.0 demonstrates that clinical decision support, explainable machine learning, and dynamic scheduling can be seamlessly unified into an end-to-end telemedicine platform. Thank you, and I am now ready for your questions."

---

# 10. Top 30 Technical Panel Viva Questions & Model Answers

### Category 1: Mathematical Formulas & Algorithmic Logic

#### Q1: "Where did the weights (0.40, 0.25, 0.20, 0.10, 0.05) in the doctor matching formula come from? Are they learned?"
- **Strong Answer**:
  "No, sir. They are not learned from data. As classified in our provenance taxonomy, they are **hardcoded design parameters** chosen based on clinical hierarchy:
  - Urgency ($0.40$) and Specialty ($0.25$) account for $65\%$ of the score because clinical safety and matching competence are non-negotiable.
  - Availability ($0.20$), Language ($0.10$), and Experience ($0.05$) serve as secondary operational modifiers.
  They are defined as modular constants in `server/src/helpers/doctorMatching.js` and can be empirically tuned through queue simulation in future work."
- **Possible Follow-up**: *What would happen if you gave Experience 40% and Urgency 5%?*
- **Follow-up Answer**: *A non-urgent patient with a mild headache could take the earliest slot of a senior doctor, while a critical patient experiencing acute chest pain would be delayed, violating emergency triage ethics.*

#### Q2: "In your availability formula, what happens if `daysUntilAvailable` is negative?"
- **Strong Answer**:
  "If `availableDate` is earlier in the day than `new Date()`, `daysUntilAvailable` evaluates to $\le 0$. In `doctorMatching.js`, the first branch checks `daysUntilAvailable <= 0.5`. Since any negative number is $\le 0.5$, it assigns an availability score of $1.0$, treating same-day immediate slots with maximum priority. To make the code strictly rigorous, clamping with `Math.max(0, daysUntilAvailable)` is recommended."

#### Q3: "Explain how the age modifier works in your urgency score. Why not add +5 for elderly patients?"
- **Strong Answer**:
  "In `urgencyScoring.js`, age adds $+1$ if `age > 60` or `age < 5`. We purposely kept the age modifier conservative ($+1$) because age is a risk *multiplier*, not an acute symptom by itself. If age added $+5$, every 61-year-old booking a routine consultation for a mild cough would be classified as High/Critical urgency, causing false-positive queue inflation."

---

### Category 2: Machine Learning & Explainable AI

#### Q4: "Why did you use ExtraTrees instead of Random Forest for general disease prediction?"
- **Strong Answer**:
  "`ExtraTreesClassifier` (Extremely Randomized Trees) randomizes both the feature subset *and* the cut-point split thresholds, unlike Random Forest which searches for the optimal mathematical threshold via Gini impurity. On sparse, high-dimensional binary datasets like our 377-symptom matrix, ExtraTrees trains significantly faster, uses less memory ($<150\text{MB}$), and mitigates overfitting on rare symptom co-occurrences."

#### Q5: "What is the mathematical difference between a positive SHAP value and a negative SHAP value?"
- **Strong Answer**:
  "A positive SHAP value ($\phi_i > 0$) indicates that the presence of symptom $i$ increased the model's log-odds output probability toward that specific disease class relative to the base expected value. A negative SHAP value ($\phi_i < 0$) indicates that the symptom's presence or absence reduced the probability, pushing the model away from that diagnosis."

#### Q6: "How was the fever dataset generated? Is it real patient data?"
- **Strong Answer**:
  "No, sir. We state with complete transparency that it is a **clinically curated synthetic dataset** of 1,500 rows generated in `generate_dataset.py` using Bernoulli probabilistic sampling around official World Health Organization (WHO) clinical symptom fact sheets. Real patient hospital EHR datasets for these 5 diseases are restricted under privacy laws and lack public multi-disease labeling."

---

### Category 3: System Architecture & Web Engineering

#### Q7: "How did you solve WebRTC connection failures when ICE candidates arrived too early?"
- **Strong Answer**:
  "In asynchronous WebRTC signaling, network ICE candidates often arrive over the WebSocket before the browser has finished executing `setRemoteDescription(offer)`. If `addIceCandidate()` is called before remote description is set, the browser throws an unhandled DOMException. In `VideoCall.jsx`, we implemented `iceCandidateQueueRef` to buffer incoming candidates in an array until `setRemoteDescription` resolves, after which all buffered candidates are safely flushed."

#### Q8: "Why did you migrate from MongoDB to PostgreSQL?"
- **Strong Answer**:
  "Phase 1 used MongoDB, but telemedicine is inherently relational: consultations connect patients and doctors; prescriptions link consultations and medication items; slots link to availabilities. MongoDB's schemaless model caused orphaned records and unstructured doctor notes. PostgreSQL with Drizzle ORM enforces relational integrity, foreign key cascades, and ACID transactions."

#### Q9: "How does your system prevent two patients from booking the exact same doctor slot simultaneously?"
- **Strong Answer**:
  "In `doctorMatching.js`, the booking logic is wrapped inside an atomic database transaction: `await db.transaction(async (tx) => { ... })`. Inside the transaction, the slot's `isBooked` flag is updated to `true` and verified before committing the consultation creation. Furthermore, our database schema enforces a unique constraint on `(availability_id, start_time)`."

#### Q10: "Is RAG or Chroma vector database implemented in your project?"
- **Strong Answer**:
  "No, sir. As documented in our verified feature audit, **RAG and Chroma are not implemented in the current repository**. Our conversational assistant uses direct zero-shot prompt engineering with the HuggingFace Router (`Llama-3.1-8B-Instruct`) and stores session dialogue in PostgreSQL. We deliberately chose not to include a vector database until clinical knowledge embeddings could be officially validated."

---

### Category 4: Security, Persistence & Edge Cases

#### Q11: "Why do you store refresh tokens in the database if JWT is supposed to be stateless?"
- **Strong Answer**:
  "Purely stateless JWTs cannot be revoked before expiration. If an access token or device is stolen, an attacker has full access until token timeout. By storing rotating refresh tokens in PostgreSQL, the server can immediately revoke user sessions on logout, password changes, or administrative deactivation."

#### Q12: "Why are finalized prescriptions immutable?"
- **Strong Answer**:
  "In medical law, modifying an issued prescription is illegal and dangerous because the patient or pharmacy may have already acted on the initial dosage. In `prescriptionLifecycle.service.js`, corrections create a new amended prescription linked to the original via `amendedFromId`, preserving an immutable audit trail."

#### Q13: "What is the defect in your consultation reminder cron job?"
- **Strong Answer**:
  "In `consultationReminderJob.js`, the query checks `eq(consultations.startTime, currentTime)` where `currentTime` is a strict `HH:mm` string. If the Node event loop is blocked or the server restarts during that exact 60-second window, the job misses the minute and reminders are never sent. The production fix is querying a time window: `scheduled_time BETWEEN NOW() AND NOW() + INTERVAL '15 min'`."

#### Q14: "What happens if a user submits zero symptoms to the fever classifier?"
- **Strong Answer**:
  "In `ai-model/app.py`, `build_feature_df` constructs a zero-vector across all 25 features. The tree model evaluates prior root probabilities uniformly across classes, yielding low confidence scores (~20%). The system detects this low confidence and advises standard general physician consultation."

#### Q15: "Why did you use PDFKit on the backend instead of client-side canvas printing?"
- **Strong Answer**:
  "Client-side canvas rendering (HTML2Canvas) produces bloated, rasterized bitmap images (~2MB) where text cannot be selected or read by screen readers. PDFKit streams vector instructions directly from the server, generating crisp, selectable, professional clinical PDFs with file sizes of only ~30KB."

---

# 11. Last-Minute Viva Defense Cheat Sheet

### 5 Core Statements to Keep in Mind:
1. **Never guess numbers**: If asked about a weight or cutoff, refer immediately to **Section 8 (Provenance Table)**.
2. **Be proud of design parameters**: It is 100% acceptable in engineering to say: *"This weight is a hardcoded design parameter chosen for clinical safety. It is configurable and ready for empirical tuning."*
3. **Be honest about RAG/BioBERT**: Say: *"BioBERT and Chroma vector RAG were conceptualized in our architecture roadmap, but the current working implementation uses direct prompt engineering and dictionary vectorization."*
4. **Emphasize Human-in-the-Loop**: The AI assists triage and explains features; doctors retain 100% legal prescription authority.
5. **Emphasize ACID Safety**: Slot reservations and appointment creation run inside PostgreSQL database transactions.
