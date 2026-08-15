# ============================================================
# E-Sanjeevani — Unified AI Model Server
# ============================================================
# Serves two AI modules on a SINGLE port (8000):
#
#   Module 1 — General Disease Predictor
#     POST /predict          text symptoms -> disease prediction
#
#   Module 2 — Fever Differential Assessment (ML)
#     POST /predict-fever    binary symptom vector -> top-3 ranked
#                            fever diseases + SHAP explanations
#     GET  /fever-health     fever model health check
#
# ============================================================

import os
import sys
import traceback

# Force UTF-8 stdout/stderr encoding on Windows to prevent UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 1 — GENERAL DISEASE MODEL
# ─────────────────────────────────────────────────────────────────────────────

print("\n==========================================")
print("Loading General Disease Predictor...")
print("==========================================")

try:
    general_model         = joblib.load(os.path.join(MODELS_DIR, "disease_model.pkl"))
    general_label_encoder = joblib.load(os.path.join(MODELS_DIR, "disease_label_encoder.pkl"))
    symptom_columns       = joblib.load(os.path.join(MODELS_DIR, "symptom_columns.pkl"))
    print("[OK] disease_model.pkl         loaded")
    print("[OK] disease_label_encoder.pkl loaded")
    print("[OK] symptom_columns.pkl       loaded")
    GENERAL_MODEL_READY = True
except Exception as e:
    print(f"[WARN] General disease model failed to load: {e}")
    GENERAL_MODEL_READY = False

try:
    disease_map = joblib.load(os.path.join(MODELS_DIR, "disease_map.pkl"))
    print("[OK] disease_map.pkl           loaded")
except Exception:
    disease_map = {}

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 2 — FEVER DIFFERENTIAL ASSESSMENT MODEL
# ─────────────────────────────────────────────────────────────────────────────

print("\n==========================================")
print("Loading Fever Differential Assessment Model...")
print("==========================================")

try:
    fever_model         = joblib.load(os.path.join(MODELS_DIR, "fever_model.pkl"))
    fever_label_encoder = joblib.load(os.path.join(MODELS_DIR, "fever_label_encoder.pkl"))
    fever_feature_names = joblib.load(os.path.join(MODELS_DIR, "fever_feature_names.pkl"))
    print("[OK] fever_model.pkl           loaded")
    print("[OK] fever_label_encoder.pkl   loaded")
    print("[OK] fever_feature_names.pkl   loaded")
    FEVER_MODEL_READY = True
except Exception as e:
    print(f"[WARN] Fever model not ready yet — run train_model.py first: {e}")
    FEVER_MODEL_READY = False

# SHAP / Feature Explainer (lazy-loaded)
_fever_explainer = None

def get_fever_explainer():
    global _fever_explainer
    if _fever_explainer is None and FEVER_MODEL_READY:
        try:
            if hasattr(fever_model, "estimators_") or hasattr(fever_model, "tree_"):
                import shap
                _fever_explainer = shap.TreeExplainer(fever_model)
                print("[OK] SHAP TreeExplainer initialised")
            elif hasattr(fever_model, "coef_"):
                _fever_explainer = "linear_coef"
                print("[OK] Linear Coefficient Explainer initialised")
        except Exception:
            pass
    return _fever_explainer

# ─────────────────────────────────────────────────────────────────────────────
# FEVER MODEL — CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

# Red-flag warning signs that require IMMEDIATE medical attention
# (WHO: severe dengue, severe malaria, other emergencies)
RED_FLAGS = [
    "severe_abdominal_pain",
    "persistent_vomiting",
    "bleeding",
    "blood_in_vomit",
    "blood_in_stool",
    "breathing_difficulty",
    "rapid_breathing",
    "confusion",
    "loss_of_consciousness",
    "fainting",
    "cold_clammy_skin",
    "severe_weakness",
]

# Human-readable labels for features
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

# Specialist recommendation per disease
DISEASE_SPECIALISTS = {
    "Dengue":       "General Physician / Infectious Disease Specialist",
    "Malaria":      "General Physician / Infectious Disease Specialist",
    "Typhoid":      "General Physician / Gastroenterologist",
    "Chikungunya":  "General Physician / Rheumatologist",
    "Viral_Fever":  "General Physician",
}

MEDICAL_DISCLAIMER = (
    "This is a symptom-based differential assessment only - not a clinical diagnosis. "
    "Dengue, Malaria, Chikungunya and other febrile illnesses share overlapping symptoms "
    "and cannot be reliably distinguished without appropriate clinical evaluation and "
    "laboratory testing. Please consult a qualified healthcare professional."
)

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS — GENERAL MODEL
# ─────────────────────────────────────────────────────────────────────────────

def prepare_general_input(symptoms_text):
    """Convert free-text symptoms into binary symptom vector."""
    user_input = symptoms_text.lower()
    input_data = {}
    for symptom in symptom_columns:
        input_data[symptom] = 1 if symptom.lower() in user_input else 0
    return pd.DataFrame([input_data])


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS — FEVER MODEL
# ─────────────────────────────────────────────────────────────────────────────

def check_red_flags(red_flag_data: dict) -> list:
    """Return list of triggered red-flag keys."""
    return [flag for flag in RED_FLAGS if red_flag_data.get(flag, False)]


def build_feature_df(symptom_vector: dict) -> pd.DataFrame:
    """Build feature DataFrame in the correct column order."""
    row = {f: int(symptom_vector.get(f, 0)) for f in fever_feature_names}
    return pd.DataFrame([row])


def get_shap_explanation(feature_df: pd.DataFrame, symptom_vector: dict, top_class_idx: int, top_n: int = 5) -> list:
    """
    Return plain-English bullet points of symptoms that drove the top-ranked prediction.
    Supports SHAP, Linear Model Coefficients (LogisticRegression), and Tree Feature Importances (RandomForest/XGBoost).
    """
    # Attempt 1: Tree SHAP Explainer (Random Forest / XGBoost)
    explainer = get_fever_explainer()
    if explainer is not None and explainer != "linear_coef":
        try:
            import numpy as np
            shap_values = explainer.shap_values(feature_df)

            if isinstance(shap_values, list):
                shap_for_top = np.array(shap_values[top_class_idx])[0]
            else:
                shap_arr = np.array(shap_values)
                if shap_arr.ndim == 3:
                    shap_for_top = shap_arr[0, :, top_class_idx]
                else:
                    shap_for_top = shap_arr[0]

            shap_map = dict(zip(fever_feature_names, shap_for_top))
            active = {
                f: v for f, v in shap_map.items()
                if symptom_vector.get(f, 0) == 1 and v > 0
            }
            sorted_features = sorted(active.items(), key=lambda x: abs(x[1]), reverse=True)
            if sorted_features:
                return [FEATURE_LABELS.get(f, f) for f, _ in sorted_features[:top_n]]
        except Exception as shap_err:
            print(f"[INFO] SHAP explanation note ({shap_err}) — using model weight attribution")

    # Attempt 2: Linear Model Coefficients (Logistic Regression)
    if hasattr(fever_model, "coef_"):
        try:
            weights = fever_model.coef_[top_class_idx]
            weight_map = dict(zip(fever_feature_names, weights))
            active = {
                f: w for f, w in weight_map.items()
                if symptom_vector.get(f, 0) == 1 and w > 0
            }
            sorted_features = sorted(active.items(), key=lambda x: x[1], reverse=True)
            return [FEATURE_LABELS.get(f, f) for f, _ in sorted_features[:top_n]]
        except Exception as coef_err:
            print(f"[WARN] Coef explanation error: {coef_err}")

    # Attempt 3: Tree Feature Importances (Random Forest / XGBoost)
    if hasattr(fever_model, "feature_importances_"):
        try:
            importances = fever_model.feature_importances_
            imp_map = dict(zip(fever_feature_names, importances))
            active = {
                f: v for f, v in imp_map.items()
                if symptom_vector.get(f, 0) == 1
            }
            sorted_features = sorted(active.items(), key=lambda x: x[1], reverse=True)
            return [FEATURE_LABELS.get(f, f) for f, _ in sorted_features[:top_n]]
        except Exception as imp_err:
            print(f"[WARN] Importance explanation error: {imp_err}")

    return []


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "E-Sanjeevani Unified AI Server",
        "modules": {
            "general_disease":       GENERAL_MODEL_READY,
            "fever_differential":    FEVER_MODEL_READY,
        }
    })


@app.route("/fever-health", methods=["GET"])
def fever_health():
    return jsonify({
        "success": True,
        "fever_model_ready": FEVER_MODEL_READY,
        "classes": list(fever_label_encoder.classes_) if FEVER_MODEL_READY else [],
        "features": fever_feature_names if FEVER_MODEL_READY else [],
    })


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE — GENERAL DISEASE PREDICTION
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
def predict():
    if not GENERAL_MODEL_READY:
        return jsonify({"success": False, "message": "General disease model not loaded"}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No request body found"}), 400

        symptoms = data.get("message") or data.get("symptoms", "")
        symptoms = symptoms.strip()
        if not symptoms:
            return jsonify({"success": False, "message": "Please provide symptoms"}), 400

        print(f"\n[/predict] Symptoms: {symptoms[:80]}")

        input_df    = prepare_general_input(symptoms)
        prediction  = general_model.predict(input_df)[0]
        disease     = general_label_encoder.inverse_transform([prediction])[0]
        proba       = general_model.predict_proba(input_df)[0]
        confidence  = round(float(max(proba)) * 100, 2)

        urgency_score = min(100, int(confidence * 1.2))
        if urgency_score >= 75:
            urgency = "critical"
        elif urgency_score >= 60:
            urgency = "high"
        elif urgency_score >= 40:
            urgency = "medium"
        else:
            urgency = "low"

        doctor_type_map = {
            "fever": "General Physician", "cough": "Pulmonologist",
            "chest pain": "Cardiologist", "headache": "Neurologist",
            "stomach": "Gastroenterologist", "skin": "Dermatologist",
            "joint": "Orthopedic", "eye": "Ophthalmologist",
            "ear": "ENT", "depression": "Psychiatrist",
            "anxiety": "Psychiatrist", "infection": "General Physician",
            "allergy": "Allergist", "asthma": "Pulmonologist",
        }
        doctor_type   = "General Physician"
        disease_lower = disease.lower()
        for key, val in doctor_type_map.items():
            if key in disease_lower or key in symptoms.lower():
                doctor_type = val
                break

        top_indices    = proba.argsort()[-5:][::-1]
        top_predictions = []
        for idx in top_indices:
            top_predictions.append({
                "disease":    general_label_encoder.inverse_transform([idx])[0],
                "confidence": round(float(proba[idx]) * 100, 2),
            })

        summary = (
            f"Based on the symptoms provided, the most likely condition is {disease}. "
            f"Urgency Level: {urgency.upper()} | Recommended Specialist: {doctor_type} | "
            f"Confidence: {confidence}%. Please consult a qualified doctor for proper medical diagnosis."
        )

        return jsonify({
            "success": True,
            "data": {
                "predictedDisease": disease,
                "confidence":       confidence,
                "urgency":          urgency,
                "urgencyScore":     urgency_score,
                "doctorType":       doctor_type,
                "topPredictions":   top_predictions,
                "summary":          summary,
            }
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Prediction failed", "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE — FEVER DIFFERENTIAL ASSESSMENT
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/predict-fever", methods=["POST"])
def predict_fever():
    """
    Fever Differential Assessment endpoint.

    Expected JSON body:
    {
        "symptoms": {
            "fever": 1, "high_fever": 1, "headache": 1,
            "pain_behind_eyes": 1, ...
        },
        "red_flags": {
            "bleeding": false,
            "confusion": false,
            ...
        }
    }
    """
    if not FEVER_MODEL_READY:
        return jsonify({
            "success": False,
            "message": "Fever model not ready. Run fever_model/scripts/train_model.py first."
        }), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No request body"}), 400

        symptom_vector  = data.get("symptoms", {})
        red_flag_data   = data.get("red_flags", {})

        # ── Step 1: Red-flag check ────────────────────────────────────────────
        triggered_flags = check_red_flags(red_flag_data)
        if triggered_flags:
            flag_labels = [f.replace("_", " ").title() for f in triggered_flags]
            print(f"[/predict-fever] [WARN] Red flags triggered: {triggered_flags}")
            return jsonify({
                "success":          True,
                "red_flag_alert":   True,
                "red_flag_message": (
                    "WARNING: One or more serious warning signs detected. "
                    "Please seek immediate medical attention or call emergency services."
                ),
                "red_flags_detected": flag_labels,
            })

        # ── Step 2: Build feature vector ─────────────────────────────────────
        feature_df = build_feature_df(symptom_vector)

        # ── Step 3: Predict ───────────────────────────────────────────────────
        import numpy as np
        proba       = fever_model.predict_proba(feature_df)[0]
        class_names = fever_label_encoder.classes_

        ranked_indices = np.argsort(proba)[::-1]
        top_3 = []
        for rank_i, idx in enumerate(ranked_indices[:3], start=1):
            disease_key = class_names[idx]
            top_3.append({
                "rank":    rank_i,
                "disease": disease_key,
                "label":   disease_key.replace("_", " ") + "-like illness",
                "score":   float(round(proba[idx], 4)),
            })

        # ── Step 4: Explanation ──────────────────────────────────────────────
        top_class_idx = int(ranked_indices[0])
        explanation   = get_shap_explanation(feature_df, symptom_vector, top_class_idx)

        # ── Step 5: Recommended action ───────────────────────────────────────
        top_disease = class_names[ranked_indices[0]]
        recommended = DISEASE_SPECIALISTS.get(top_disease, "General Physician")

        print(f"[/predict-fever] Top result: {top_disease} ({proba[ranked_indices[0]]:.3f})")

        return jsonify({
            "success":           True,
            "red_flag_alert":    False,
            "top_ranking":       top_3,
            "primary_explanation": explanation,
            "disclaimer":        MEDICAL_DISCLAIMER,
            "recommended_action": (
                f"Consult a {recommended} for clinical evaluation and "
                f"appropriate laboratory testing to confirm any diagnosis."
            ),
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Fever assessment failed",
            "error": str(e),
        }), 500


# ─────────────────────────────────────────────────────────────────────────────
# START SERVER
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os

    print("\n==========================================")
    print("E-Sanjeevani Unified AI Server")
    print("  /predict        - General disease model")
    print("  /predict-fever  - Fever differential (ML)")
    print("  /fever-health   - Fever model status")
    print("==========================================\n")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        debug=False
    )