# Testing Patterns
**Analysis Date:** 2026-11-07

## Test Framework

### Test Runners & Verification Tooling

The repository maintains an automated testing and build verification pipeline distributed across the machine learning engine, server backend, and web frontend:

- **Machine Learning & Triage Test Framework:** Python standard library `unittest` with Flask test client integration (`app.test_client()`).
  - Configuration / Test Root: `ai-model/tests/test_unified_triage.py`
  - Assertion Library: Python `unittest.TestCase` native assertions (`assertEqual`, `assertTrue`, `assertIn`, `assertGreater`).
- **Frontend Build & Bundle Verifier:** Vite 8 / Rolldown production compiler.
  - Configuration: `client/vite.config.js`
  - Engine: `@vitejs/plugin-react`
- **Backend Syntax Check:** Native Node.js V8 parser via `node --check`.
  - Targets: `server/src/server.js`, `server/src/app.js`
- **Python Byte-Compilation Verifier:** Python `py_compile` module to ensure zero syntax or import-time regression across ML services.
- **Frontend Static Linter:** ESLint 9 Flat Config (`client/eslint.config.js`).

### Run Commands

#### Python Unit & Integration Tests
```bash
# Run the complete unified triage test suite (all 10 test cases)
cd ai-model
python -m unittest tests/test_unified_triage.py

# Run with verbose output
python -m unittest -v tests/test_unified_triage.py
```

#### Syntax & Compilation Checks
```bash
# Python syntax and compilation validation
cd ai-model
python -m py_compile app.py longitudinal_intelligence.py tests/test_unified_triage.py

# Server-side JavaScript syntax verification
node --check server/src/server.js
node --check server/src/app.js
```

#### Frontend Build & Lint Checks
```bash
# Production client bundle verification (Vite)
cd client
npm run build

# Client static analysis / ESLint verification
cd client
npm run lint
```

---

## Test File Organization

### Directory Layout
```
ai-model/
├── tests/
│   ├── __init__.py
│   └── test_unified_triage.py               # Comprehensive 10-step triage test suite
├── evaluation_results/
│   ├── TRIAGE_MODELS_EVALUATION_REPORT.md   # Official model benchmark & clinical validation report
│   ├── all_categories_summary.json          # Machine-readable per-category evaluation metrics
│   ├── ieee_evaluation_report.md            # IEEE research evaluation report for fever model
│   ├── ieee_fever_eval.py                   # Evaluation script generating confusion matrices
│   ├── confusion_matrix.png                 # Multi-class confusion matrix plot
│   ├── per_class_metrics.csv                # Precision, recall, and F1 per disease class
│   └── shap_summary_bar.png                 # Global feature importance plots
└── scripts/
    └── train_all_categories.py              # Automated dataset synthesis and model training script
```

---

## Test Structure

### Unified Triage Test Suite (`ai-model/tests/test_unified_triage.py`)

The primary integration test suite validates machine learning inference, input transformation, emergency red-flag escalation, and schema compliance across all five clinical categories.

```python
import os
import sys
import unittest
import numpy as np
import pandas as pd

AI_MODEL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, AI_MODEL_DIR)

from app import (
    app,
    get_category_artifacts,
    normalize_symptom_inputs,
    check_red_flags,
    determine_relevant_categories,
    build_category_feature_vector,
    CATEGORY_KEYS,
)

class TestUnifiedTriage(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Configure Flask test client for in-memory HTTP requests
        cls.client = app.test_client()

    def test_01_all_five_category_artifacts_exist(self):
        """Verify that all 5 category models, encoders, and feature lists load properly."""
        for cat in CATEGORY_KEYS:
            model, le, feat_names, meta = get_category_artifacts(cat)
            self.assertIsNotNone(model, f"Model artifact missing for {cat}")
            self.assertIsNotNone(le, f"Label encoder missing for {cat}")
            self.assertIsNotNone(feat_names, f"Feature list missing for {cat}")
            self.assertEqual(len(le.classes_), 5, f"Category {cat} must have exactly 5 classes")
            self.assertGreaterEqual(len(feat_names), 20, f"Category {cat} must have at least 20 features")

    def test_02_health_endpoint(self):
        """GET /triage-health returns status for all 5 models."""
        res = self.client.get("/triage-health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("all_models_ready"))
        categories = data.get("categories", {})
        for cat in CATEGORY_KEYS:
            self.assertIn(cat, categories)
            self.assertTrue(categories[cat]["ready"])
            self.assertEqual(len(categories[cat]["classes"]), 5)

    def test_04_input_normalization(self):
        """Verify normalization works for dicts, lists, and strings."""
        d_norm = normalize_symptom_inputs({"Cough": 1, "sore-throat": True, "Fever": 0})
        self.assertEqual(d_norm.get("cough"), 1)
        self.assertEqual(d_norm.get("sore_throat"), 1)
        self.assertNotIn("fever", d_norm)

    def test_05_feature_alignment_and_ordering(self):
        """Verify feature vector preserves training column order and zero-imputes missing symptoms."""
        for cat in CATEGORY_KEYS:
            _, _, feat_names, _ = get_category_artifacts(cat)
            sample_input = {feat_names[0]: 1}
            df = build_category_feature_vector(sample_input, feat_names)
            self.assertEqual(list(df.columns), feat_names, f"Feature order mismatch in {cat}")
            self.assertEqual(df.iloc[0][feat_names[0]], 1)
            self.assertEqual(df.iloc[0][feat_names[1]], 0)

    def test_06_red_flag_emergency_escalation(self):
        """POST /predict-triage must trigger emergency alert if red flags are present."""
        payload = {
            "symptoms": {"cough": 1, "fever": 1},
            "red_flags": {"bleeding": True, "breathing_difficulty": 1},
        }
        res = self.client.post("/predict-triage", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("red_flag_alert"))
        self.assertEqual(data.get("urgency_level"), "critical")
        self.assertIn("CRITICAL", data.get("red_flag_message", ""))
```

---

## Mocking

### Flask Test Client
- The Flask test harness (`app.test_client()`) provides an in-memory WSGI transport layer that simulates HTTP requests (`GET`, `POST`) without binding a live socket port.
- Headers, JSON payloads, and session contexts are generated without network dependencies.

### Lazy Artifact Loading
- Production models are serialized via `joblib` in `ai-model/models/`. During test execution, `get_category_artifacts(cat_key)` lazy-loads models on demand, caching them in memory across consecutive tests to optimize performance.

---

## Fixtures and Factories

### Category Test Fixtures
Tests execute against canonical symptom dictionaries representing specific disease phenotypes:

- **Fever (Dengue / Malaria Profile):**
  ```python
  {
      "fever": 1,
      "high_fever": 1,
      "pain_behind_eyes": 1,
      "severe_headache": 1,
      "rash": 1
  }
  ```
- **Skin (Acne Vulgaris Profile):**
  ```python
  {
      "comedones_blackheads_whiteheads": 1,
      "facial_chest_back_distribution": 1,
      "oily_skin_seborrhea": 1,
      "inflammatory_papules_pustules": 1
  }
  ```
- **Multi-Category Span (Fever + Respiratory):**
  ```python
  {
      "fever": 1,
      "high_fever": 1,
      "chills": 1,
      "shortness_of_breath": 1,
      "productive_cough": 1,
      "pleuritic_chest_pain": 1
  }
  ```
- **Emergency Red Flag Payload:**
  ```python
  {
      "symptoms": {"cough": 1, "fever": 1},
      "red_flags": {"bleeding": True, "breathing_difficulty": 1}
  }
  ```

---

## Model Evaluation Benchmarks

Evaluation results are systematically tracked in `ai-model/evaluation_results/TRIAGE_MODELS_EVALUATION_REPORT.md` across stratified held-out test sets (300 test cases per category, 60 per class):

| Category | Algorithm | Test Accuracy | Macro F1 | Macro Precision | Macro Recall | ROC-AUC | 5-Fold CV F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Category A: Fever** | Logistic Regression | **86.00%** | 0.8600 | 0.8621 | 0.8600 | 0.9813 | 0.8710 ± 0.0333 |
| **Category B: Respiratory** | Extra Trees | **95.00%** | 0.9503 | 0.9510 | 0.9500 | 0.9938 | 0.9516 ± 0.0042 |
| **Category C: Digestive** | Logistic Regression | **91.33%** | 0.9142 | 0.9171 | 0.9133 | 0.9921 | 0.9248 ± 0.0099 |
| **Category D: Skin** | Logistic Regression | **99.00%** | 0.9900 | 0.9902 | 0.9900 | 0.9996 | 0.9933 ± 0.0062 |
| **Category E: Urinary Tract** | Logistic Regression | **97.33%** | 0.9734 | 0.9735 | 0.9733 | 0.9976 | 0.9759 ± 0.0061 |

### Explainability Artifacts
SHAP (SHapley Additive exPlanations) values are pre-computed for feature attribution:
- `ai-model/evaluation_results/shap_summary_bar.png`: Global feature ranking across all disease categories.
- `ai-model/evaluation_results/shap_beeswarm_[Disease].png`: Per-disease positive and negative symptom contributions.

---

## Test Types

### 1. Unit Tests
- **Symptom Normalization:** Validates string sanitization, hyphen-to-underscore replacement, case-insensitivity, and extraction from dictionary or list formats (`test_04_input_normalization`).
- **Feature Alignment:** Verifies that feature columns precisely match training geometry, fill missing dimensions with zero, and ignore extraneous parameters (`test_05_feature_alignment_and_ordering`).

### 2. Integration Tests
- **Category Routing:** Tests explicit category routing versus multi-category auto-detection (`test_08_explicit_category_routing`, `test_09_auto_multi_category_routing`).
- **Health & Metadata Endpoints:** Validates `GET /triage-health` and `GET /categories` contracts (`test_02_health_endpoint`, `test_03_categories_metadata_endpoint`).
- **Backward Compatibility:** Asserts that legacy endpoints (`POST /predict-fever`) continue to function without breaking existing client integrations (`test_10_backward_compatible_predict_fever`).

### 3. Safety & Emergency Escalation Tests
- **Red Flag Interception:** Guarantees that any life-threatening indicators (e.g., active hemorrhage, severe dyspnea, altered sensorium) instantly trigger `red_flag_alert: true` and escalate urgency to `critical` regardless of model predictions (`test_06_red_flag_emergency_escalation`).
- **Insufficient Information Handling:** Asserts that an empty or ambiguous symptom payload returns a set of targeted clinical guidance questions rather than hallucinations or low-confidence guesses (`test_07_insufficient_information`).

### 4. Build & Static Analysis Gates
- **Vite Client Production Build:** Tests that all 2,600+ frontend modules, CSS modules, and asset bundles compile and tree-shake cleanly into `client/dist`.
- **Node.js Check:** Ensures the Express server files parse cleanly without syntax errors or broken module imports.
- **Python Compilation:** Checks all scripts in `ai-model/` for bytecode compilation integrity.

---

## Common Patterns

### API Test Assertion Pattern
```python
def test_endpoint_pattern(self):
    payload = {"category": "skin", "symptoms": {"rash": 1}}
    res = self.client.post("/predict-triage", json=payload)
    
    # 1. HTTP Status assertion
    self.assertEqual(res.status_code, 200)
    
    # 2. JSON Response assertion
    data = res.get_json()
    self.assertTrue(data.get("success"))
    
    # 3. Contract field verification
    self.assertIn("primary_condition", data)
    self.assertIn("overall_confidence", data)
    self.assertIsInstance(data.get("assessments"), list)
```

### Emergency Alert Assertion Pattern
```python
def test_emergency_escalation(self):
    res = self.client.post("/predict-triage", json={
        "symptoms": {"cough": 1},
        "red_flags": {"chest_pain_severe": True}
    })
    data = res.get_json()
    self.assertTrue(data.get("red_flag_alert"))
    self.assertEqual(data.get("urgency_level"), "critical")
```

---

*Testing analysis: 2026-11-07*
