# ============================================================
# E-Sanjeevani 2.0 — Unified Triage AI Model Server
# ============================================================
# Serves the Unified E-Sanjeevani Triage Pipeline on port 8000.
# Orchestrates 5 category-specific clinical models:
#   - Category A: Fever (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever)
#   - Category B: Respiratory (Common Cold, Asthma, Pneumonia, Bronchitis, Influenza)
#   - Category C: Digestive (Gastroenteritis, GERD, Gastritis, Peptic Ulcer, IBS)
#   - Category D: Skin (Acne, Eczema, Psoriasis, Fungal Skin Infection, Urticaria)
#   - Category E: Urinary Tract (UTI, Kidney Stones, Pyelonephritis, OAB, BPH)
# ============================================================

import os
import sys
import traceback
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

# Force UTF-8 stdout/stderr encoding on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ─────────────────────────────────────────────────────────────────────────────
# CLINICAL METADATA & CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_KEYS = ["fever", "respiratory", "digestive", "skin", "urinary_tract"]

CATEGORY_CONFIG = {
    "fever": {
        "name": "Category A: Fever",
        "title": "Fever & Systemic Infectious Illnesses",
        "specialist": "General Physician / Infectious Disease Specialist",
        "icon": "Thermometer",
    },
    "respiratory": {
        "name": "Category B: Respiratory Diseases",
        "title": "Respiratory & Pulmonary Conditions",
        "specialist": "Pulmonologist / Chest Physician",
        "icon": "Wind",
    },
    "digestive": {
        "name": "Category C: Digestive Diseases",
        "title": "Gastroenterological & Digestive Disorders",
        "specialist": "Gastroenterologist",
        "icon": "Activity",
    },
    "skin": {
        "name": "Category D: Skin Diseases",
        "title": "Dermatological & Cutaneous Conditions",
        "specialist": "Dermatologist",
        "icon": "Sparkles",
    },
    "urinary_tract": {
        "name": "Category E: Urinary Tract Diseases",
        "title": "Urological & Renal Conditions",
        "specialist": "Urologist / Nephrologist",
        "icon": "ShieldAlert",
    },
}

RED_FLAGS = {
    # Fever
    "severe_abdominal_pain": "Severe / Unbearable Abdominal Pain",
    "persistent_vomiting": "Persistent Vomiting (Cannot retain fluids)",
    "bleeding": "Bleeding (Gums, Nose, or Red Spots on Skin)",
    "blood_in_vomit": "Blood in Vomit (Coffee-ground appearance)",
    "blood_in_stool": "Blood in Stool or Black Tarry Stool",
    "fainting": "Fainting or Syncope",
    "cold_clammy_skin": "Cold, Clammy Extremities / Signs of Shock",
    "severe_weakness": "Severe Weakness / Inability to Stand",
    # Respiratory
    "breathing_difficulty": "Severe Difficulty Breathing / Gasping for Air",
    "rapid_breathing": "Rapid or Shallow Breathing",
    "cyanosis_blue_lips": "Bluish Discoloration of Lips or Fingernails",
    "coughing_blood": "Coughing up Blood or Bloody Phlegm",
    "chest_pain_severe": "Crushing or Severe Constant Chest Pain",
    # Digestive
    "unbearable_rigid_abdomen": "Rigid, Board-like, or Unbearable Abdomen",
    "unable_to_swallow_fluids": "Complete Inability to Swallow Liquids",
    # Skin
    "airway_or_facial_swelling": "Swelling of Face, Lips, Tongue, or Throat (Angioedema / Anaphylaxis)",
    "skin_sloughing_blisters": "Widespread Peeling, Blistering, or Skin Detachment",
    "spreading_purple_rash": "Rapidly Spreading Purple/Dark Spots with Fever (Purpura/Petechiae)",
    # Urinary
    "acute_urinary_retention": "Complete Inability to Pass Urine with Painful Distension",
    "heavy_blood_clots_in_urine": "Passage of Frank Blood Clots in Urine",
    "urosepsis_rigors": "High Shaking Chills with Flank Pain and Confusion",
    # Neurological / General
    "confusion": "Acute Confusion, Delirium, or Extreme Lethargy",
    "loss_of_consciousness": "Loss of Consciousness or Unresponsiveness",
}

MEDICAL_DISCLAIMER = (
    "This assessment is an AI-assisted clinical differential guide for informational "
    "and educational prototyping. It does NOT constitute a confirmed medical diagnosis. "
    "Different conditions share overlapping symptoms and can only be validated through "
    "in-person clinical examination, laboratory tests, and imaging by a certified doctor."
)

# ─────────────────────────────────────────────────────────────────────────────
# LAZY ARTIFACT LOADERS (Memory Efficient)
# ─────────────────────────────────────────────────────────────────────────────

_models = {}
_encoders = {}
_feature_names = {}
_metadata = {}

def get_category_artifacts(category_key: str):
    """Lazily load model, label encoder, and feature names for a given category."""
    if category_key not in CATEGORY_KEYS:
        return None, None, None, None

    if category_key not in _models:
        model_file = os.path.join(MODELS_DIR, f"{category_key}_model.pkl")
        encoder_file = os.path.join(MODELS_DIR, f"{category_key}_label_encoder.pkl")
        features_file = os.path.join(MODELS_DIR, f"{category_key}_feature_names.pkl")
        meta_file = os.path.join(MODELS_DIR, f"{category_key}_metadata.json")

        if not (os.path.exists(model_file) and os.path.exists(encoder_file) and os.path.exists(features_file)):
            print(f"[WARN] Artifacts not found for category: {category_key}")
            return None, None, None, None

        try:
            print(f"[LAZY LOAD] Loading model artifacts for: {category_key}...")
            _models[category_key] = joblib.load(model_file)
            _encoders[category_key] = joblib.load(encoder_file)
            _feature_names[category_key] = joblib.load(features_file)
            if os.path.exists(meta_file):
                with open(meta_file, "r", encoding="utf-8") as f:
                    _metadata[category_key] = json.load(f)
            else:
                _metadata[category_key] = {}
            print(f"[LAZY LOAD] Successfully loaded {category_key} model.")
        except Exception as e:
            print(f"[ERROR] Failed loading {category_key} model: {e}")
            return None, None, None, None

    return (
        _models.get(category_key),
        _encoders.get(category_key),
        _feature_names.get(category_key),
        _metadata.get(category_key, {}),
    )


# ─────────────────────────────────────────────────────────────────────────────
# INPUT NORMALIZATION & VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def normalize_symptom_inputs(raw_symptoms) -> dict:
    """
    Normalizes symptoms from various formats (dict, list, or free-text)
    into a standardized dictionary of { symptom_key: 1 }.
    """
    normalized = {}

    if isinstance(raw_symptoms, dict):
        for k, v in raw_symptoms.items():
            if isinstance(v, dict):
                # Nested category dict: e.g. { "fever": { "chills": 1 } }
                for sub_k, sub_v in v.items():
                    key = str(sub_k).strip().lower().replace("-", "_").replace(" ", "_")
                    if bool(sub_v) and sub_v not in (0, "0", "false", "False", False):
                        normalized[key] = 1
            else:
                key = str(k).strip().lower().replace("-", "_").replace(" ", "_")
                if bool(v) and v not in (0, "0", "false", "False", False):
                    normalized[key] = 1

    elif isinstance(raw_symptoms, list):
        for item in raw_symptoms:
            if isinstance(item, str):
                key = item.strip().lower().replace("-", "_").replace(" ", "_")
                if key:
                    normalized[key] = 1
            elif isinstance(item, dict):
                k = item.get("key") or item.get("symptom") or item.get("name")
                if k:
                    key = str(k).strip().lower().replace("-", "_").replace(" ", "_")
                    normalized[key] = 1

    elif isinstance(raw_symptoms, str):
        # Free-text parsing: extract matching words against all known category features
        text_lower = raw_symptoms.lower()
        for cat in CATEGORY_KEYS:
            _, _, features, _ = get_category_artifacts(cat)
            if features:
                for f in features:
                    readable = f.replace("_", " ")
                    if f in text_lower or readable in text_lower:
                        normalized[f] = 1

    return normalized


def check_red_flags(red_flags_input) -> list:
    """Returns list of detected red flag keys from list, dict, or flags."""
    detected = []
    if isinstance(red_flags_input, list):
        for rf in red_flags_input:
            key = str(rf).strip().lower().replace("-", "_").replace(" ", "_")
            if key in RED_FLAGS:
                detected.append(key)
    elif isinstance(red_flags_input, dict):
        for rf, val in red_flags_input.items():
            key = str(rf).strip().lower().replace("-", "_").replace(" ", "_")
            if (val is True or val == 1 or val == "1" or val == "true") and key in RED_FLAGS:
                detected.append(key)
    return detected


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY SELECTION & ROUTING MECHANISM
# ─────────────────────────────────────────────────────────────────────────────

def determine_relevant_categories(normalized_symptoms: dict, explicit_category: str = None) -> list:
    """
    Explicit, documented category-selection routing:
    1. If explicit_category is provided and valid, route directly to that category.
    2. Otherwise, calculate symptom feature overlaps against each category's defined vocabulary.
    3. Return all categories that have a meaningful match (count >= 1), ranked by overlap count.
    """
    if explicit_category and explicit_category in CATEGORY_KEYS:
        return [explicit_category]

    category_scores = {}
    for cat in CATEGORY_KEYS:
        _, _, features, _ = get_category_artifacts(cat)
        if not features:
            continue
        feat_set = set(features)
        matching = [s for s in normalized_symptoms if s in feat_set]
        category_scores[cat] = len(matching)

    # Sort categories by matching symptom count descending
    sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)

    # Select categories with at least 1 matching symptom
    relevant = [cat for cat, count in sorted_cats if count >= 1]

    # If no symptoms match any category vocabulary, return empty list
    return relevant


def build_category_feature_vector(normalized_symptoms: dict, feature_names: list) -> pd.DataFrame:
    """Builds an exact-ordered, uint8-compatible DataFrame for the target model."""
    row = {f: (1 if normalized_symptoms.get(f, 0) == 1 else 0) for f in feature_names}
    return pd.DataFrame([row])


def get_feature_explanations(model, feature_names: list, feature_df: pd.DataFrame, normalized_symptoms: dict, top_class_idx: int, top_n: int = 5):
    """Extracts top positive symptom contributors for explainability."""
    contributions = []
    active_features = [f for f in feature_names if normalized_symptoms.get(f, 0) == 1]

    if hasattr(model, "coef_"):
        try:
            weights = model.coef_[top_class_idx]
            feat_weight_map = dict(zip(feature_names, weights))
            active_weights = {f: float(feat_weight_map.get(f, 0)) for f in active_features}
            sorted_feats = sorted(active_weights.items(), key=lambda x: x[1], reverse=True)
            for f, val in sorted_feats[:top_n]:
                contributions.append({
                    "feature": f,
                    "label": f.replace("_", " ").title(),
                    "impact": round(val, 4),
                    "value": round(val, 4),
                    "direction": "positive" if val >= 0 else "negative",
                })
        except Exception:
            pass

    elif hasattr(model, "feature_importances_"):
        try:
            importances = model.feature_importances_
            feat_imp_map = dict(zip(feature_names, importances))
            active_imps = {f: float(feat_imp_map.get(f, 0)) for f in active_features}
            sorted_feats = sorted(active_imps.items(), key=lambda x: x[1], reverse=True)
            for f, val in sorted_feats[:top_n]:
                contributions.append({
                    "feature": f,
                    "label": f.replace("_", " ").title(),
                    "impact": round(val, 4),
                    "value": round(val, 4),
                    "direction": "positive",
                })
        except Exception:
            pass

    if not contributions:
        for f in active_features[:top_n]:
            contributions.append({
                "feature": f,
                "label": f.replace("_", " ").title(),
                "impact": 1.0,
                "value": 1.0,
                "direction": "positive",
            })

    bullets = [c["label"] for c in contributions if c.get("direction") == "positive" or c.get("impact", 0) > 0]
    return bullets, contributions


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "success": True,
        "name": "E-Sanjeevani 2.0 Unified Triage AI Server",
        "description": "Multi-category clinical disease triage across 5 categories with 25 diseases",
        "categories": CATEGORY_KEYS,
        "endpoints": {
            "predict_triage": "POST /predict-triage",
            "predict_category": "POST /predict-category",
            "health": "GET /triage-health",
            "categories_metadata": "GET /categories",
            "legacy_fever": "POST /predict-fever",
        },
    })


@app.route("/triage-health", methods=["GET"])
def triage_health():
    category_status = {}
    for cat in CATEGORY_KEYS:
        model, le, feats, _ = get_category_artifacts(cat)
        category_status[cat] = {
            "ready": model is not None,
            "classes": list(le.classes_) if le else [],
            "num_features": len(feats) if feats else 0,
        }

    all_ready = all(s["ready"] for s in category_status.values())
    return jsonify({
        "success": True,
        "all_models_ready": all_ready,
        "categories": category_status,
    })


@app.route("/fever-health", methods=["GET"])
def fever_health():
    """Backward-compatible health endpoint for fever triage references."""
    model, le, feats, _ = get_category_artifacts("fever")
    ready = model is not None
    return jsonify({
        "success": True,
        "fever_model_ready": ready,
        "classes": list(le.classes_) if ready else [],
        "features": feats if ready else [],
    })


@app.route("/categories", methods=["GET"])
def get_categories():
    """Returns detailed category definitions, classes, features, and red flags."""
    result = {}
    for cat in CATEGORY_KEYS:
        _, le, feats, meta = get_category_artifacts(cat)
        cfg = CATEGORY_CONFIG.get(cat, {})
        result[cat] = {
            "key": cat,
            "name": cfg.get("name", cat.title()),
            "title": cfg.get("title", cat.title()),
            "specialist": cfg.get("specialist", "General Physician"),
            "classes": list(le.classes_) if le else meta.get("classes", []),
            "features": feats if feats else meta.get("features", []),
            "algorithm": meta.get("selected_algorithm", "Trained ML Classifier"),
        }

    return jsonify({
        "success": True,
        "categories": result,
        "red_flags": RED_FLAGS,
    })


@app.route("/predict-triage", methods=["POST"])
def predict_triage():
    """
    Main Unified E-Sanjeevani Triage Pipeline:
    1. Parse and normalize symptoms.
    2. Check emergency red-flag conditions.
    3. Route to relevant category or categories.
    4. Execute prediction on exact feature space for each category.
    5. Return candidate conditions, scores, feature contributions, and next steps.
    """
    try:
        data = request.get_json() or {}
        raw_symptoms = data.get("symptoms", {})
        red_flags_data = data.get("red_flags", {})
        explicit_cat = data.get("category")
        if explicit_cat:
            explicit_cat = str(explicit_cat).strip().lower().replace("-", "_").replace(" ", "_")

        # Step 1: Red-flag emergency detection
        triggered_red_flags = check_red_flags(red_flags_data)
        if triggered_red_flags:
            flag_labels = [RED_FLAGS.get(f, f.replace("_", " ").title()) for f in triggered_red_flags]
            print(f"[TRIAGE EMERGENCY ALERT] Red flags triggered: {triggered_red_flags}")
            return jsonify({
                "success": True,
                "red_flag_alert": True,
                "urgency_level": "critical",
                "red_flag_message": (
                    "CRITICAL MEDICAL ALERT: One or more acute emergency danger signs detected. "
                    "Immediate medical intervention or emergency hospital care is required."
                ),
                "red_flags_detected": flag_labels,
                "recommended_action": (
                    "Proceed immediately to the nearest Emergency Department or call local ambulance services. "
                    "Do not wait for appointment scheduling."
                ),
                "disclaimer": "Emergency triage escalation alert. Not a substitute for urgent clinical intervention.",
            })

        # Step 2: Input normalization
        normalized_symptoms = normalize_symptom_inputs(raw_symptoms)
        reported_symptom_keys = list(normalized_symptoms.keys())

        # Step 3: Category Routing
        target_categories = determine_relevant_categories(normalized_symptoms, explicit_cat)

        # Insufficient information handling
        if not target_categories:
            return jsonify({
                "success": True,
                "red_flag_alert": False,
                "insufficient_information": True,
                "message": (
                    "We need more details to accurately identify the relevant clinical area. "
                    "Please select a category or describe your symptoms below:"
                ),
                "guidance_questions": [
                    {"category": "fever", "question": "Are you experiencing elevated body temperature, chills, sweating, or acute fever?"},
                    {"category": "respiratory", "question": "Do you have cough, shortness of breath, wheezing, sore throat, or chest tightness?"},
                    {"category": "digestive", "question": "Are you experiencing heartburn, stomach pain, nausea, vomiting, or bowel changes?"},
                    {"category": "skin", "question": "Do you have a rash, itchy skin, redness, flaking, or skin eruptions?"},
                    {"category": "urinary_tract", "question": "Are you having burning during urination, urinary urgency, frequency, or flank pain?"},
                ],
                "available_categories": [
                    {"key": k, "label": CATEGORY_CONFIG[k]["title"]} for k in CATEGORY_KEYS
                ],
            })

        # Step 4 & 5: Evaluate each relevant category
        category_assessments = []

        for cat in target_categories:
            model, le, feat_names, meta = get_category_artifacts(cat)
            if model is None:
                continue

            # Build exact feature vector in expected order
            feat_df = build_category_feature_vector(normalized_symptoms, feat_names)

            # Predict probabilities
            proba = model.predict_proba(feat_df)[0]
            classes = le.classes_
            ranked_indices = np.argsort(proba)[::-1]

            top_candidates = []
            for rank_i, idx in enumerate(ranked_indices[:3], start=1):
                raw_disease = classes[idx]
                score = float(round(proba[idx], 4))
                top_candidates.append({
                    "rank": rank_i,
                    "disease": raw_disease,
                    "label": raw_disease.replace("_", " "),
                    "score": score,
                    "confidence_pct": round(score * 100, 1),
                })

            top_idx = int(ranked_indices[0])
            top_disease = classes[top_idx]
            explanation_bullets, contributions = get_feature_explanations(
                model, feat_names, feat_df, normalized_symptoms, top_idx
            )

            cfg = CATEGORY_CONFIG.get(cat, {})
            category_assessments.append({
                "category": cat,
                "category_name": cfg.get("name", cat.title()),
                "category_title": cfg.get("title", cat.title()),
                "recommended_specialist": cfg.get("specialist", "General Physician"),
                "top_condition": top_disease.replace("_", " "),
                "confidence_pct": top_candidates[0]["confidence_pct"],
                "candidate_ranking": top_candidates,
                "primary_explanation": explanation_bullets,
                "feature_contributions": contributions,
            })

        # Determine primary overall match (highest scoring category top condition)
        primary_assessment = max(category_assessments, key=lambda a: a["confidence_pct"])
        overall_confidence = primary_assessment["confidence_pct"]

        if overall_confidence >= 75:
            urgency_level = "moderate"
        elif overall_confidence >= 50:
            urgency_level = "low"
        else:
            urgency_level = "low"

        recommended_action = (
            f"Consult a {primary_assessment['recommended_specialist']} for proper clinical evaluation "
            f"and confirmatory diagnostic testing."
        )

        return jsonify({
            "success": True,
            "red_flag_alert": False,
            "insufficient_information": False,
            "primary_category": primary_assessment["category"],
            "primary_condition": primary_assessment["top_condition"],
            "urgency_level": urgency_level,
            "overall_confidence": overall_confidence,
            "recommended_specialist": primary_assessment["recommended_specialist"],
            "recommended_action": recommended_action,
            "disclaimer": MEDICAL_DISCLAIMER,
            "reported_symptoms": reported_symptom_keys,
            "assessments": category_assessments,
            # Top ranking for backward-compatibility with older fever UI widgets
            "top_ranking": primary_assessment["candidate_ranking"],
            "primary_explanation": primary_assessment["primary_explanation"],
            "shap_contributions": primary_assessment["feature_contributions"],
            "feature_contributions": primary_assessment["feature_contributions"],
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Unified Triage assessment failed",
            "error": str(e),
        }), 500


@app.route("/predict-category", methods=["POST"])
def predict_category():
    """Direct route for a single chosen category."""
    data = request.get_json() or {}
    category = data.get("category", "fever")
    data["category"] = category
    return predict_triage()


@app.route("/predict-fever", methods=["POST"])
def predict_fever():
    """Backward-compatible route that routes specifically to Category A (Fever)."""
    data = request.get_json() or {}
    data["category"] = "fever"
    return predict_triage()


# ─────────────────────────────────────────────────────────────────────────────
# START SERVER
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("\n=======================================================")
    print(f"E-Sanjeevani 2.0 — Unified Triage AI Server on port {port}")
    print("  POST /predict-triage   - Unified multi-category triage")
    print("  POST /predict-category - Category-specific assessment")
    print("  GET  /triage-health    - Health status of all 5 models")
    print("  GET  /categories       - Metadata & symptom schemas")
    print("  POST /predict-fever    - Backward-compatible fever alias")
    print("=======================================================\n")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )