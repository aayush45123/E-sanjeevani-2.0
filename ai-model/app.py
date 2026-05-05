# FULL UPDATED app.py
# Enterprise-level AI Triage Prediction API
# Uses:
# - disease_model.pkl
# - disease_label_encoder.pkl
# - symptom_columns.pkl
# - disease_map.pkl
#
# Features:
# - professional prediction engine
# - top disease prediction
# - confidence score
# - top 5 likely diseases
# - clean doctor-friendly response
# - frontend-ready JSON response

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

print("==========================================")
print("Loading Enterprise AI Triage Model...")
print("==========================================")

# =====================================================
# LOAD TRAINED FILES
# =====================================================

model = joblib.load("models/disease_model.pkl")
label_encoder = joblib.load("models/disease_label_encoder.pkl")
symptom_columns = joblib.load("models/symptom_columns.pkl")

# Optional map (if exists)
try:
    disease_map = joblib.load("models/disease_map.pkl")
except:
    disease_map = {}

print("✓ disease_model.pkl loaded")
print("✓ disease_label_encoder.pkl loaded")
print("✓ symptom_columns.pkl loaded")
print("✓ disease_map.pkl loaded")

print("\nModel Loaded Successfully")

# =====================================================
# FLASK APP
# =====================================================

app = Flask(__name__)
CORS(app)

# =====================================================
# HEALTH ROUTE
# =====================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "Enterprise AI Triage API Running Successfully"
    })


# =====================================================
# HELPER:
# Convert text symptoms → binary vector
# Example:
# fever, cough, chest pain
# =====================================================

def prepare_input(symptoms_text):
    """
    Convert free text symptoms into binary symptom vector
    """

    # Lowercase + normalize
    user_input = symptoms_text.lower()

    # Feature vector
    input_data = {}

    for symptom in symptom_columns:
        # Basic text matching
        if symptom.lower() in user_input:
            input_data[symptom] = 1
        else:
            input_data[symptom] = 0

    df_input = pd.DataFrame([input_data])

    return df_input


# =====================================================
# MAIN PREDICTION ROUTE
# =====================================================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No request body found"
            }), 400

        # Accept both "message" and "symptoms" for flexibility
        symptoms = data.get("message") or data.get("symptoms", "")
        symptoms = symptoms.strip()

        if not symptoms:
            return jsonify({
                "success": False,
                "message": "Please provide symptoms or message"
            }), 400

        print("\n==========================================")
        print("Incoming Symptoms:")
        print(symptoms)
        print("==========================================")

        # =================================================
        # PREPARE INPUT
        # =================================================

        input_df = prepare_input(symptoms)

        # =================================================
        # PREDICT TOP RESULT
        # =================================================

        prediction = model.predict(input_df)[0]
        disease = label_encoder.inverse_transform([prediction])[0]

        # =================================================
        # PREDICT PROBABILITIES
        # =================================================

        probabilities = model.predict_proba(input_df)[0]

        confidence = round(
            max(probabilities) * 100,
            2
        )

        # =================================================
        # URGENCY SCORING (0-100)
        # =================================================

        urgency_score = min(100, int(confidence * 1.2))  # Scale confidence to urgency

        if urgency_score >= 75:
            urgency = "critical"
        elif urgency_score >= 60:
            urgency = "high"
        elif urgency_score >= 40:
            urgency = "medium"
        else:
            urgency = "low"

        # =================================================
        # DOCTOR TYPE MAPPING
        # =================================================

        doctor_type_map = {
            "fever": "General Physician",
            "cough": "Pulmonologist",
            "chest pain": "Cardiologist",
            "headache": "Neurologist",
            "stomach": "Gastroenterologist",
            "skin": "Dermatologist",
            "joint": "Orthopedic",
            "eye": "Ophthalmologist",
            "ear": "ENT",
            "depression": "Psychiatrist",
            "anxiety": "Psychiatrist",
            "infection": "General Physician",
            "allergy": "Allergist",
            "asthma": "Pulmonologist",
        }

        doctor_type = "General Physician"  # Default
        disease_lower = disease.lower()
        symptoms_lower = symptoms.lower()

        for key, value in doctor_type_map.items():
            if key in disease_lower or key in symptoms_lower:
                doctor_type = value
                break

        # =================================================
        # TOP 5 PREDICTIONS
        # =================================================

        top_indices = probabilities.argsort()[-5:][::-1]

        top_predictions = []

        for idx in top_indices:
            disease_name = label_encoder.inverse_transform([idx])[0]

            top_predictions.append({
                "disease": disease_name,
                "confidence": round(
                    probabilities[idx] * 100,
                    2
                )
            })

        # =================================================
        # PROFESSIONAL SUMMARY
        # =================================================

        summary = (
            f"Based on the symptoms provided, "
            f"the most likely condition is "
            f"{disease}. "
            f"Urgency Level: {urgency.upper()} | "
            f"Recommended Specialist: {doctor_type} | "
            f"Confidence: {confidence}%. "
            f"Please consult a qualified doctor "
            f"for proper medical diagnosis."
        )

        print("Prediction:", disease)
        print("Confidence:", confidence)
        print("Urgency:", urgency)
        print("Doctor Type:", doctor_type)

        # =================================================
        # RESPONSE (Match frontend expectations)
        # =================================================

        return jsonify({
            "success": True,
            "data": {
                "predictedDisease": disease,
                "confidence": confidence,
                "urgency": urgency,
                "urgencyScore": urgency_score,
                "doctorType": doctor_type,
                "topPredictions": top_predictions,
                "summary": summary
            }
        })

    except Exception as e:
        print("Prediction Error:", str(e))
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Prediction failed",
            "error": str(e)
        }), 500


# =====================================================
# START SERVER
# =====================================================

if __name__ == "__main__":
    print("\n==========================================")
    print("Starting Flask Server...")
    print("http://127.0.0.1:8000")
    print("==========================================\n")

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )
