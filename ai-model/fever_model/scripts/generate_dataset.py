"""
generate_dataset.py
===================
Curated fever differential assessment dataset generator.

Data Type: Synthetic/Curated
Source: WHO clinical symptom descriptions (see data/sources.md)

This script creates ~1,500 clinically plausible symptom-feature rows
(300 per disease class) using controlled variation around WHO-documented
symptom profiles. It does NOT represent real patient records.

Citation:
    "A curated symptom-feature dataset constructed from WHO clinical
    guidelines, used for fever differential assessment model development."

Usage:
    python scripts/generate_dataset.py
"""

import numpy as np
import pandas as pd
import os

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

RANDOM_SEED = 42
ROWS_PER_CLASS = 300

FEATURES = [
    "fever",
    "high_fever",
    "sudden_onset",
    "headache",
    "severe_headache",
    "chills",
    "sweating",
    "body_pain",
    "muscle_pain",
    "joint_pain",
    "severe_joint_pain",
    "pain_behind_eyes",
    "rash",
    "nausea",
    "vomiting",
    "abdominal_pain",
    "diarrhea",
    "constipation",
    "cough",
    "sore_throat",
    "runny_nose",
    "fatigue",
    "weakness",
    "swollen_lymph_nodes",
    "loss_of_appetite",
]

# ─────────────────────────────────────────────────────────────────────────────
# DISEASE CLINICAL PROFILES
# Source: WHO fact sheets (see data/sources.md)
#
# Format: { feature: probability_of_presence }
# Primary symptoms (WHO-documented) = high probability (0.80 – 0.95)
# Secondary symptoms                = moderate probability (0.40 – 0.70)
# Absent / counter-indicative       = low probability (0.05 – 0.20)
# ─────────────────────────────────────────────────────────────────────────────

DISEASE_PROFILES = {
    "Dengue": {
        # Primary (WHO: high fever, severe headache, pain behind eyes,
        #          muscle/joint pain, nausea, rash)
        "fever":             0.99,
        "high_fever":        0.90,
        "sudden_onset":      0.85,
        "headache":          0.88,
        "severe_headache":   0.75,
        "pain_behind_eyes":  0.80,   # hallmark
        "muscle_pain":       0.70,
        "joint_pain":        0.65,
        "body_pain":         0.72,
        "nausea":            0.70,
        "rash":              0.60,
        "vomiting":          0.45,
        "fatigue":           0.70,
        "weakness":          0.65,
        "swollen_lymph_nodes": 0.40,
        "loss_of_appetite":  0.55,
        # Low / absent
        "chills":            0.20,
        "sweating":          0.25,
        "severe_joint_pain": 0.15,
        "abdominal_pain":    0.25,
        "diarrhea":          0.15,
        "constipation":      0.08,
        "cough":             0.12,
        "sore_throat":       0.10,
        "runny_nose":        0.08,
    },

    "Malaria": {
        # Primary (WHO: fever, headache, chills — cyclical pattern)
        "fever":             0.99,
        "high_fever":        0.75,
        "chills":            0.88,   # hallmark
        "sweating":          0.82,   # hallmark (fever cycle)
        "headache":          0.85,
        "body_pain":         0.70,
        "fatigue":           0.80,
        "weakness":          0.75,
        "loss_of_appetite":  0.60,
        "vomiting":          0.50,
        "nausea":            0.55,
        "muscle_pain":       0.50,
        # Moderate
        "sudden_onset":      0.55,
        "severe_headache":   0.45,
        # Low / absent
        "joint_pain":        0.20,
        "severe_joint_pain": 0.05,
        "pain_behind_eyes":  0.15,
        "rash":              0.08,
        "abdominal_pain":    0.30,
        "diarrhea":          0.20,
        "constipation":      0.10,
        "cough":             0.15,
        "sore_throat":       0.10,
        "runny_nose":        0.08,
        "swollen_lymph_nodes": 0.15,
    },

    "Typhoid": {
        # Primary (WHO: prolonged high fever, weakness, stomach pain,
        #          headache, diarrhea or constipation, nausea)
        "fever":             0.99,
        "high_fever":        0.70,
        "headache":          0.80,
        "weakness":          0.82,
        "fatigue":           0.78,
        "abdominal_pain":    0.75,   # hallmark
        "constipation":      0.65,   # hallmark (early typhoid)
        "diarrhea":          0.45,
        "nausea":            0.65,
        "loss_of_appetite":  0.78,
        "vomiting":          0.40,
        "sweating":          0.55,
        # Moderate
        "body_pain":         0.50,
        "rash":              0.25,
        # Low / absent
        "sudden_onset":      0.25,   # typhoid is gradual onset
        "severe_headache":   0.35,
        "chills":            0.30,
        "muscle_pain":       0.30,
        "joint_pain":        0.15,
        "severe_joint_pain": 0.05,
        "pain_behind_eyes":  0.10,
        "cough":             0.18,
        "sore_throat":       0.12,
        "runny_nose":        0.08,
        "swollen_lymph_nodes": 0.20,
    },

    "Chikungunya": {
        # Primary (WHO: fever, severe joint pain, muscle pain,
        #          headache, rash, fatigue, nausea)
        "fever":             0.99,
        "high_fever":        0.80,
        "sudden_onset":      0.88,   # hallmark (abrupt onset)
        "joint_pain":        0.92,   # hallmark
        "severe_joint_pain": 0.85,   # hallmark
        "muscle_pain":       0.80,
        "headache":          0.78,
        "fatigue":           0.82,
        "rash":              0.65,
        "nausea":            0.50,
        "body_pain":         0.70,
        # Moderate
        "chills":            0.30,
        "loss_of_appetite":  0.45,
        "weakness":          0.60,
        "vomiting":          0.30,
        "swollen_lymph_nodes": 0.25,
        # Low / absent
        "pain_behind_eyes":  0.20,
        "severe_headache":   0.30,
        "sweating":          0.25,
        "abdominal_pain":    0.15,
        "diarrhea":          0.10,
        "constipation":      0.05,
        "cough":             0.10,
        "sore_throat":       0.08,
        "runny_nose":        0.06,
    },

    "Viral_Fever": {
        # Primary (WHO influenza-like illness: fever, cough, headache,
        #          muscle/joint pain, malaise, sore throat, runny nose)
        "fever":             0.99,
        "high_fever":        0.40,   # usually mild-moderate
        "headache":          0.78,
        "cough":             0.82,   # hallmark
        "sore_throat":       0.75,   # hallmark
        "runny_nose":        0.72,   # hallmark
        "body_pain":         0.65,
        "muscle_pain":       0.60,
        "fatigue":           0.75,
        "weakness":          0.70,
        "nausea":            0.40,
        # Moderate
        "chills":            0.45,
        "loss_of_appetite":  0.45,
        "swollen_lymph_nodes": 0.35,
        # Low / absent
        "sudden_onset":      0.50,
        "severe_headache":   0.25,
        "sweating":          0.30,
        "joint_pain":        0.25,
        "severe_joint_pain": 0.05,
        "pain_behind_eyes":  0.10,
        "rash":              0.18,
        "vomiting":          0.20,
        "abdominal_pain":    0.15,
        "diarrhea":          0.20,
        "constipation":      0.08,
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def generate_rows_for_disease(disease_name: str, profile: dict, n: int, rng) -> list:
    """Generate n symptom rows for one disease using the clinical profile."""
    rows = []
    for _ in range(n):
        row = {}
        for feature in FEATURES:
            prob = profile.get(feature, 0.10)
            row[feature] = int(rng.random() < prob)
        row["disease"] = disease_name
        # Always ensure base fever = 1 (all these are febrile illnesses)
        row["fever"] = 1
        rows.append(row)
    return rows


def generate_dataset(rows_per_class: int = ROWS_PER_CLASS, seed: int = RANDOM_SEED):
    rng = np.random.default_rng(seed)
    all_rows = []

    for disease_name, profile in DISEASE_PROFILES.items():
        print(f"  Generating {rows_per_class} rows for: {disease_name}")
        rows = generate_rows_for_disease(disease_name, profile, rows_per_class, rng)
        all_rows.extend(rows)

    df = pd.DataFrame(all_rows)

    # Shuffle
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    print(f"\n[OK] Dataset shape: {df.shape}")
    print("\nClass distribution:")
    print(df["disease"].value_counts())
    print("\nSample rows:")
    print(df.head(3).to_string())

    return df


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("Fever Differential Assessment — Dataset Generator")
    print("Data type: Synthetic/Curated from WHO clinical descriptions")
    print("=" * 60)

    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "fever_dataset.csv")

    df = generate_dataset()
    df.to_csv(output_path, index=False)

    print(f"\n[OK] Dataset saved to: {output_path}")
    print(f"  Total rows: {len(df)}")
    print(f"  Features: {len(FEATURES)} symptom columns + 1 target (disease)")
    print("\n[!] IMPORTANT: This is a curated/synthetic dataset.")
    print("   Cite as: 'WHO-grounded synthetic symptom-feature dataset'")
    print("   See data/sources.md for full provenance.\n")
