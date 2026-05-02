from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import re

print("Loading Enterprise AI Triage Engine...")

app = Flask(__name__)
CORS(app)

# =====================================================
# LOAD TRAINED MODEL FILES
# =====================================================

model = joblib.load("disease_model.pkl")
label_encoder = joblib.load("disease_label_encoder.pkl")
symptom_columns = joblib.load("symptom_columns.pkl")

print("AI Triage Model Loaded Successfully")


# =====================================================
# NORMALIZE INPUT TEXT
# =====================================================

def normalize_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# =====================================================
# EMERGENCY RED FLAG DETECTION
# =====================================================

def detect_emergency_flags(user_input):
    emergency_map = {
        "chest pain": "Possible cardiac emergency",
        "breathing difficulty": "Respiratory emergency",
        "shortness of breath": "Respiratory emergency",
        "severe bleeding": "Immediate trauma emergency",
        "blood vomiting": "Internal bleeding risk",
        "unconscious": "Critical neurological emergency",
        "fainting": "Possible circulation issue",
        "stroke": "Neurological emergency",
        "seizure": "Emergency neurological condition",
        "heart pain": "Cardiac emergency",
        "loss of consciousness": "Critical emergency"
    }

    found = []

    normalized = normalize_text(user_input)

    for keyword, reason in emergency_map.items():
        if keyword in normalized:
            found.append({
                "symptom": keyword,
                "reason": reason
            })

    return found


# =====================================================
# SMART SYMPTOM EXTRACTION
# =====================================================

def extract_symptoms(user_input):
    normalized = normalize_text(user_input)

    detected = []

    for symptom in symptom_columns:
        readable_symptom = symptom.replace("_", " ").lower()

        if readable_symptom in normalized:
            detected.append(symptom)

    return list(set(detected))


# =====================================================
# CREATE MODEL INPUT VECTOR
# =====================================================

def create_input_vector(detected_symptoms):
    vector = [0] * len(symptom_columns)

    for symptom in detected_symptoms:
        if symptom in symptom_columns:
            index = symptom_columns.index(symptom)
            vector[index] = 1

    return [vector]


# =====================================================
# DOCTOR SPECIALIST MAPPING
# =====================================================

def get_specialist(disease):
    mapping = {
        "Heart attack": "Cardiologist",
        "Hypertension": "Cardiologist",
        "Pneumonia": "Pulmonologist",
        "Asthma": "Pulmonologist",
        "Tuberculosis": "Pulmonologist",
        "Diabetes": "Endocrinologist",
        "Hypothyroidism": "Endocrinologist",
        "Migraine": "Neurologist",
        "Paralysis (brain hemorrhage)": "Neurologist",
        "Psoriasis": "Dermatologist",
        "Fungal infection": "Dermatologist",
        "Arthritis": "Orthopedic",
        "Cervical spondylosis": "Orthopedic",
        "Dengue": "General Physician",
        "Malaria": "General Physician",
        "Typhoid": "General Physician",
        "Gastroenteritis": "General Physician",
        "Jaundice": "Gastroenterologist"
    }

    return mapping.get(disease, "General Physician")


# =====================================================
# URGENCY LEVEL ENGINE
# =====================================================

def calculate_urgency(top_disease, emergency_flags):
    if len(emergency_flags) > 0:
        return "Emergency"

    high_risk = [
        "Heart attack",
        "Pneumonia",
        "Dengue",
        "Malaria",
        "Typhoid",
        "Tuberculosis",
        "Jaundice",
        "Hypertension"
    ]

    medium_risk = [
        "Asthma",
        "Diabetes",
        "Migraine",
        "Arthritis",
        "Hypothyroidism"
    ]

    if top_disease in high_risk:
        return "High"

    if top_disease in medium_risk:
        return "Medium"

    return "Low"


# =====================================================
# RECOMMENDATION ENGINE
# =====================================================

def generate_recommendation(urgency):
    if urgency == "Emergency":
        return (
            "Immediate medical attention is required. "
            "Please consult emergency services or visit the nearest hospital immediately."
        )

    if urgency == "High":
        return (
            "Urgent doctor consultation is strongly recommended "
            "within the next few hours."
        )

    if urgency == "Medium":
        return (
            "Doctor consultation is recommended within 24 hours "
            "for proper diagnosis and treatment."
        )

    return (
        "Symptoms appear manageable currently. "
        "Monitor your condition and consult a doctor if symptoms worsen."
    )


# =====================================================
# CONFIDENCE LEVEL CLASSIFIER
# =====================================================

def confidence_band(score):
    if score >= 85:
        return "Very High"

    if score >= 70:
        return "High"

    if score >= 50:
        return "Moderate"

    return "Low"


# =====================================================
# MAIN PREDICTION ROUTE
# =====================================================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        message = data.get("message", "").strip()

        if not message:
            return jsonify({
                "success": False,
                "message": "Symptoms input is required"
            }), 400

        # -----------------------------------
        # Emergency detection
        # -----------------------------------

        emergency_flags = detect_emergency_flags(message)

        # -----------------------------------
        # Symptom extraction
        # -----------------------------------

        detected_symptoms = extract_symptoms(message)

        if len(detected_symptoms) == 0:
            return jsonify({
                "success": False,
                "message": "No recognizable medical symptoms detected"
            }), 400

        # -----------------------------------
        # Vector creation
        # -----------------------------------

        input_vector = create_input_vector(detected_symptoms)

        # -----------------------------------
        # Prediction probabilities
        # -----------------------------------

        probabilities = model.predict_proba(input_vector)[0]

        top_indices = np.argsort(probabilities)[-3:][::-1]

        top_predictions = []

        for idx in top_indices:
            disease = label_encoder.inverse_transform([idx])[0]
            confidence = round(float(probabilities[idx]) * 100, 2)

            top_predictions.append({
                "disease": disease,
                "confidence": confidence,
                "confidenceLevel": confidence_band(confidence)
            })

        top_disease = top_predictions[0]["disease"]

        # -----------------------------------
        # Business logic
        # -----------------------------------

        urgency = calculate_urgency(
            top_disease,
            emergency_flags
        )

        specialist = get_specialist(top_disease)

        recommendation = generate_recommendation(urgency)

        # -----------------------------------
        # Final response
        # -----------------------------------

        return jsonify({
            "success": True,

            "inputMessage": message,

            "detectedSymptoms": detected_symptoms,

            "emergencyFlags": emergency_flags,

            "topPredictions": top_predictions,

            "predictedDisease": top_disease,

            "urgency": urgency,

            "doctorType": specialist,

            "recommendation": recommendation,

            "medicalDisclaimer":
                "This is an AI-assisted preliminary triage assessment and "
                "must not replace professional medical diagnosis."
        })

    except Exception as e:
        print("Prediction Error:", str(e))

        return jsonify({
            "success": False,
            "message": "Prediction failed",
            "error": str(e)
        }), 500


# =====================================================
# HEALTH CHECK ROUTE
# =====================================================

@app.route("/", methods=["GET"])
def home():
    return "Enterprise AI Triage System Running Successfully"


# =====================================================
# RUN SERVER
# =====================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )
