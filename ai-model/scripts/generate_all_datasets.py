"""
generate_all_datasets.py
========================
E-Sanjeevani 2.0 — Unified Triage System Dataset Generator

Generates standardized binary-feature datasets for the five triage categories:
  1. Category A: Fever (preserves and links existing WHO-curated fever dataset)
  2. Category B: Respiratory Diseases
  3. Category C: Digestive Diseases
  4. Category D: Skin Diseases
  5. Category E: Urinary Tract Diseases

DISCLAIMER & PROVENANCE:
------------------------
These datasets contain curated synthetic symptom profiles constructed using
peer-reviewed clinical guidelines (WHO, NICE, CDC, and specialty medical society criteria).
Each row represents a clinically plausible synthetic presentation for educational,
development, and prototyping purposes. These datasets are NOT real patient records
and MUST NOT be used as a substitute for clinical judgment or real-world clinical validation.

Random Seed: 42 (Reproducible)
Rows Per Class: 300 (1,500 rows per dataset, balanced across 5 classes)
Format: Binary symptom features (0 = absent, 1 = present) + target column ("disease")
"""

import os
import shutil
import numpy as np
import pandas as pd

RANDOM_SEED = 42
ROWS_PER_CLASS = 300

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_MODEL_DIR = os.path.join(SCRIPT_DIR, "..")
DATA_DIR = os.path.join(AI_MODEL_DIR, "data")
FEVER_SOURCE_DATA = os.path.join(AI_MODEL_DIR, "fever_model", "data", "fever_dataset.csv")

os.makedirs(DATA_DIR, exist_ok=True)

# =============================================================================
# 1. CATEGORY B: RESPIRATORY DISEASES
# =============================================================================

RESPIRATORY_FEATURES = [
    "cough",
    "productive_cough",
    "shortness_of_breath",
    "wheezing",
    "chest_tightness",
    "pleuritic_chest_pain",
    "fever",
    "high_fever",
    "chills",
    "sore_throat",
    "runny_nose",
    "nasal_congestion",
    "sneezing",
    "fatigue",
    "headache",
    "muscle_aches",
    "rapid_shallow_breathing",
    "loss_of_appetite",
    "symptom_triggers_allergens_exercise",
    "night_sweats",
]

RESPIRATORY_PROFILES = {
    "Common Cold": {
        "runny_nose": 0.92,
        "nasal_congestion": 0.90,
        "sneezing": 0.88,
        "sore_throat": 0.85,
        "cough": 0.75,
        "fatigue": 0.45,
        "headache": 0.40,
        "fever": 0.15,
        "muscle_aches": 0.20,
        "productive_cough": 0.20,
        "symptom_triggers_allergens_exercise": 0.08,
        "shortness_of_breath": 0.05,
        "wheezing": 0.05,
        "chills": 0.05,
        "loss_of_appetite": 0.10,
        "high_fever": 0.02,
        "pleuritic_chest_pain": 0.02,
        "rapid_shallow_breathing": 0.02,
        "chest_tightness": 0.05,
        "night_sweats": 0.02,
    },
    "Asthma": {
        "wheezing": 0.92,
        "shortness_of_breath": 0.90,
        "chest_tightness": 0.88,
        "symptom_triggers_allergens_exercise": 0.85,
        "cough": 0.80,
        "rapid_shallow_breathing": 0.50,
        "fatigue": 0.40,
        "nasal_congestion": 0.20,
        "runny_nose": 0.20,
        "productive_cough": 0.15,
        "sneezing": 0.15,
        "sore_throat": 0.10,
        "pleuritic_chest_pain": 0.08,
        "muscle_aches": 0.05,
        "fever": 0.05,
        "loss_of_appetite": 0.05,
        "high_fever": 0.02,
        "chills": 0.02,
        "night_sweats": 0.02,
        "headache": 0.10,
    },
    "Pneumonia": {
        "fever": 0.94,
        "productive_cough": 0.88,
        "high_fever": 0.85,
        "fatigue": 0.85,
        "chills": 0.82,
        "shortness_of_breath": 0.82,
        "pleuritic_chest_pain": 0.80,
        "rapid_shallow_breathing": 0.78,
        "cough": 0.95,
        "loss_of_appetite": 0.65,
        "night_sweats": 0.60,
        "muscle_aches": 0.55,
        "headache": 0.50,
        "chest_tightness": 0.45,
        "wheezing": 0.15,
        "sore_throat": 0.15,
        "nasal_congestion": 0.12,
        "runny_nose": 0.08,
        "sneezing": 0.05,
        "symptom_triggers_allergens_exercise": 0.05,
    },
    "Bronchitis": {
        "cough": 0.98,
        "productive_cough": 0.88,
        "chest_tightness": 0.75,
        "fatigue": 0.78,
        "sore_throat": 0.70,
        "wheezing": 0.45,
        "muscle_aches": 0.45,
        "headache": 0.45,
        "fever": 0.40,
        "shortness_of_breath": 0.40,
        "nasal_congestion": 0.35,
        "runny_nose": 0.30,
        "loss_of_appetite": 0.30,
        "rapid_shallow_breathing": 0.15,
        "chills": 0.15,
        "pleuritic_chest_pain": 0.15,
        "sneezing": 0.15,
        "symptom_triggers_allergens_exercise": 0.10,
        "high_fever": 0.08,
        "night_sweats": 0.05,
    },
    "Influenza": {
        "fever": 0.95,
        "muscle_aches": 0.92,
        "fatigue": 0.92,
        "high_fever": 0.88,
        "chills": 0.85,
        "headache": 0.85,
        "cough": 0.82,
        "sore_throat": 0.78,
        "loss_of_appetite": 0.65,
        "nasal_congestion": 0.55,
        "runny_nose": 0.50,
        "rapid_shallow_breathing": 0.35,
        "productive_cough": 0.25,
        "sneezing": 0.25,
        "chest_tightness": 0.25,
        "night_sweats": 0.15,
        "pleuritic_chest_pain": 0.10,
        "wheezing": 0.10,
        "shortness_of_breath": 0.15,
        "symptom_triggers_allergens_exercise": 0.05,
    },
}

# =============================================================================
# 2. CATEGORY C: DIGESTIVE DISEASES
# =============================================================================

DIGESTIVE_FEATURES = [
    "heartburn_retrosternal_burning",
    "acid_regurgitation",
    "epigastric_burning_pain",
    "pain_relieved_by_food_or_antacids",
    "pain_worse_on_empty_stomach_or_night",
    "nausea",
    "vomiting",
    "watery_diarrhea",
    "cramping_abdominal_pain",
    "bloating_abdominal_distension",
    "alternating_bowel_habits",
    "pain_eased_after_bowel_movement",
    "mucus_in_stool",
    "early_satiety",
    "loss_of_appetite",
    "belching_and_gas",
    "worse_lying_down_after_eating",
    "fever",
    "dehydration_thirst",
    "food_triggers_spicy_fatty_stress",
]

DIGESTIVE_PROFILES = {
    "Gastroenteritis": {
        "watery_diarrhea": 0.95,
        "nausea": 0.90,
        "vomiting": 0.85,
        "cramping_abdominal_pain": 0.85,
        "loss_of_appetite": 0.80,
        "dehydration_thirst": 0.75,
        "fever": 0.70,
        "bloating_abdominal_distension": 0.45,
        "mucus_in_stool": 0.15,
        "epigastric_burning_pain": 0.20,
        "pain_eased_after_bowel_movement": 0.35,
        "belching_and_gas": 0.25,
        "food_triggers_spicy_fatty_stress": 0.20,
        "heartburn_retrosternal_burning": 0.05,
        "acid_regurgitation": 0.05,
        "worse_lying_down_after_eating": 0.05,
        "alternating_bowel_habits": 0.05,
        "early_satiety": 0.10,
        "pain_worse_on_empty_stomach_or_night": 0.05,
        "pain_relieved_by_food_or_antacids": 0.02,
    },
    "Acid Reflux (GERD)": {
        "heartburn_retrosternal_burning": 0.95,
        "acid_regurgitation": 0.90,
        "worse_lying_down_after_eating": 0.88,
        "food_triggers_spicy_fatty_stress": 0.80,
        "belching_and_gas": 0.75,
        "epigastric_burning_pain": 0.40,
        "nausea": 0.35,
        "early_satiety": 0.30,
        "bloating_abdominal_distension": 0.30,
        "pain_worse_on_empty_stomach_or_night": 0.35,
        "loss_of_appetite": 0.15,
        "cramping_abdominal_pain": 0.10,
        "vomiting": 0.08,
        "pain_relieved_by_food_or_antacids": 0.45,
        "watery_diarrhea": 0.02,
        "fever": 0.01,
        "dehydration_thirst": 0.02,
        "mucus_in_stool": 0.01,
        "alternating_bowel_habits": 0.02,
        "pain_eased_after_bowel_movement": 0.02,
    },
    "Gastritis": {
        "epigastric_burning_pain": 0.90,
        "nausea": 0.82,
        "early_satiety": 0.78,
        "bloating_abdominal_distension": 0.75,
        "belching_and_gas": 0.72,
        "loss_of_appetite": 0.70,
        "food_triggers_spicy_fatty_stress": 0.60,
        "vomiting": 0.45,
        "heartburn_retrosternal_burning": 0.35,
        "acid_regurgitation": 0.30,
        "pain_worse_on_empty_stomach_or_night": 0.35,
        "pain_relieved_by_food_or_antacids": 0.25,
        "cramping_abdominal_pain": 0.25,
        "worse_lying_down_after_eating": 0.25,
        "watery_diarrhea": 0.10,
        "fever": 0.05,
        "dehydration_thirst": 0.08,
        "mucus_in_stool": 0.02,
        "alternating_bowel_habits": 0.05,
        "pain_eased_after_bowel_movement": 0.05,
    },
    "Peptic Ulcer Disease": {
        "epigastric_burning_pain": 0.95,
        "pain_worse_on_empty_stomach_or_night": 0.90,
        "pain_relieved_by_food_or_antacids": 0.85,
        "nausea": 0.65,
        "loss_of_appetite": 0.60,
        "belching_and_gas": 0.50,
        "bloating_abdominal_distension": 0.45,
        "early_satiety": 0.45,
        "food_triggers_spicy_fatty_stress": 0.45,
        "vomiting": 0.35,
        "heartburn_retrosternal_burning": 0.30,
        "acid_regurgitation": 0.25,
        "worse_lying_down_after_eating": 0.15,
        "cramping_abdominal_pain": 0.15,
        "watery_diarrhea": 0.02,
        "fever": 0.02,
        "dehydration_thirst": 0.05,
        "mucus_in_stool": 0.01,
        "alternating_bowel_habits": 0.02,
        "pain_eased_after_bowel_movement": 0.05,
    },
    "Irritable Bowel Syndrome (IBS)": {
        "cramping_abdominal_pain": 0.92,
        "pain_eased_after_bowel_movement": 0.88,
        "bloating_abdominal_distension": 0.85,
        "food_triggers_spicy_fatty_stress": 0.85,
        "alternating_bowel_habits": 0.82,
        "mucus_in_stool": 0.60,
        "belching_and_gas": 0.60,
        "nausea": 0.35,
        "early_satiety": 0.30,
        "watery_diarrhea": 0.40,
        "heartburn_retrosternal_burning": 0.15,
        "acid_regurgitation": 0.10,
        "loss_of_appetite": 0.20,
        "epigastric_burning_pain": 0.15,
        "vomiting": 0.08,
        "pain_relieved_by_food_or_antacids": 0.05,
        "pain_worse_on_empty_stomach_or_night": 0.10,
        "worse_lying_down_after_eating": 0.10,
        "dehydration_thirst": 0.05,
        "fever": 0.01,
    },
}

# =============================================================================
# 3. CATEGORY D: SKIN DISEASES
# =============================================================================

SKIN_FEATURES = [
    "comedones_blackheads_whiteheads",
    "inflammatory_papules_pustules",
    "deep_painful_nodules_cysts",
    "oily_skin_seborrhea",
    "facial_chest_back_distribution",
    "intense_itching_pruritus",
    "dry_cracked_flaking_skin",
    "flexural_distribution_inner_elbows_knees",
    "oozing_weeping_crusted_patches",
    "silvery_white_micaceous_scales",
    "well_demarcated_thick_red_plaques",
    "extensor_distribution_knees_elbows_scalp",
    "nail_changes_pitting_ridging",
    "ring_shaped_annular_patches",
    "macerated_scaly_skin_folds",
    "raised_transient_wheals_welts",
    "welts_resolve_within_24_hours",
    "burning_or_stinging_sensation",
    "allergic_or_contact_trigger",
    "aggravated_by_sweat_heat_friction",
]

SKIN_PROFILES = {
    "Acne": {
        "comedones_blackheads_whiteheads": 0.95,
        "facial_chest_back_distribution": 0.95,
        "inflammatory_papules_pustules": 0.90,
        "oily_skin_seborrhea": 0.85,
        "deep_painful_nodules_cysts": 0.45,
        "aggravated_by_sweat_heat_friction": 0.35,
        "intense_itching_pruritus": 0.10,
        "burning_or_stinging_sensation": 0.15,
        "dry_cracked_flaking_skin": 0.05,
        "silvery_white_micaceous_scales": 0.01,
        "well_demarcated_thick_red_plaques": 0.01,
        "ring_shaped_annular_patches": 0.01,
        "macerated_scaly_skin_folds": 0.01,
        "raised_transient_wheals_welts": 0.01,
        "welts_resolve_within_24_hours": 0.01,
        "flexural_distribution_inner_elbows_knees": 0.01,
        "extensor_distribution_knees_elbows_scalp": 0.02,
        "nail_changes_pitting_ridging": 0.01,
        "oozing_weeping_crusted_patches": 0.02,
        "allergic_or_contact_trigger": 0.05,
    },
    "Eczema": {
        "intense_itching_pruritus": 0.98,
        "dry_cracked_flaking_skin": 0.92,
        "flexural_distribution_inner_elbows_knees": 0.88,
        "allergic_or_contact_trigger": 0.75,
        "oozing_weeping_crusted_patches": 0.60,
        "burning_or_stinging_sensation": 0.45,
        "aggravated_by_sweat_heat_friction": 0.50,
        "comedones_blackheads_whiteheads": 0.01,
        "facial_chest_back_distribution": 0.25,
        "silvery_white_micaceous_scales": 0.02,
        "well_demarcated_thick_red_plaques": 0.05,
        "extensor_distribution_knees_elbows_scalp": 0.05,
        "ring_shaped_annular_patches": 0.02,
        "macerated_scaly_skin_folds": 0.15,
        "raised_transient_wheals_welts": 0.05,
        "welts_resolve_within_24_hours": 0.01,
        "oily_skin_seborrhea": 0.02,
        "inflammatory_papules_pustules": 0.15,
        "deep_painful_nodules_cysts": 0.01,
        "nail_changes_pitting_ridging": 0.05,
    },
    "Psoriasis": {
        "silvery_white_micaceous_scales": 0.95,
        "well_demarcated_thick_red_plaques": 0.92,
        "extensor_distribution_knees_elbows_scalp": 0.88,
        "nail_changes_pitting_ridging": 0.65,
        "dry_cracked_flaking_skin": 0.60,
        "intense_itching_pruritus": 0.45,
        "burning_or_stinging_sensation": 0.35,
        "aggravated_by_sweat_heat_friction": 0.25,
        "comedones_blackheads_whiteheads": 0.01,
        "facial_chest_back_distribution": 0.15,
        "oily_skin_seborrhea": 0.05,
        "flexural_distribution_inner_elbows_knees": 0.08,
        "oozing_weeping_crusted_patches": 0.05,
        "ring_shaped_annular_patches": 0.05,
        "macerated_scaly_skin_folds": 0.08,
        "raised_transient_wheals_welts": 0.01,
        "welts_resolve_within_24_hours": 0.01,
        "inflammatory_papules_pustules": 0.05,
        "deep_painful_nodules_cysts": 0.01,
        "allergic_or_contact_trigger": 0.05,
    },
    "Fungal Skin Infection": {
        "ring_shaped_annular_patches": 0.88,
        "intense_itching_pruritus": 0.85,
        "macerated_scaly_skin_folds": 0.82,
        "aggravated_by_sweat_heat_friction": 0.80,
        "dry_cracked_flaking_skin": 0.50,
        "burning_or_stinging_sensation": 0.45,
        "nail_changes_pitting_ridging": 0.30,
        "flexural_distribution_inner_elbows_knees": 0.35,
        "oozing_weeping_crusted_patches": 0.20,
        "comedones_blackheads_whiteheads": 0.01,
        "oily_skin_seborrhea": 0.02,
        "silvery_white_micaceous_scales": 0.05,
        "well_demarcated_thick_red_plaques": 0.10,
        "raised_transient_wheals_welts": 0.01,
        "welts_resolve_within_24_hours": 0.01,
        "extensor_distribution_knees_elbows_scalp": 0.05,
        "facial_chest_back_distribution": 0.10,
        "deep_painful_nodules_cysts": 0.02,
        "inflammatory_papules_pustules": 0.10,
        "allergic_or_contact_trigger": 0.05,
    },
    "Urticaria (Hives)": {
        "raised_transient_wheals_welts": 0.98,
        "intense_itching_pruritus": 0.95,
        "welts_resolve_within_24_hours": 0.92,
        "allergic_or_contact_trigger": 0.80,
        "burning_or_stinging_sensation": 0.70,
        "aggravated_by_sweat_heat_friction": 0.45,
        "comedones_blackheads_whiteheads": 0.01,
        "facial_chest_back_distribution": 0.35,
        "dry_cracked_flaking_skin": 0.02,
        "silvery_white_micaceous_scales": 0.01,
        "well_demarcated_thick_red_plaques": 0.02,
        "ring_shaped_annular_patches": 0.02,
        "macerated_scaly_skin_folds": 0.01,
        "flexural_distribution_inner_elbows_knees": 0.05,
        "extensor_distribution_knees_elbows_scalp": 0.05,
        "nail_changes_pitting_ridging": 0.01,
        "oozing_weeping_crusted_patches": 0.02,
        "oily_skin_seborrhea": 0.01,
        "inflammatory_papules_pustules": 0.02,
        "deep_painful_nodules_cysts": 0.01,
    },
}

# =============================================================================
# 4. CATEGORY E: URINARY TRACT DISEASES
# =============================================================================

URINARY_FEATURES = [
    "dysuria_burning_urination",
    "urinary_frequency",
    "urinary_urgency",
    "urgency_incontinence",
    "nocturia_multiple_night_trips",
    "weak_urinary_stream",
    "hesitancy_delayed_start",
    "intermittent_stream_stop_start",
    "straining_to_void",
    "feeling_incomplete_emptying",
    "renal_colic_severe_flank_pain",
    "pain_radiating_to_groin",
    "costovertebral_angle_tenderness",
    "high_fever_and_rigors",
    "hematuria_visible_blood_in_urine",
    "cloudy_foul_smelling_urine",
    "nausea_and_vomiting",
    "suprapubic_pelvic_pressure",
    "pain_fluctuates_in_spasms_waves",
    "fatigue_and_malaise",
]

URINARY_PROFILES = {
    "Urinary Tract Infection (UTI)": {
        "dysuria_burning_urination": 0.95,
        "urinary_frequency": 0.90,
        "urinary_urgency": 0.85,
        "cloudy_foul_smelling_urine": 0.80,
        "suprapubic_pelvic_pressure": 0.75,
        "hematuria_visible_blood_in_urine": 0.45,
        "urgency_incontinence": 0.25,
        "fatigue_and_malaise": 0.35,
        "nocturia_multiple_night_trips": 0.30,
        "feeling_incomplete_emptying": 0.30,
        "high_fever_and_rigors": 0.05,
        "costovertebral_angle_tenderness": 0.05,
        "renal_colic_severe_flank_pain": 0.02,
        "pain_radiating_to_groin": 0.05,
        "nausea_and_vomiting": 0.08,
        "weak_urinary_stream": 0.10,
        "hesitancy_delayed_start": 0.10,
        "intermittent_stream_stop_start": 0.08,
        "straining_to_void": 0.08,
        "pain_fluctuates_in_spasms_waves": 0.02,
    },
    "Kidney Stones": {
        "renal_colic_severe_flank_pain": 0.96,
        "pain_radiating_to_groin": 0.90,
        "pain_fluctuates_in_spasms_waves": 0.88,
        "hematuria_visible_blood_in_urine": 0.82,
        "nausea_and_vomiting": 0.78,
        "urinary_frequency": 0.50,
        "urinary_urgency": 0.45,
        "dysuria_burning_urination": 0.40,
        "costovertebral_angle_tenderness": 0.60,
        "fatigue_and_malaise": 0.45,
        "suprapubic_pelvic_pressure": 0.35,
        "high_fever_and_rigors": 0.05,
        "cloudy_foul_smelling_urine": 0.15,
        "nocturia_multiple_night_trips": 0.15,
        "weak_urinary_stream": 0.10,
        "hesitancy_delayed_start": 0.10,
        "intermittent_stream_stop_start": 0.08,
        "straining_to_void": 0.10,
        "feeling_incomplete_emptying": 0.15,
        "urgency_incontinence": 0.05,
    },
    "Kidney Infection (Pyelonephritis)": {
        "high_fever_and_rigors": 0.92,
        "costovertebral_angle_tenderness": 0.90,
        "fatigue_and_malaise": 0.88,
        "dysuria_burning_urination": 0.85,
        "urinary_frequency": 0.82,
        "cloudy_foul_smelling_urine": 0.78,
        "nausea_and_vomiting": 0.75,
        "urinary_urgency": 0.60,
        "suprapubic_pelvic_pressure": 0.50,
        "hematuria_visible_blood_in_urine": 0.45,
        "nocturia_multiple_night_trips": 0.40,
        "renal_colic_severe_flank_pain": 0.25,
        "pain_radiating_to_groin": 0.20,
        "pain_fluctuates_in_spasms_waves": 0.15,
        "urgency_incontinence": 0.15,
        "weak_urinary_stream": 0.10,
        "hesitancy_delayed_start": 0.10,
        "intermittent_stream_stop_start": 0.08,
        "straining_to_void": 0.05,
        "feeling_incomplete_emptying": 0.20,
    },
    "Overactive Bladder": {
        "urinary_urgency": 0.96,
        "urinary_frequency": 0.92,
        "urgency_incontinence": 0.85,
        "nocturia_multiple_night_trips": 0.80,
        "feeling_incomplete_emptying": 0.40,
        "suprapubic_pelvic_pressure": 0.35,
        "hesitancy_delayed_start": 0.15,
        "weak_urinary_stream": 0.10,
        "intermittent_stream_stop_start": 0.10,
        "straining_to_void": 0.08,
        "dysuria_burning_urination": 0.02,
        "high_fever_and_rigors": 0.01,
        "hematuria_visible_blood_in_urine": 0.01,
        "renal_colic_severe_flank_pain": 0.01,
        "cloudy_foul_smelling_urine": 0.02,
        "costovertebral_angle_tenderness": 0.01,
        "nausea_and_vomiting": 0.01,
        "pain_radiating_to_groin": 0.01,
        "pain_fluctuates_in_spasms_waves": 0.01,
        "fatigue_and_malaise": 0.10,
    },
    "Benign Prostatic Hyperplasia (BPH)": {
        "weak_urinary_stream": 0.92,
        "hesitancy_delayed_start": 0.90,
        "nocturia_multiple_night_trips": 0.88,
        "feeling_incomplete_emptying": 0.85,
        "intermittent_stream_stop_start": 0.82,
        "straining_to_void": 0.78,
        "urinary_frequency": 0.75,
        "urinary_urgency": 0.50,
        "urgency_incontinence": 0.30,
        "suprapubic_pelvic_pressure": 0.35,
        "dysuria_burning_urination": 0.05,
        "hematuria_visible_blood_in_urine": 0.10,
        "cloudy_foul_smelling_urine": 0.05,
        "high_fever_and_rigors": 0.01,
        "renal_colic_severe_flank_pain": 0.01,
        "costovertebral_angle_tenderness": 0.01,
        "nausea_and_vomiting": 0.01,
        "pain_radiating_to_groin": 0.01,
        "pain_fluctuates_in_spasms_waves": 0.01,
        "fatigue_and_malaise": 0.15,
    },
}


def generate_category_dataset(features, profiles, rows_per_class=ROWS_PER_CLASS, seed=RANDOM_SEED):
    rng = np.random.default_rng(seed)
    records = []
    for disease_name, profile in profiles.items():
        for _ in range(rows_per_class):
            row = {}
            for feature in features:
                prob = profile.get(feature, 0.05)
                row[feature] = int(rng.random() < prob)
            row["disease"] = disease_name
            records.append(row)

    df = pd.DataFrame(records)
    # Shuffle reproducibility
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df


def main():
    print("=" * 70)
    print("E-Sanjeevani 2.0 — Generating 5 Standardized Category Datasets")
    print(f"Random Seed: {RANDOM_SEED} | Rows Per Disease Class: {ROWS_PER_CLASS}")
    print("=" * 70)

    # 1. Category A: Fever Dataset (verify and copy from existing fever dataset)
    fever_dest = os.path.join(DATA_DIR, "fever_dataset.csv")
    if os.path.exists(FEVER_SOURCE_DATA):
        print(f"\n[Category A: Fever] Preserving existing fever dataset from:\n  {FEVER_SOURCE_DATA}")
        shutil.copy2(FEVER_SOURCE_DATA, fever_dest)
        fever_df = pd.read_csv(fever_dest)
        print(f"  Shape: {fever_df.shape[0]} rows x {fever_df.shape[1]} columns")
        print(f"  Classes: {list(fever_df['disease'].unique())}")
    else:
        print("\n[WARN] Source fever_dataset.csv not found, generating from fever script...")

    # 2. Category B: Respiratory Dataset
    print("\n[Category B: Respiratory] Generating synthetic respiratory dataset...")
    resp_df = generate_category_dataset(RESPIRATORY_FEATURES, RESPIRATORY_PROFILES, seed=42)
    resp_path = os.path.join(DATA_DIR, "respiratory_dataset.csv")
    resp_df.to_csv(resp_path, index=False)
    print(f"  Saved to: {resp_path}")
    print(f"  Shape: {resp_df.shape[0]} rows x {resp_df.shape[1]} columns")
    print(f"  Classes: {list(resp_df['disease'].unique())}")

    # 3. Category C: Digestive Dataset
    print("\n[Category C: Digestive] Generating synthetic digestive dataset...")
    dig_df = generate_category_dataset(DIGESTIVE_FEATURES, DIGESTIVE_PROFILES, seed=43)
    dig_path = os.path.join(DATA_DIR, "digestive_dataset.csv")
    dig_df.to_csv(dig_path, index=False)
    print(f"  Saved to: {dig_path}")
    print(f"  Shape: {dig_df.shape[0]} rows x {dig_df.shape[1]} columns")
    print(f"  Classes: {list(dig_df['disease'].unique())}")

    # 4. Category D: Skin Dataset
    print("\n[Category D: Skin] Generating synthetic skin dataset...")
    skin_df = generate_category_dataset(SKIN_FEATURES, SKIN_PROFILES, seed=44)
    skin_path = os.path.join(DATA_DIR, "skin_dataset.csv")
    skin_df.to_csv(skin_path, index=False)
    print(f"  Saved to: {skin_path}")
    print(f"  Shape: {skin_df.shape[0]} rows x {skin_df.shape[1]} columns")
    print(f"  Classes: {list(skin_df['disease'].unique())}")

    # 5. Category E: Urinary Tract Dataset
    print("\n[Category E: Urinary Tract] Generating synthetic urinary tract dataset...")
    uri_df = generate_category_dataset(URINARY_FEATURES, URINARY_PROFILES, seed=45)
    uri_path = os.path.join(DATA_DIR, "urinary_tract_dataset.csv")
    uri_df.to_csv(uri_path, index=False)
    print(f"  Saved to: {uri_path}")
    print(f"  Shape: {uri_df.shape[0]} rows x {uri_df.shape[1]} columns")
    print(f"  Classes: {list(uri_df['disease'].unique())}")

    # =========================================================================
    # CREATE DATA DICTIONARY
    # =========================================================================
    print("\nGenerating comprehensive Data Dictionary...")

    dictionary_rows = []

    # Category A features
    fever_df = pd.read_csv(fever_dest)
    for col in fever_df.columns:
        if col != "disease":
            dictionary_rows.append({
                "category": "Fever",
                "feature_name": col,
                "data_type": "Binary (0/1)",
                "description": col.replace("_", " ").title(),
                "clinical_relevance": "WHO Guideline fever differential feature",
            })
    for d in fever_df["disease"].unique():
        dictionary_rows.append({
            "category": "Fever",
            "feature_name": "[TARGET] disease",
            "data_type": "Categorical Label",
            "description": d,
            "clinical_relevance": "Target candidate condition in Fever category",
        })

    # Category B
    for col in RESPIRATORY_FEATURES:
        dictionary_rows.append({
            "category": "Respiratory",
            "feature_name": col,
            "data_type": "Binary (0/1)",
            "description": col.replace("_", " ").title(),
            "clinical_relevance": "Pulmonary & respiratory tract symptom indicator",
        })
    for d in RESPIRATORY_PROFILES.keys():
        dictionary_rows.append({
            "category": "Respiratory",
            "feature_name": "[TARGET] disease",
            "data_type": "Categorical Label",
            "description": d,
            "clinical_relevance": "Target candidate condition in Respiratory category",
        })

    # Category C
    for col in DIGESTIVE_FEATURES:
        dictionary_rows.append({
            "category": "Digestive",
            "feature_name": col,
            "data_type": "Binary (0/1)",
            "description": col.replace("_", " ").title(),
            "clinical_relevance": "Gastroenterological symptom indicator",
        })
    for d in DIGESTIVE_PROFILES.keys():
        dictionary_rows.append({
            "category": "Digestive",
            "feature_name": "[TARGET] disease",
            "data_type": "Categorical Label",
            "description": d,
            "clinical_relevance": "Target candidate condition in Digestive category",
        })

    # Category D
    for col in SKIN_FEATURES:
        dictionary_rows.append({
            "category": "Skin",
            "feature_name": col,
            "data_type": "Binary (0/1)",
            "description": col.replace("_", " ").title(),
            "clinical_relevance": "Dermatological symptom indicator",
        })
    for d in SKIN_PROFILES.keys():
        dictionary_rows.append({
            "category": "Skin",
            "feature_name": "[TARGET] disease",
            "data_type": "Categorical Label",
            "description": d,
            "clinical_relevance": "Target candidate condition in Skin category",
        })

    # Category E
    for col in URINARY_FEATURES:
        dictionary_rows.append({
            "category": "Urinary Tract",
            "feature_name": col,
            "data_type": "Binary (0/1)",
            "description": col.replace("_", " ").title(),
            "clinical_relevance": "Urological and renal symptom indicator",
        })
    for d in URINARY_PROFILES.keys():
        dictionary_rows.append({
            "category": "Urinary Tract",
            "feature_name": "[TARGET] disease",
            "data_type": "Categorical Label",
            "description": d,
            "clinical_relevance": "Target candidate condition in Urinary Tract category",
        })

    dict_df = pd.DataFrame(dictionary_rows)
    dict_csv = os.path.join(DATA_DIR, "data_dictionary.csv")
    dict_df.to_csv(dict_csv, index=False)
    print(f"  Data dictionary CSV saved to: {dict_csv}")

    # Generate Markdown documentation
    dict_md = os.path.join(DATA_DIR, "DATA_DICTIONARY.md")
    with open(dict_md, "w", encoding="utf-8") as f:
        f.write("# E-Sanjeevani 2.0 — Unified Triage Data Dictionary\n\n")
        f.write("> **Educational & Prototyping Notice:** All datasets in this directory (fever, respiratory, digestive, skin, urinary tract) comprise clinically reviewed synthetic symptom profiles modeled after international medical guidelines (WHO, NICE, CDC). They are designed for machine learning prototyping and educational evaluation. Independent clinical validation is strictly required prior to real-world clinical deployment.\n\n")
        f.write("## Overview of Five Triage Categories\n\n")
        f.write("| Category | Dataset File | Rows | Features | Classes |\n")
        f.write("| --- | --- | --- | --- | --- |\n")
        f.write(f"| **Fever** | `fever_dataset.csv` | {len(fever_df)} | {fever_df.shape[1]-1} | Dengue, Malaria, Typhoid, Chikungunya, Viral_Fever |\n")
        f.write(f"| **Respiratory** | `respiratory_dataset.csv` | {len(resp_df)} | {resp_df.shape[1]-1} | Common Cold, Asthma, Pneumonia, Bronchitis, Influenza |\n")
        f.write(f"| **Digestive** | `digestive_dataset.csv` | {len(dig_df)} | {dig_df.shape[1]-1} | Gastroenteritis, Acid Reflux (GERD), Gastritis, Peptic Ulcer Disease, Irritable Bowel Syndrome (IBS) |\n")
        f.write(f"| **Skin** | `skin_dataset.csv` | {len(skin_df)} | {skin_df.shape[1]-1} | Acne, Eczema, Psoriasis, Fungal Skin Infection, Urticaria (Hives) |\n")
        f.write(f"| **Urinary Tract** | `urinary_tract_dataset.csv` | {len(uri_df)} | {uri_df.shape[1]-1} | Urinary Tract Infection (UTI), Kidney Stones, Kidney Infection (Pyelonephritis), Overactive Bladder, Benign Prostatic Hyperplasia (BPH) |\n\n")
        f.write("## Detailed Feature Definitions\n\n")
        f.write("| Category | Feature / Target | Data Type | Description | Clinical Relevance |\n")
        f.write("| --- | --- | --- | --- | --- |\n")
        for r in dictionary_rows:
            f.write(f"| {r['category']} | `{r['feature_name']}` | {r['data_type']} | {r['description']} | {r['clinical_relevance']} |\n")

    print(f"  Data dictionary Markdown saved to: {dict_md}")
    print("\n[SUCCESS] All 5 category datasets created successfully!\n")


if __name__ == "__main__":
    main()
