# E-Sanjeevani 2.0 — AI Chatbot & Triage Model Diseases & Analytics

> **Document Type**: Clinical AI Model Reference & Analytics Summary  
> **Platform**: E-Sanjeevani 2.0 Unified Telemedicine & Intelligent Triage Platform  
> **Architecture**: Multi-Category Specialist Ensemble (5 Targeted Clinical Category Models + General Classifier + Red-Flag Interceptors)  
> **Evaluated Dataset**: 7,500 total clinically curated patient profiles (1,500 per category, WHO/Clinical Guideline-grounded)  
> **Average Multi-Class Accuracy**: **93.73%** | **Average ROC-AUC**: **0.9929** | **Average Macro F1**: **0.9376**  

---

## 1. Executive Summary

In E-Sanjeevani 2.0, patient symptom analysis and chatbot triage are driven by an ensemble of specialized clinical Machine Learning models deployed via a unified Python Flask microservice (`ai-model/app.py` on port `8000`).

Rather than relying on an uncalibrated single black-box classifier, the platform uses a **Two-Tier Clinical Architecture**:
1. **Tier 1: Intelligent Symptom Routing & Emergency Red-Flag Interception**:
   - Free-text symptom normalization and 22 acute emergency red-flag triggers (e.g., crushing chest pain, anaphylactic facial swelling, blood in vomit, frank hematuria) that immediately route patients to emergency care.
   - Dynamic routing to the relevant anatomical/pathological category.
2. **Tier 2: Five Targeted Specialty Clinical Classifiers (25 Primary Conditions)**:
   - High-precision multi-class models covering **25 high-prevalence diseases** across 5 primary clinical domains (Fever, Respiratory, Digestive, Dermatology, and Urology).
   - Augmented by a broader 41-condition general reference dataset for broad symptom-to-disease queries.

---

## 2. Complete Inventory of Diseases by Category (25 Clinical Conditions)

The core triage engine operates across **5 clinical categories**, each trained to differentiate among **5 hallmark conditions** within that physiological specialty:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             E-SANJEEVANI 2.0 TRIAGE AI ENSEMBLE                                 │
└──────┬──────────────────┬──────────────────┬─────────────────────────┬───────────────────┬───────┘
       │                  │                  │                         │                   │
┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐           ┌──────▼──────┐     ┌──────▼──────┐
│  Category A │    │  Category B │    │  Category C │           │  Category D │     │  Category E │
│    FEVER    │    │ RESPIRATORY │    │  DIGESTIVE  │           │    SKIN     │     │   URINARY   │
│  (5 Classes)│    │  (5 Classes)│    │  (5 Classes)│           │  (5 Classes)│     │  (5 Classes)│
└─────────────┘    └─────────────┘    └─────────────┘           └─────────────┘     └─────────────┘
```

---

### Category A: Fever & Systemic Infectious Illnesses
- **Target Specialty**: General Physician / Infectious Disease Specialist
- **Feature Space**: 25 binary clinical symptoms (onset, cyclical chills, joint pain, retro-orbital pain, rash, etc.)
- **Selected Model**: `LogisticRegression` (L2 Regularization, $C=1.0$)
- **Clinical Motivation**: High diagnostic ambiguity in South Asia where tropical mosquito-borne and enteric infections present with overlapping febrile signs.

| # | Disease | Clinical Hallmarks & Key Diagnostic Indicators | Recommended Specialist |
|---|---|---|---|
| 1 | **Dengue** | High fever, severe retro-orbital pain (pain behind eyes), petechial rash, severe body pain ("breakbone fever"), thrombocytopenia risk | Infectious Disease / General Medicine |
| 2 | **Malaria** | Cyclical high fever with rigors, profound shaking chills followed by diaphoresis (profuse sweating), headache, fatigue | Infectious Disease / General Medicine |
| 3 | **Typhoid (Enteric Fever)** | Step-ladder sustained fever, relative bradycardia, abdominal tenderness, constipation followed by diarrhea, coated tongue | Gastroenterology / General Medicine |
| 4 | **Chikungunya** | Sudden high fever with severe, debilitating, symmetric peripheral polyarthralgia / joint swelling (wrists, ankles, fingers) | Rheumatology / General Medicine |
| 5 | **Viral Fever** | Moderate fever accompanied by upper respiratory signs (rhinorrhea, sore throat, cough), generalized myalgia and malaise | General Physician |

---

### Category B: Respiratory & Pulmonary Diseases
- **Target Specialty**: Pulmonologist / Chest Physician
- **Feature Space**: 20 binary pulmonary features (cough characteristics, dyspnea, wheezing, pleuritic pain, night sweats, etc.)
- **Selected Model**: `ExtraTreesClassifier` ($n=100$ estimators, $\text{criterion}=\text{'gini'}$)
- **Clinical Motivation**: Differentiating viral upper respiratory infections from chronic obstructive or alveolar infectious diseases.

| # | Disease | Clinical Hallmarks & Key Diagnostic Indicators | Recommended Specialist |
|---|---|---|---|
| 6 | **Asthma** | Episodic wheezing, recurrent chest tightness, dry nocturnal cough, symptom exacerbation triggered by allergens/exercise/cold air | Pulmonologist |
| 7 | **Bronchitis** | Persistent productive cough with mucopurulent sputum, retrosternal chest burning, low-grade fever, wheeze | Pulmonologist / Chest Physician |
| 8 | **Common Cold (Nasopharyngitis)** | Prominent rhinorrhea, nasal congestion, sneezing, mild sore throat, absence of high fever or respiratory distress | General Physician |
| 9 | **Influenza (Flu)** | Sudden-onset high fever, prostrating fatigue/exhaustion, severe diffuse myalgia, headache, dry cough | General Physician / Pulmonologist |
| 10 | **Pneumonia** | High fever with chills, productive cough with rust-colored/purulent sputum, pleuritic chest pain on inspiration, tachypnea | Pulmonologist / Critical Care |

---

### Category C: Gastroenterological & Digestive Disorders
- **Target Specialty**: Gastroenterologist
- **Feature Space**: 20 binary digestive features (epigastric pain, acid regurgitation, meal-timing correlations, bowel patterns, stool mucus)
- **Selected Model**: `LogisticRegression` ($C=1.0$)
- **Clinical Motivation**: Resolving upper vs. lower GI complaints, acid-peptic disorders, and inflammatory vs. functional bowel syndromes.

| # | Disease | Clinical Hallmarks & Key Diagnostic Indicators | Recommended Specialist |
|---|---|---|---|
| 11 | **Acid Reflux (GERD)** | Retrosternal burning (heartburn), acid regurgitation into throat, symptoms aggravated by recumbency/lying down post-meals | Gastroenterologist |
| 12 | **Gastritis** | Gnawing epigastric burning pain, early satiety, nausea, indigestion aggravated by spicy/acidic foods or NSAID usage | Gastroenterologist |
| 13 | **Gastroenteritis** | Acute watery diarrhea, hyperactive bowel sounds, cramping periumbilical abdominal pain, nausea, vomiting, low-grade fever | Gastroenterologist / General Physician |
| 14 | **Irritable Bowel Syndrome (IBS)** | Chronic cramping abdominal pain relieved following defecation, alternating diarrhea and constipation, mucus in stool, absence of fever | Gastroenterologist |
| 15 | **Peptic Ulcer Disease** | Well-localized burning epigastric pain characteristically worsened on an empty stomach or awakened at night; partially eased by antacids | Gastroenterologist |

---

### Category D: Dermatological & Cutaneous Conditions
- **Target Specialty**: Dermatologist
- **Feature Space**: 20 binary dermatological features (lesion morphologies: plaques, comedones, wheals, micaceous scales, annular rings, flexural/extensor distributions)
- **Selected Model**: `LogisticRegression` ($C=1.0$)
- **Clinical Motivation**: Discriminating allergic, fungal, autoimmune, and sebaceous skin eruptions.

| # | Disease | Clinical Hallmarks & Key Diagnostic Indicators | Recommended Specialist |
|---|---|---|---|
| 16 | **Acne Vulgaris** | Open/closed comedones (blackheads/whiteheads), inflammatory papules and pustules on sebum-rich areas (face, chest, upper back) | Dermatologist |
| 17 | **Atopic Eczema (Dermatitis)** | Intense pruritus (itching), dry cracked erythematous skin, excoriations and lichenification located primarily in flexural folds (cubital/popliteal) | Dermatologist |
| 18 | **Fungal Skin Infection (Tinea / Ringworm)**| Annular ring-shaped erythematous plaques with elevated active scaly borders and central clearing; macerated skin in intertriginous folds | Dermatologist |
| 19 | **Psoriasis Vulgaris** | Well-demarcated erythematous plaques covered with coarse, silvery-white micaceous scales predominantly on extensor surfaces (knees, elbows, scalp) | Dermatologist |
| 20 | **Urticaria (Hives)** | Transient, pruritic, raised edematous wheals/welts with pale centers that typically appear suddenly and resolve individually within 24 hours | Dermatologist / Allergist |

---

### Category E: Urological & Renal Conditions
- **Target Specialty**: Urologist / Nephrologist
- **Feature Space**: 20 binary urological features (dysuria, frequency, hesitancy, weak stream, flank pain, hematuria, nocturia)
- **Selected Model**: `LogisticRegression` ($C=1.0$)
- **Clinical Motivation**: Stratifying lower urinary tract symptoms (LUTS), acute nephrolithiasis, and ascending upper tract infections.

| # | Disease | Clinical Hallmarks & Key Diagnostic Indicators | Recommended Specialist |
|---|---|---|---|
| 21 | **Benign Prostatic Hyperplasia (BPH)** | Obstructive voiding symptoms in adult males: progressive hesitancy, weak urinary stream, intermittency, straining, post-void dribbling, nocturia | Urologist |
| 22 | **Kidney Infection (Pyelonephritis)** | High fever with shaking rigors, unilateral/bilateral flank pain, marked costovertebral angle (CVA) tenderness, nausea, dysuria | Nephrologist / Urologist |
| 23 | **Kidney Stones (Nephrolithiasis)** | Sudden, excruciating, spasmodic renal colic radiating from flank downwards to groin/labia/testicle; gross or microscopic hematuria | Urologist |
| 24 | **Overactive Bladder (OAB)** | Sudden compelling urgency to void that is difficult to defer, urgency incontinence, significant daytime frequency and nocturia without dysuria | Urologist |
| 25 | **Urinary Tract Infection (UTI / Cystitis)** | Painful burning on urination (dysuria), suprapubic pelvic heaviness, cloudy/foul-smelling urine, marked urinary urgency and frequency | Urologist / General Physician |

---

## 3. General Reference Knowledge Base (41 Disease Dataset)

In addition to the 5 specialized category triage models, the system includes a general multi-disease training corpus (`ai-model/data/Training.csv` and `Symptom2Disease.csv`) covering **41 broad diagnostic categories** with 377 symptom indicators:

> *Fungal Infection, Allergy, GERD, Chronic Cholestasis, Drug Reaction, Peptic Ulcer Disease, AIDS, Diabetes, Gastroenteritis, Bronchial Asthma, Hypertension, Migraine, Cervical Spondylosis, Paralysis (Brain Hemorrhage), Jaundice, Malaria, Chickenpox, Dengue, Typhoid, Hepatitis A, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Alcoholic Hepatitis, Tuberculosis, Common Cold, Pneumonia, Dimorphic Hemorrhoids, Heart Attack, Varicose Veins, Hypothyroidism, Hyperthyroidism, Hypoglycemia, Osteoarthritis, Arthritis, Benign Paroxysmal Positional Vertigo, Acne, Urinary Tract Infection, Psoriasis, and Impetigo.*

---

## 4. Comprehensive Model Performance & Analytics

### 4.1 Overall Performance Matrix (Test Split & 5-Fold Cross Validation)

All category models were evaluated against a strictly stratified 20% held-out test split ($N=300$ test cases per category, $N=60$ per class) and verified with 5-fold cross-validation.

| Clinical Category | Selected Algorithm | Number of Features | Test Accuracy | Macro F1-Score | Macro Precision | Macro Recall | Multi-Class ROC-AUC | 5-Fold Cross-Validation F1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Category A: Fever** | Logistic Regression | 25 | **86.00%** | **0.8600** | 0.8621 | 0.8600 | **0.9813** | $0.8710 \pm 0.0333$ |
| **Category B: Respiratory** | Extra Trees | 20 | **95.00%** | **0.9503** | 0.9510 | 0.9500 | **0.9938** | $0.9516 \pm 0.0042$ |
| **Category C: Digestive** | Logistic Regression | 20 | **91.33%** | **0.9142** | 0.9171 | 0.9133 | **0.9921** | $0.9248 \pm 0.0099$ |
| **Category D: Skin** | Logistic Regression | 20 | **99.00%** | **0.9900** | 0.9902 | 0.9900 | **0.9996** | $0.9933 \pm 0.0062$ |
| **Category E: Urinary Tract** | Logistic Regression | 20 | **97.33%** | **0.9734** | 0.9735 | 0.9733 | **0.9976** | $0.9759 \pm 0.0061$ |
| **System Macro Average** | — | **105 Total** | **93.73%** | **0.9376** | **0.9388** | **0.9373** | **0.9929** | **0.9433** |

---

### 4.2 Algorithm Selection Benchmark (Model Tournament)

During development, four distinct candidate architectures were trained and benchmarked across every category to determine the optimal production model:

```
Test Accuracy by Algorithm & Category:
Category A (Fever):       LogReg (86.0%) > GradBoost (83.7%) > ExtraTrees (83.0%) > RandomForest (82.7%)
Category B (Respiratory): ExtraTrees (95.0%) > LogReg (94.7%) > GradBoost (94.7%) > RandomForest (94.3%)
Category C (Digestive):   LogReg (91.3%) > GradBoost (89.7%) > ExtraTrees (89.3%) > RandomForest (89.0%)
Category D (Skin):        LogReg (99.0%) = ExtraTrees (99.0%) = RandomForest (99.0%) > GradBoost (96.3%)
Category E (Urinary):     LogReg (97.3%) > ExtraTrees (96.3%) > GradBoost (96.7%) > RandomForest (96.0%)
```

---

### 4.3 Granular Per-Disease Performance Metrics

#### Category A: Fever Diseases ($N=300$)
| Condition | Precision | Recall | F1-Score | Support ($N$) | Diagnostic Hallmark Separation |
|---|:---:|:---:|:---:|:---:|---|
| **Chikungunya** | 81.82% | 90.00% | 0.8571 | 60 | High sensitivity driven by severe joint pain feature |
| **Dengue** | 84.21% | 80.00% | 0.8205 | 60 | Key positive attribution: retro-orbital pain + petechiae |
| **Malaria** | 82.26% | 85.00% | 0.8361 | 60 | Key positive attribution: cyclical paroxysmal rigors + sweating |
| **Typhoid** | 92.59% | 83.33% | 0.8772 | 60 | Highest precision in category; abdominal pain + constipation |
| **Viral Fever** | 90.16% | 91.67 | 0.9091 | 60 | Upper respiratory involvement (rhinorrhea, cough) separates from Dengue |

#### Category B: Respiratory Diseases ($N=300$)
| Condition | Precision | Recall | F1-Score | Support ($N$) | Diagnostic Hallmark Separation |
|---|:---:|:---:|:---:|:---:|---|
| **Asthma** | 96.55% | 93.33% | 0.9492 | 60 | Isolated wheeze and trigger associations |
| **Bronchitis** | 88.89% | 93.33% | 0.9106 | 60 | Productive cough duration without consolidation signs |
| **Common Cold** | 98.33% | 98.33% | 0.9833 | 60 | Prominent sneezing + runny nose with afebrile profile |
| **Influenza** | 93.44% | 95.00% | 0.9421 | 60 | Severe myalgia + acute prostration differentiates from Cold |
| **Pneumonia** | 98.28% | 95.00% | 0.9661 | 60 | High fever + pleuritic chest pain + purulent sputum |

#### Category C: Digestive Diseases ($N=300$)
| Condition | Precision | Recall | F1-Score | Support ($N$) | Diagnostic Hallmark Separation |
|---|:---:|:---:|:---:|:---:|---|
| **Acid Reflux (GERD)** | 94.92% | 93.33% | 0.9412 | 60 | Post-prandial recumbency worsening + retrosternal burn |
| **Gastritis** | 77.94% | 88.33% | 0.8281 | 60 | Moderate overlap with Peptic Ulcer Disease |
| **Gastroenteritis** | 98.33% | 98.33% | 0.9833 | 60 | High acuity; watery diarrhea + vomiting + hypermotility |
| **IBS** | 98.28% | 95.00% | 0.9661 | 60 | Pain relief upon defecation + stool mucus |
| **Peptic Ulcer Disease**| 89.09% | 81.67% | 0.8522 | 60 | Nocturnal hunger pain relieved by food intake |

#### Category D: Skin Diseases ($N=300$)
| Condition | Precision | Recall | F1-Score | Support ($N$) | Diagnostic Hallmark Separation |
|---|:---:|:---:|:---:|:---:|---|
| **Acne** | 100.00% | 100.00% | 1.0000 | 60 | Comedonal morphology is pathognomonic |
| **Eczema** | 98.33% | 98.33% | 0.9833 | 60 | Flexural pruritic eczema vs. extensor plaques |
| **Fungal Infection** | 100.00% | 96.67% | 0.9831 | 60 | Annular active borders with central clearing |
| **Psoriasis** | 96.77% | 100.00% | 0.9836 | 60 | Silvery micaceous scale on extensor surfaces |
| **Urticaria (Hives)** | 100.00% | 100.00% | 1.0000 | 60 | Transient fleeting wheals resolving < 24 hrs |

#### Category E: Urinary Tract Diseases ($N=300$)
| Condition | Precision | Recall | F1-Score | Support ($N$) | Diagnostic Hallmark Separation |
|---|:---:|:---:|:---:|:---:|---|
| **BPH** | 100.00% | 98.33% | 0.9916 | 60 | Obstructive voiding stream profile |
| **Pyelonephritis** | 96.61% | 95.00% | 0.9580 | 60 | Costovertebral angle flank tenderness + fever rigors |
| **Kidney Stones** | 98.36% | 100.00% | 0.9917 | 60 | Acute radiating renal colic + hematuria |
| **Overactive Bladder** | 98.33% | 98.33% | 0.9833 | 60 | Urgency without burning dysuria |
| **UTI (Cystitis)** | 93.44% | 95.00% | 0.9421 | 60 | Painful dysuria + suprapubic burning |

---

## 5. Explainable AI (XAI) & Attribution Analytics

To ensure clinical transparency, every inference includes feature-level attributions:
1. **Mathematical Attribution**:
   - For tree models (Respiratory `ExtraTrees`), exact **SHAP (SHapley Additive exPlanations)** values are computed via `shap.TreeExplainer`:
     $$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F|-|S|-1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
   - For linear models (Fever, Digestive, Skin, Urinary `LogisticRegression`), exact log-odds contribution scores are calculated as:
     $$\text{Contribution}_i = w_{c, i} \cdot x_i$$
2. **Visual Presentation**:
   - In the patient frontend (`AiTriage.jsx` and `ShapContributionChart.jsx`), attributions are rendered as horizontal divergent bar charts:
     - **Green (+) Bars**: Clinical signs strongly confirming and driving prediction toward the primary condition.
     - **Red (-) Bars**: Present or absent signs that reduce likelihood or rule out competing conditions.

---

## 6. Clinical Safety & Human-in-the-Loop Philosophy

```
  [ Patient Reports Symptoms ]
               │
               ▼
   [ 22 Red-Flag Emergency Checks ] ──(Triggered)──> [ Immediate Hospital / EMS Escalation ]
               │ (Clear)
               ▼
   [ 5-Category Triage Classifier ]
               │
               ▼
   [ Top-3 Probabilistic Conditions + XAI Attributions + Urgency Score (1-10) ]
               │
               ▼
   [ 5-Factor Dynamic Doctor Matching: Urgency (40%), Specialty (25%), Availability (20%) ]
               │
               ▼
   [ Attending Licensed Physician Final Diagnosis & Digital Prescription Finalization ]
```

> **Mandatory Disclaimer**: All outputs from the E-Sanjeevani 2.0 AI models serve strictly as **clinical decision support (CDSS)** and pre-consultation triage. They do not substitute for definitive in-person laboratory, radiological, or physician examinations. The final diagnosis, prescription issuance, and clinical authority rest exclusively with the attending licensed medical doctor.

