"""
test_unified_triage.py
======================
Unit & Integration Tests for E-Sanjeevani 2.0 Unified Triage Pipeline:
  - Artifact verification for all 5 categories
  - Feature alignment and ordering verification
  - Input normalization across dicts, lists, strings
  - Red-flag detection and emergency escalation
  - Explicit category routing vs auto multi-category routing
  - Insufficient information handling
  - Prediction accuracy and schema contracts
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd

# Add ai-model root to path
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

    def test_03_categories_metadata_endpoint(self):
        """GET /categories returns full schema and red flags."""
        res = self.client.get("/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("categories", data)
        self.assertIn("red_flags", data)
        self.assertEqual(len(data["categories"]), 5)

    def test_04_input_normalization(self):
        """Verify normalization works for dicts, lists, and strings."""
        # Dict
        d_norm = normalize_symptom_inputs({"Cough": 1, "sore-throat": True, "Fever": 0})
        self.assertEqual(d_norm.get("cough"), 1)
        self.assertEqual(d_norm.get("sore_throat"), 1)
        self.assertNotIn("fever", d_norm)

        # List
        l_norm = normalize_symptom_inputs(["high_fever", "Sudden-Onset", "chills"])
        self.assertEqual(l_norm.get("high_fever"), 1)
        self.assertEqual(l_norm.get("sudden_onset"), 1)
        self.assertEqual(l_norm.get("chills"), 1)

    def test_05_feature_alignment_and_ordering(self):
        """Verify generated feature vector strictly preserves training column order and handles missing values."""
        for cat in CATEGORY_KEYS:
            _, _, feat_names, _ = get_category_artifacts(cat)
            sample_input = {feat_names[0]: 1}  # only first feature present
            df = build_category_feature_vector(sample_input, feat_names)
            self.assertEqual(list(df.columns), feat_names, f"Feature order mismatch in {cat}")
            self.assertEqual(df.iloc[0][feat_names[0]], 1)
            self.assertEqual(df.iloc[0][feat_names[1]], 0)  # missing features must safely default to 0

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

    def test_07_insufficient_information(self):
        """Empty symptoms must return guidance questions instead of guessing."""
        res = self.client.post("/predict-triage", json={"symptoms": {}})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("insufficient_information"))
        self.assertIn("guidance_questions", data)
        self.assertEqual(len(data["guidance_questions"]), 5)

    def test_08_explicit_category_routing(self):
        """Explicitly specifying category routes directly to that model."""
        payload = {
            "category": "skin",
            "symptoms": {
                "comedones_blackheads_whiteheads": 1,
                "facial_chest_back_distribution": 1,
                "oily_skin_seborrhea": 1,
                "inflammatory_papules_pustules": 1,
            },
        }
        res = self.client.post("/predict-triage", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("primary_category"), "skin")
        self.assertEqual(data.get("primary_condition"), "Acne")
        self.assertGreater(data.get("overall_confidence"), 70)

    def test_09_auto_multi_category_routing(self):
        """When symptoms span multiple categories, pipeline evaluates both."""
        payload = {
            "symptoms": {
                # Fever symptoms
                "fever": 1,
                "high_fever": 1,
                "chills": 1,
                # Respiratory symptoms
                "shortness_of_breath": 1,
                "productive_cough": 1,
                "pleuritic_chest_pain": 1,
            }
        }
        res = self.client.post("/predict-triage", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        assessments = data.get("assessments", [])
        categories_detected = [a["category"] for a in assessments]
        self.assertIn("fever", categories_detected)
        self.assertIn("respiratory", categories_detected)

    def test_10_backward_compatible_predict_fever(self):
        """POST /predict-fever must return expected fever differential output."""
        payload = {
            "symptoms": {
                "fever": 1,
                "high_fever": 1,
                "pain_behind_eyes": 1,
                "severe_headache": 1,
                "rash": 1,
            }
        }
        res = self.client.post("/predict-fever", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("primary_category"), "fever")
        self.assertIn("top_ranking", data)
        self.assertIn("primary_explanation", data)
        self.assertIn("recommended_specialist", data)


if __name__ == "__main__":
    unittest.main()
