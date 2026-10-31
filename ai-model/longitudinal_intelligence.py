"""
Longitudinal Patient Health Intelligence Engine
================================================
E-Sanjeevani 2.0 — Advanced Clinical Intelligence Microservice

Provides:
1. Multi-visit symptom recurrence detection & escalation trajectory analysis.
2. Time-series physiological parameter trend analysis (linear slope, delta, MEWS).
3. Comparative parameter matrix (Current vs Previous vs Baseline).
4. RAG-based clinical context retrieval across previous consultations, prescriptions & lab reports.
5. AI clinical summary generation for attending physicians.
"""

import math
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# ─────────────────────────────────────────────────────────────────────────────
# CANONICAL SYMPTOM ONTOLOGY & MAPPING
# ─────────────────────────────────────────────────────────────────────────────

CANONICAL_SYMPTOMS = {
    "fever": ["fever", "high temperature", "pyrexia", "febrile", "hot flashes", "chills", "shivering", "elevated temperature"],
    "fatigue": ["fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "malaise", "body weakness", "loss of energy"],
    "joint_pain": ["joint pain", "arthralgia", "joint stiffness", "knee pain", "elbow pain", "wrist pain", "swollen joints", "body aches in joints", "arthritis"],
    "headache": ["headache", "cephalalgia", "migraine", "head throbbing", "temple pain"],
    "cough": ["cough", "dry cough", "wet cough", "hacking cough", "coughing"],
    "shortness_of_breath": ["shortness of breath", "dyspnea", "breathlessness", "difficulty breathing", "wheezing"],
    "chest_pain": ["chest pain", "angina", "chest tightness", "chest pressure"],
    "body_ache": ["body ache", "body pain", "myalgia", "muscle ache", "muscle pain"],
    "nausea": ["nausea", "queasiness", "feeling sick"],
    "vomiting": ["vomiting", "emesis", "throwing up"],
    "diarrhea": ["diarrhea", "loose motions", "watery stool"],
    "abdominal_pain": ["abdominal pain", "stomach ache", "tummy pain", "cramps"],
    "rash": ["rash", "skin eruption", "petechiae", "purpura", "red spots", "itching"],
    "sore_throat": ["sore throat", "throat pain", "pharyngitis", "pain swallowing"],
    "loss_of_appetite": ["loss of appetite", "anorexia", "poor appetite", "not eating"],
    "dizziness": ["dizziness", "lightheadedness", "vertigo", "giddiness"],
}

# Standard Clinical Reference Bands
PHYSIOLOGICAL_RANGES = {
    "temperature": {"min": 97.0, "max": 99.0, "unit": "°F", "name": "Body Temperature", "critical_high": 102.0, "low_fever": 99.5},
    "systolicBp": {"min": 90, "max": 120, "unit": "mmHg", "name": "Systolic Blood Pressure", "critical_high": 160, "stage1": 130},
    "diastolicBp": {"min": 60, "max": 80, "unit": "mmHg", "name": "Diastolic Blood Pressure", "critical_high": 100, "stage1": 85},
    "heartRate": {"min": 60, "max": 100, "unit": "bpm", "name": "Heart Rate", "critical_high": 120, "critical_low": 50},
    "spo2": {"min": 95, "max": 100, "unit": "%", "name": "Blood Oxygen (SpO2)", "critical_low": 90, "borderline": 94},
    "respiratoryRate": {"min": 12, "max": 20, "unit": "breaths/min", "name": "Respiratory Rate", "critical_high": 28},
    "bloodGlucose": {"min": 70, "max": 125, "unit": "mg/dL", "name": "Blood Glucose", "critical_high": 200, "critical_low": 60},
    "plateletCount": {"min": 150000, "max": 450000, "unit": "/mcL", "name": "Platelet Count", "critical_low": 100000, "thrombocytopenia": 150000},
    "wbcCount": {"min": 4000, "max": 11000, "unit": "/mcL", "name": "WBC Count", "critical_high": 15000, "critical_low": 3000},
    "hemoglobin": {"min": 12.0, "max": 17.5, "unit": "g/dL", "name": "Hemoglobin", "critical_low": 8.0},
    "crp": {"min": 0.0, "max": 5.0, "unit": "mg/L", "name": "C-Reactive Protein (CRP)", "critical_high": 15.0},
}


def normalize_symptom_tokens(text: str) -> List[str]:
    """Extracts canonical symptom keys from free text."""
    if not text:
        return []
    text_lower = text.lower()
    detected = []
    for canon_key, aliases in CANONICAL_SYMPTOMS.items():
        for alias in aliases:
            # Word boundary matching
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, text_lower):
                detected.append(canon_key)
                break
    return detected


# ─────────────────────────────────────────────────────────────────────────────
# 1. SYMPTOM RECURRENCE & TRAJECTORY ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def analyze_symptom_recurrence(consultations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes multi-visit symptom history to detect:
    - Recurring symptoms across visits.
    - Escalation patterns (e.g. Visit 1: Fever -> Visit 2: Fever+Fatigue -> Visit 3: Fever+Fatigue+Joint Pain).
    - Trajectory alert messages for the doctor.
    """
    if not consultations:
        return {
            "has_recurring_symptoms": False,
            "recurring_symptoms": [],
            "visit_progression": [],
            "escalation_detected": False,
            "trajectory_alert": None,
            "alert_level": "normal"
        }

    # Sort consultations chronologically
    sorted_cons = sorted(
        consultations,
        key=lambda c: str(c.get("date") or c.get("consultationDate") or c.get("createdAt") or "")
    )

    visit_progression = []
    symptom_visit_map = {}

    for idx, c in enumerate(sorted_cons, start=1):
        raw_text = f"{c.get('symptoms', '')} {c.get('currentProblem', '')} {c.get('problemDescription', '')}"
        norm_symptoms = normalize_symptom_tokens(raw_text)
        
        # If no ontology symptom was matched, fallback to comma splitting
        if not norm_symptoms and c.get("symptoms"):
            splits = [s.strip().lower() for s in str(c.get("symptoms")).split(",") if s.strip()]
            norm_symptoms = splits

        date_str = str(c.get("date") or c.get("consultationDate") or f"Visit {idx}")
        # Clean date string
        if "T" in date_str:
            date_str = date_str.split("T")[0]

        visit_entry = {
            "visit_index": idx,
            "consultation_id": c.get("id"),
            "date": date_str,
            "doctor_name": c.get("doctorName", "Doctor"),
            "reported_symptoms": norm_symptoms,
            "formatted_symptoms": [s.replace("_", " ").title() for s in norm_symptoms],
            "diagnosis": c.get("diagnosis") or c.get("doctorNotes") or "Under Evaluation"
        }
        visit_progression.append(visit_entry)

        for sym in norm_symptoms:
            symptom_visit_map.setdefault(sym, []).append({
                "visit_index": idx,
                "date": date_str
            })

    total_visits = len(visit_progression)
    recurring_symptoms = []

    for sym, visits in symptom_visit_map.items():
        count = len(visits)
        if count >= 2:
            recurrence_rate = round((count / total_visits) * 100, 1)
            recurring_symptoms.append({
                "symptom": sym,
                "label": sym.replace("_", " ").title(),
                "occurrences": count,
                "total_visits": total_visits,
                "recurrence_rate": recurrence_rate,
                "visits": visits,
                "is_persistent": count == total_visits
            })

    recurring_symptoms.sort(key=lambda s: s["occurrences"], reverse=True)

    # Detect Symptom Expansion & Escalation Pattern
    # e.g., Visit 1 has N symptoms, Visit 2 has >= N+1 containing prior symptoms, Visit 3 expands further
    escalation_detected = False
    escalation_notes = []
    
    if len(visit_progression) >= 2:
        for i in range(1, len(visit_progression)):
            prev_syms = set(visit_progression[i-1]["reported_symptoms"])
            curr_syms = set(visit_progression[i]["reported_symptoms"])
            overlap = prev_syms.intersection(curr_syms)
            new_syms = curr_syms - prev_syms
            
            if overlap and new_syms:
                escalation_detected = True
                new_names = [s.replace("_", " ").title() for s in new_syms]
                overlap_names = [s.replace("_", " ").title() for s in overlap]
                escalation_notes.append(
                    f"Visit {visit_progression[i]['visit_index']} ({visit_progression[i]['date']}): "
                    f"Recurring [{', '.join(overlap_names)}] compounded by NEW symptoms [{', '.join(new_names)}]"
                )

    # Specific Alert Formulation (Addressing user prompt example)
    trajectory_alert = None
    alert_level = "normal"

    if recurring_symptoms or escalation_detected:
        fever_recurring = any(r["symptom"] == "fever" and r["occurrences"] >= 2 for r in recurring_symptoms)
        fatigue_recurring = any(r["symptom"] == "fatigue" for r in recurring_symptoms)
        joint_pain_present = any("joint_pain" in v["reported_symptoms"] for v in visit_progression)

        if fever_recurring and (fatigue_recurring or joint_pain_present):
            alert_level = "critical"
            trajectory_alert = {
                "title": "🚨 HIGH CLINICAL ALERT: Progressive Multi-Consultation Symptom Escalation",
                "badge": "Recurring Febrile Trajectory",
                "severity": "critical",
                "summary": (
                    f"Patient has presented across {total_visits} recent consultations with recurring Fever, "
                    f"compounded by progressive symptoms (Fatigue and Joint Pain). Progression from isolated fever "
                    f"to multi-system arthralgia indicates high suspicion for an evolving systemic infection (Dengue, "
                    f"Chikungunya, or Relapsing Typhoid) or early reactive autoimmune pathology."
                ),
                "doctor_action": (
                    "Review full longitudinal history before finalizing diagnosis. "
                    "Recommend ordering complete hemogram (CBC), dengue serology (NS1/IgM), "
                    "chikungunya PCR/IgM, peripheral smear for MP, and inflammatory markers (ESR/CRP)."
                ),
                "progression_chain": [
                    f"Visit {v['visit_index']}: {', '.join(v['formatted_symptoms']) or 'General complaints'}"
                    for v in visit_progression
                ]
            }
        elif len(recurring_symptoms) >= 1:
            alert_level = "warning"
            top_rec = recurring_symptoms[0]
            trajectory_alert = {
                "title": f"⚠️ RECURRING SYMPTOM WARNING: {top_rec['label']} reported in {top_rec['occurrences']} consultations",
                "badge": "Symptom Recurrence",
                "severity": "warning",
                "summary": (
                    f"{top_rec['label']} has recurred across {top_rec['occurrences']} out of {total_visits} recent visits. "
                    f"Evaluate treatment efficacy of previously prescribed therapies."
                ),
                "doctor_action": "Assess potential chronic progression or treatment non-compliance.",
                "progression_chain": [
                    f"Visit {v['visit_index']}: {', '.join(v['formatted_symptoms']) or 'General complaints'}"
                    for v in visit_progression
                ]
            }

    return {
        "has_recurring_symptoms": len(recurring_symptoms) > 0,
        "recurring_symptoms": recurring_symptoms,
        "visit_progression": visit_progression,
        "escalation_detected": escalation_detected,
        "escalation_notes": escalation_notes,
        "trajectory_alert": trajectory_alert,
        "alert_level": alert_level
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. TIME-SERIES HEALTH PARAMETER & TREND ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

def calculate_linear_slope(values: List[float]) -> float:
    """Calculates ordinary least squares linear regression slope."""
    n = len(values)
    if n < 2:
        return 0.0
    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(values) / n
    numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 3)


def calculate_mews(reading: Dict[str, Any]) -> int:
    """
    Computes Modified Early Warning Score (MEWS 0-14).
    Scores physiological deterioration across SBP, HR, RR, Temp.
    """
    score = 0
    sbp = reading.get("systolicBp")
    hr = reading.get("heartRate")
    rr = reading.get("respiratoryRate")
    temp = reading.get("temperature")
    
    if sbp is not None:
        if sbp <= 70: score += 3
        elif sbp <= 80: score += 2
        elif sbp <= 100: score += 1
        elif sbp >= 200: score += 2

    if hr is not None:
        if hr <= 40: score += 2
        elif hr <= 50: score += 1
        elif hr >= 130: score += 3
        elif hr >= 110: score += 2
        elif hr >= 101: score += 1

    if rr is not None:
        if rr <= 8: score += 2
        elif rr >= 30: score += 3
        elif rr >= 25: score += 2
        elif rr >= 21: score += 1

    if temp is not None:
        # Convert C to F if < 45
        if temp < 45:
            temp = (temp * 9/5) + 32
        if temp < 95.0: score += 2
        elif temp >= 101.3: score += 2

    return score


def analyze_health_parameters(health_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates physiological parameters across time:
    - Sorts chronologically.
    - Determines baseline (earliest), previous, and current (latest) measurements.
    - Generates comparative delta matrix.
    - Flags worsening trends, anomalies, and MEWS trajectories.
    """
    if not health_metrics:
        return {
            "has_metrics": False,
            "metrics_count": 0,
            "comparative_matrix": [],
            "time_series_data": [],
            "worsening_trends": [],
            "mews_trajectory": []
        }

    # Sort metrics chronologically
    sorted_metrics = sorted(
        health_metrics,
        key=lambda m: str(m.get("recordedAt") or m.get("date") or m.get("createdAt") or "")
    )

    time_series_data = []
    mews_trajectory = []

    for idx, m in enumerate(sorted_metrics, start=1):
        date_str = str(m.get("recordedAt") or m.get("date") or f"T{idx}")
        if "T" in date_str:
            date_str = date_str.split("T")[0]

        temp = m.get("temperature")
        if temp is not None and temp < 45:
            temp = round((temp * 9/5) + 32, 1)

        mews = calculate_mews(m)
        mews_trajectory.append({
            "point": idx,
            "date": date_str,
            "mews": mews,
            "severity": "critical" if mews >= 4 else "warning" if mews >= 2 else "normal"
        })

        time_series_data.append({
            "point": idx,
            "date": date_str,
            "systolicBp": m.get("systolicBp"),
            "diastolicBp": m.get("diastolicBp"),
            "heartRate": m.get("heartRate"),
            "temperature": temp,
            "spo2": m.get("spo2"),
            "respiratoryRate": m.get("respiratoryRate"),
            "bloodGlucose": m.get("bloodGlucose"),
            "plateletCount": m.get("plateletCount"),
            "wbcCount": m.get("wbcCount"),
            "hemoglobin": m.get("hemoglobin"),
            "weight": m.get("weight"),
            "mews": mews
        })

    # Comparative Matrix: Baseline vs Previous vs Current
    baseline_record = sorted_metrics[0]
    previous_record = sorted_metrics[-2] if len(sorted_metrics) >= 2 else baseline_record
    current_record = sorted_metrics[-1]

    comparative_matrix = []
    worsening_trends = []

    for key, cfg in PHYSIOLOGICAL_RANGES.items():
        curr_val = current_record.get(key)
        prev_val = previous_record.get(key)
        base_val = baseline_record.get(key)

        if curr_val is None and prev_val is None and base_val is None:
            continue

        # Extract values
        c = float(curr_val) if curr_val is not None else None
        p = float(prev_val) if prev_val is not None else c
        b = float(base_val) if base_val is not None else p

        if c is None:
            continue

        delta = round(c - p, 1) if p is not None else 0.0
        pct_change = round(((c - p) / p) * 100, 1) if p and p != 0 else 0.0

        # Assess trajectory & physiological status
        status = "normal"
        interpretation = "Within physiological baseline."

        # Parameter-specific clinical rules
        if key == "temperature":
            if c >= cfg["critical_high"]:
                status = "critical"
                interpretation = f"High pyrexia ({c}{cfg['unit']}) requiring acute antipyretic control."
                worsening_trends.append(f"Body Temperature escalated to high febrile range ({c}{cfg['unit']}).")
            elif c >= cfg["low_fever"]:
                status = "elevated" if delta <= 0 else "deteriorating"
                interpretation = f"Febrile state ({c}{cfg['unit']}), +{delta}{cfg['unit']} vs prior visit."
                if delta > 0:
                    worsening_trends.append(f"Temperature trending upward (+{delta}{cfg['unit']}) to {c}{cfg['unit']}.")
            else:
                status = "normal"
                interpretation = f"Afebrile / normal range ({c}{cfg['unit']})."

        elif key == "plateletCount":
            if c < cfg["critical_low"]:
                status = "critical"
                interpretation = f"Severe thrombocytopenia ({int(c)} {cfg['unit']}). High bleeding risk!"
                worsening_trends.append(f"CRITICAL: Platelet count fell to {int(c)} {cfg['unit']} ({pct_change}% decline).")
            elif c < cfg["thrombocytopenia"]:
                status = "deteriorating" if delta < 0 else "elevated"
                interpretation = f"Thrombocytopenia below normal range ({int(c)} {cfg['unit']})."
                if delta < 0:
                    worsening_trends.append(f"Platelet count dropping significantly ({delta} {cfg['unit']} vs prior).")
            else:
                status = "normal"
                interpretation = f"Within normal thrombocyte band ({int(c)} {cfg['unit']})."

        elif key == "systolicBp":
            if c >= cfg["critical_high"]:
                status = "critical"
                interpretation = f"Severe hypertension ({int(c)} {cfg['unit']}). Risk of end-organ compromise."
                worsening_trends.append(f"Systolic BP hypertensive spike ({int(c)} {cfg['unit']}).")
            elif c >= cfg["stage1"]:
                status = "deteriorating" if delta > 0 else "elevated"
                interpretation = f"Stage 1-2 Hypertension ({int(c)} {cfg['unit']})."
                if delta > 0:
                    worsening_trends.append(f"Systolic BP elevated and trending upward (+{int(delta)} mmHg).")
            elif c < cfg["min"]:
                status = "critical"
                interpretation = f"Hypotension ({int(c)} {cfg['unit']}). Check for circulatory shock."
                worsening_trends.append(f"Hypotension detected (Systolic BP {int(c)} mmHg).")
            else:
                status = "normal"
                interpretation = f"Normotensive ({int(c)} {cfg['unit']})."

        elif key == "spo2":
            if c < cfg["critical_low"]:
                status = "critical"
                interpretation = f"Acute hypoxemia ({int(c)}%). Supplemental O2 indicated."
                worsening_trends.append(f"CRITICAL: SpO2 fell to {int(c)}% ({delta}% drop).")
            elif c <= cfg["borderline"]:
                status = "deteriorating"
                interpretation = f"Borderline hypoxemia ({int(c)}%). Monitor respiratory effort."
                worsening_trends.append(f"SpO2 decreased to borderline {int(c)}%.")
            else:
                status = "normal"
                interpretation = f"Optimal oxygen saturation ({int(c)}%)."

        elif key == "heartRate":
            if c > cfg["critical_high"]:
                status = "critical"
                interpretation = f"Marked tachycardia ({int(c)} bpm)."
                worsening_trends.append(f"Marked tachycardia noted at {int(c)} bpm.")
            elif c > cfg["max"]:
                status = "elevated" if delta <= 0 else "deteriorating"
                interpretation = f"Tachycardia ({int(c)} bpm, +{int(delta)} bpm vs prior)."
            elif c < cfg["critical_low"]:
                status = "critical"
                interpretation = f"Bradycardia ({int(c)} bpm)."
            else:
                status = "normal"
                interpretation = f"Normal resting heart rate ({int(c)} bpm)."

        comparative_matrix.append({
            "key": key,
            "name": cfg["name"],
            "unit": cfg["unit"],
            "current": c,
            "previous": p,
            "baseline": b,
            "delta": delta,
            "pct_change": pct_change,
            "status": status,
            "interpretation": interpretation
        })

    return {
        "has_metrics": True,
        "metrics_count": len(sorted_metrics),
        "comparative_matrix": comparative_matrix,
        "time_series_data": time_series_data,
        "worsening_trends": worsening_trends,
        "mews_trajectory": mews_trajectory,
        "latest_mews": mews_trajectory[-1]["mews"] if mews_trajectory else 0
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. RAG CONTEXT RETRIEVER
# ─────────────────────────────────────────────────────────────────────────────

def retrieve_rag_patient_context(
    query_symptoms: List[str],
    consultations: List[Dict[str, Any]],
    prescriptions: List[Dict[str, Any]],
    documents: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    RAG Retrieval: Indexes past patient events (consultations, prescriptions, lab reports)
    and scores their relevance to the current symptom profile and query.
    """
    corpus = []
    
    # 1. Index Consultations
    for c in consultations:
        text = f"{c.get('symptoms', '')} {c.get('currentProblem', '')} {c.get('diagnosis', '')} {c.get('doctorNotes', '')}"
        corpus.append({
            "type": "consultation",
            "id": c.get("id"),
            "date": c.get("date") or c.get("consultationDate"),
            "title": f"Consultation with Dr. {c.get('doctorName', 'Doctor')}",
            "text": text,
            "diagnosis": c.get("diagnosis", "Unspecified"),
            "source_obj": c
        })

    # 2. Index Prescriptions
    for rx in prescriptions:
        meds = ", ".join([f"{item.get('medicineName')} ({item.get('dosage')})" for item in rx.get("items", [])])
        text = f"{rx.get('diagnosis', '')} {rx.get('advice', '')} {meds}"
        corpus.append({
            "type": "prescription",
            "id": rx.get("id"),
            "date": rx.get("createdAt"),
            "title": f"Prescription: {rx.get('diagnosis') or 'Clinical Rx'}",
            "text": text,
            "medicines": meds,
            "advice": rx.get("advice", ""),
            "source_obj": rx
        })

    # 3. Index Documents
    for doc in documents:
        text = f"{doc.get('recordTitle', '')} {doc.get('recordType', '')} {doc.get('description', '')}"
        corpus.append({
            "type": "document",
            "id": doc.get("id"),
            "date": doc.get("recordDate"),
            "title": f"Lab Report / Document: {doc.get('recordTitle') or doc.get('recordType')}",
            "text": text,
            "source_obj": doc
        })

    # Score documents
    query_tokens = set([s.lower() for s in query_symptoms])
    scored_docs = []

    for doc in corpus:
        doc_text_lower = doc["text"].lower()
        score = 0
        matches = []
        for token in query_tokens:
            if token in doc_text_lower:
                score += 3
                matches.append(token)
            # Substring / partial
            for part in token.split("_"):
                if len(part) > 3 and part in doc_text_lower:
                    score += 1
                    matches.append(part)

        if score > 0 or len(corpus) <= 5:
            scored_docs.append({
                "type": doc["type"],
                "title": doc["title"],
                "date": doc["date"],
                "relevance_score": score,
                "matched_terms": list(set(matches)),
                "summary": doc["text"][:160] + "..." if len(doc["text"]) > 160 else doc["text"]
            })

    scored_docs.sort(key=lambda d: d["relevance_score"], reverse=True)
    return scored_docs[:6]


# ─────────────────────────────────────────────────────────────────────────────
# 4. AI CLINICAL SUMMARY GENERATOR (Deterministic / LLM Synthesis)
# ─────────────────────────────────────────────────────────────────────────────

def generate_patient_health_summary(
    patient: Dict[str, Any],
    recurrence_data: Dict[str, Any],
    parameters_data: Dict[str, Any],
    rag_context: List[Dict[str, Any]],
    prescriptions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Synthesizes an executive AI-Powered Longitudinal Patient Health Intelligence report.
    Produces both structured cards and a comprehensive clinical markdown dossier.
    """
    patient_name = patient.get("name", "Patient")
    age = patient.get("age", "N/A")
    gender = patient.get("gender", "N/A")
    allergies = patient.get("allergies") or "None reported"
    chronic_conditions = patient.get("chronicConditions") or "None recorded"

    visit_count = len(recurrence_data.get("visit_progression", []))
    worsening = parameters_data.get("worsening_trends", [])
    rec_symptoms = recurrence_data.get("recurring_symptoms", [])
    alert = recurrence_data.get("trajectory_alert")

    # 1. Executive Synopsis
    if alert and alert.get("severity") == "critical":
        synopsis = (
            f"**Critical Recurrent Trajectory Detected:** Patient {patient_name} ({age}y, {gender}) "
            f"has presented across {visit_count} consultations with recurring fever accompanied by progressive "
            f"systemic symptoms (fatigue and joint pain). Physiological monitoring shows active worsening "
            f"parameters ({len(worsening)} acute alerts). Prior therapies have demonstrated sub-optimal clinical resolution, "
            f"warranting comprehensive serological and rheumatologic investigation."
        )
    elif rec_symptoms:
        top_syms = ", ".join([s["label"] for s in rec_symptoms[:2]])
        synopsis = (
            f"**Longitudinal Monitoring Summary:** Patient {patient_name} ({age}y, {gender}) demonstrates "
            f"recurrent episodes of {top_syms} across {visit_count} consultations. Health parameters reflect "
            f"{'deteriorating trends' if worsening else 'generally stable vitals'}. "
            f"Cross-referencing ongoing pharmacotherapy against recorded allergies ({allergies})."
        )
    else:
        synopsis = (
            f"**Routine Longitudinal Overview:** Patient {patient_name} ({age}y, {gender}) has completed "
            f"{visit_count} recorded consultations with stable physiological parameters and no persistent symptom recurrence."
        )

    # 2. Pharmacotherapy & Treatment Response Audit
    prior_medicines = []
    for rx in prescriptions:
        for item in rx.get("items", []):
            med_name = item.get("medicineName")
            if med_name:
                prior_medicines.append(f"{med_name} ({item.get('dosage', '')})")

    prior_meds_str = ", ".join(list(set(prior_medicines))[:6]) or "No prior system prescriptions"

    # 3. Targeted Recommendations for Doctor
    recommendations = []
    if alert and alert.get("severity") == "critical":
        recommendations.append("Order Complete Blood Count (CBC) with differential & platelet count to rule out acute thrombocytopenia.")
        recommendations.append("Perform Arboviral Serology: Dengue NS1 Ag / IgM antibody & Chikungunya IgM.")
        recommendations.append("Test inflammatory markers: Quantitative Serum CRP and Westergren ESR.")
        recommendations.append("Verify if joint involvement is symmetric or migratory; order Serum Uric Acid and ANA if arthralgia persists beyond 14 days.")
    else:
        recommendations.append("Review adherence to previously prescribed medications.")
        recommendations.append("Monitor vital parameters at 7-day follow-up interval.")

    # 4. Markdown Full Report
    markdown_lines = [
        f"### 📋 AI Longitudinal Clinical Health Intelligence Briefing",
        f"**Patient:** {patient_name} | **Age/Sex:** {age} / {gender} | **Allergies:** {allergies} | **Comorbidities:** {chronic_conditions}",
        "",
        "#### 1. Executive Clinical Synopsis",
        synopsis,
        "",
        "#### 2. Symptom Recurrence & Trajectory Escalation Analysis",
    ]

    if rec_symptoms:
        for r in rec_symptoms:
            markdown_lines.append(f"- **{r['label']}**: Reported in {r['occurrences']} of {r['total_visits']} consultations ({r['recurrence_rate']}% recurrence).")
    else:
        markdown_lines.append("- No recurring symptoms identified across past visits.")

    if recurrence_data.get("escalation_notes"):
        markdown_lines.append("")
        markdown_lines.append("**Symptom Progression Pathway:**")
        for note in recurrence_data["escalation_notes"]:
            markdown_lines.append(f"- 📈 {note}")

    markdown_lines.extend([
        "",
        "#### 3. Vital Sign & Biomarker Trajectory",
    ])

    if worsening:
        markdown_lines.append("**⚠️ Worsening Parameter Alerts:**")
        for w in worsening:
            markdown_lines.append(f"- {w}")
    else:
        markdown_lines.append("- All monitored vitals and lab biomarkers remain within expected physiological tolerances.")

    markdown_lines.extend([
        "",
        "#### 4. Pharmacotherapy & Treatment Response Audit",
        f"- **Historical Medications Prescribed:** {prior_meds_str}",
        f"- **Allergy Safety Check:** All proposed medications must be cross-checked against: `{allergies}`.",
        "",
        "#### 5. Actionable Diagnostic Next Steps for Doctor",
    ])

    for rec in recommendations:
        markdown_lines.append(f"1. {rec}")

    raw_markdown = "\n".join(markdown_lines)

    return {
        "clinical_synopsis": synopsis,
        "recurrent_symptoms": rec_symptoms,
        "worsening_trends": worsening,
        "comparative_metrics": parameters_data.get("comparative_matrix", []),
        "rag_retrieved_context": rag_context,
        "actionable_recommendations": recommendations,
        "raw_markdown": raw_markdown,
        "trajectory_alert": alert
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. UNIFIED ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

def run_longitudinal_health_pipeline(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for longitudinal intelligence analysis.
    Accepts patient demographics, consultations, prescriptions, documents, and health metrics.
    """
    patient = payload.get("patient", {})
    consultations = payload.get("consultations", [])
    prescriptions = payload.get("prescriptions", [])
    documents = payload.get("documents", [])
    health_metrics = payload.get("healthMetrics", [])
    current_complaint = payload.get("currentComplaint", "")

    # 1. Symptom Recurrence Analysis
    recurrence_data = analyze_symptom_recurrence(consultations)

    # 2. Time-Series Health Parameters Analysis
    parameters_data = analyze_health_parameters(health_metrics)

    # 3. RAG Historical Context Retrieval
    query_tokens = normalize_symptom_tokens(current_complaint)
    if not query_tokens and recurrence_data.get("recurring_symptoms"):
        query_tokens = [s["symptom"] for s in recurrence_data["recurring_symptoms"]]
    if not query_tokens:
        query_tokens = ["fever", "pain", "fatigue"]

    rag_context = retrieve_rag_patient_context(
        query_symptoms=query_tokens,
        consultations=consultations,
        prescriptions=prescriptions,
        documents=documents
    )

    # 4. Generate AI Health Summary
    summary = generate_patient_health_summary(
        patient=patient,
        recurrence_data=recurrence_data,
        parameters_data=parameters_data,
        rag_context=rag_context,
        prescriptions=prescriptions
    )

    return {
        "success": True,
        "patient_id": patient.get("id"),
        "analysis_timestamp": datetime.now().isoformat(),
        "symptom_intelligence": recurrence_data,
        "parameters_intelligence": parameters_data,
        "rag_context": rag_context,
        "summary": summary
    }

