"""
explain_model.py
================
Standalone SHAP explanation engine for the fever differential model.

Given a symptom feature vector, returns:
  - Per-class SHAP values
  - Human-readable bullet points of "why this disease was ranked here"
  - Top contributing symptoms (positive & negative)

Usage (standalone):
    python scripts/explain_model.py

Or import into app.py:
    from fever_model.scripts.explain_model import get_human_explanation
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR    = os.path.join(SCRIPT_DIR, "..", "..", "models")

# ─────────────────────────────────────────────────────────────────────────────
# HUMAN-READABLE FEATURE LABELS
# (Maps snake_case feature names → plain English for patient-facing output)
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_LABELS = {
    "fever":              "Fever",
    "high_fever":         "High fever",
    "sudden_onset":       "Sudden onset of fever",
    "headache":           "Headache",
    "severe_headache":    "Severe headache",
    "chills":             "Chills / shivering",
    "sweating":           "Profuse sweating",
    "body_pain":          "Body aches",
    "muscle_pain":        "Muscle pain",
    "joint_pain":         "Joint pain",
    "severe_joint_pain":  "Severe joint pain",
    "pain_behind_eyes":   "Pain behind the eyes",
    "rash":               "Skin rash",
    "nausea":             "Nausea",
    "vomiting":           "Vomiting",
    "abdominal_pain":     "Abdominal pain",
    "diarrhea":           "Diarrhoea",
    "constipation":       "Constipation",
    "cough":              "Cough",
    "sore_throat":        "Sore throat",
    "runny_nose":         "Runny nose",
    "fatigue":            "Fatigue",
    "weakness":           "Weakness",
    "swollen_lymph_nodes": "Swollen glands",
    "loss_of_appetite":   "Loss of appetite",
}


def load_explainer():
    """Load model and create SHAP TreeExplainer."""
    try:
        import shap
    except ImportError:
        raise ImportError("SHAP not installed. Run: pip install shap")

    model_path    = os.path.join(MODELS_DIR, "fever_model.pkl")
    encoder_path  = os.path.join(MODELS_DIR, "fever_label_encoder.pkl")
    features_path = os.path.join(MODELS_DIR, "fever_feature_names.pkl")

    model         = joblib.load(model_path)
    le            = joblib.load(encoder_path)
    feature_names = joblib.load(features_path)
    explainer     = shap.TreeExplainer(model)

    return explainer, le, feature_names


def get_human_explanation(
    feature_vector: dict,
    model,
    explainer,
    le,
    feature_names: list,
    top_n: int = 5,
) -> dict:
    """
    Given a symptom feature vector (dict), returns human-readable explanations
    for each disease ranking.

    Returns:
        dict with keys:
            - 'top_3':     List of top-3 disease rankings with scores
            - 'explained': List of plain-English bullet points for #1 disease
            - 'all_shap':  Full per-class SHAP breakdown (internal use)
    """
    # Build input DataFrame in correct column order
    input_df = pd.DataFrame([{f: feature_vector.get(f, 0) for f in feature_names}])

    # ── Predictions & probabilities ──────────────────────────────────────────
    proba       = model.predict_proba(input_df)[0]
    class_names = le.classes_

    # Rank all classes by probability
    ranked_indices = np.argsort(proba)[::-1]
    top_3 = []
    for rank_i, idx in enumerate(ranked_indices[:3], start=1):
        top_3.append({
            "rank":    rank_i,
            "disease": class_names[idx],
            "label":   f"{class_names[idx].replace('_', ' ')}-like illness",
            "score":   float(round(proba[idx], 4)),
        })

    # ── SHAP explanation ────────────────────────────────────────────────────
    shap_values = explainer.shap_values(input_df)   # shape: [n_classes, n_samples, n_features]

    # Get SHAP for the #1 ranked class
    top_class_idx   = ranked_indices[0]
    shap_for_top    = shap_values[top_class_idx][0]   # array of shape [n_features]

    # Build feature → SHAP value mapping
    shap_map = dict(zip(feature_names, shap_for_top))

    # Filter: only features user reported (value == 1) with positive SHAP
    active_features = {
        f: v for f, v in shap_map.items()
        if feature_vector.get(f, 0) == 1 and v > 0
    }

    # Sort by absolute SHAP value descending
    sorted_features = sorted(active_features.items(), key=lambda x: abs(x[1]), reverse=True)

    # Convert to plain English
    explained = [FEATURE_LABELS.get(f, f) for f, _ in sorted_features[:top_n]]

    # Also compute per-disease SHAP top features (for internal use)
    all_shap = {}
    for i, cls in enumerate(class_names):
        shap_for_cls = shap_values[i][0]
        cls_map = dict(zip(feature_names, shap_for_cls))
        active = {
            f: v for f, v in cls_map.items()
            if feature_vector.get(f, 0) == 1 and v > 0
        }
        sorted_cls = sorted(active.items(), key=lambda x: abs(x[1]), reverse=True)
        all_shap[cls] = [FEATURE_LABELS.get(f, f) for f, _ in sorted_cls[:top_n]]

    return {
        "top_3":    top_3,
        "explained": explained,
        "all_shap": all_shap,
    }


# ─────────────────────────────────────────────────────────────────────────────
# STANDALONE TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 55)
    print("  Fever SHAP Explanation Engine — Standalone Test")
    print("=" * 55)

    # Example: Dengue-like symptoms
    test_vector = {
        "fever":           1,
        "high_fever":      1,
        "sudden_onset":    1,
        "headache":        1,
        "severe_headache": 1,
        "pain_behind_eyes": 1,
        "muscle_pain":     1,
        "joint_pain":      1,
        "nausea":          1,
        "rash":            1,
        "chills":          0,
        "sweating":        0,
        "constipation":    0,
        "cough":           0,
        "sore_throat":     0,
        "runny_nose":      0,
    }

    explainer, le, feature_names = load_explainer()
    model = joblib.load(os.path.join(MODELS_DIR, "fever_model.pkl"))

    result = get_human_explanation(test_vector, model, explainer, le, feature_names)

    print("\n  TOP 3 RANKING:")
    for r in result["top_3"]:
        print(f"    #{r['rank']}  {r['disease']:<18}  score={r['score']:.3f}")

    print("\n  WHY #1 WAS CONSIDERED:")
    for bullet in result["explained"]:
        print(f"    • {bullet}")

    print()
