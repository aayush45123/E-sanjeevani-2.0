# E-Sanjeevani 2.0 — Unified Triage Models Evaluation Report

> **Clinical Notice:** These evaluation metrics are derived from stratified held-out test splits of clinically curated synthetic datasets. High statistical scores demonstrate internal feature-pattern separation under explicit clinical profiles, not real-world clinical efficacy. Diagnostic validation with certified medical datasets is mandatory prior to clinical application.

## Overall Performance Summary

| Category | Selected Algorithm | Test Accuracy | Macro F1 | Macro Precision | Macro Recall | ROC-AUC | 5-Fold CV F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Category A: Fever** | Logistic Regression | 86.00% | 0.8600 | 0.8621 | 0.8600 | 0.9813 | 0.8710 ± 0.0333 |
| **Category B: Respiratory Diseases** | Extra Trees | 95.00% | 0.9503 | 0.9510 | 0.9500 | 0.9938 | 0.9516 ± 0.0042 |
| **Category C: Digestive Diseases** | Logistic Regression | 91.33% | 0.9142 | 0.9171 | 0.9133 | 0.9921 | 0.9248 ± 0.0099 |
| **Category D: Skin Diseases** | Logistic Regression | 99.00% | 0.9900 | 0.9902 | 0.9900 | 0.9996 | 0.9933 ± 0.0062 |
| **Category E: Urinary Tract Diseases** | Logistic Regression | 97.33% | 0.9734 | 0.9735 | 0.9733 | 0.9976 | 0.9759 ± 0.0061 |

## Per-Category Disease Breakdown

### Category A: Fever

- **Algorithm:** Logistic Regression
- **Features (25):** `fever, high_fever, sudden_onset, headache, severe_headache, chills, sweating, body_pain, muscle_pain, joint_pain, severe_joint_pain, pain_behind_eyes, rash, nausea, vomiting, abdominal_pain, diarrhea, constipation, cough, sore_throat, runny_nose, fatigue, weakness, swollen_lymph_nodes, loss_of_appetite`

| Disease Class | Precision | Recall | F1-Score | Support |
| --- | --- | --- | --- | --- |
| Chikungunya | 0.8182 | 0.9000 | 0.8571 | 60.0 |
| Dengue | 0.8421 | 0.8000 | 0.8205 | 60.0 |
| Malaria | 0.8226 | 0.8500 | 0.8361 | 60.0 |
| Typhoid | 0.9259 | 0.8333 | 0.8772 | 60.0 |
| Viral_Fever | 0.9016 | 0.9167 | 0.9091 | 60.0 |

### Category B: Respiratory Diseases

- **Algorithm:** Extra Trees
- **Features (20):** `cough, productive_cough, shortness_of_breath, wheezing, chest_tightness, pleuritic_chest_pain, fever, high_fever, chills, sore_throat, runny_nose, nasal_congestion, sneezing, fatigue, headache, muscle_aches, rapid_shallow_breathing, loss_of_appetite, symptom_triggers_allergens_exercise, night_sweats`

| Disease Class | Precision | Recall | F1-Score | Support |
| --- | --- | --- | --- | --- |
| Asthma | 0.9655 | 0.9333 | 0.9492 | 60.0 |
| Bronchitis | 0.8889 | 0.9333 | 0.9106 | 60.0 |
| Common Cold | 0.9833 | 0.9833 | 0.9833 | 60.0 |
| Influenza | 0.9344 | 0.9500 | 0.9421 | 60.0 |
| Pneumonia | 0.9828 | 0.9500 | 0.9661 | 60.0 |

### Category C: Digestive Diseases

- **Algorithm:** Logistic Regression
- **Features (20):** `heartburn_retrosternal_burning, acid_regurgitation, epigastric_burning_pain, pain_relieved_by_food_or_antacids, pain_worse_on_empty_stomach_or_night, nausea, vomiting, watery_diarrhea, cramping_abdominal_pain, bloating_abdominal_distension, alternating_bowel_habits, pain_eased_after_bowel_movement, mucus_in_stool, early_satiety, loss_of_appetite, belching_and_gas, worse_lying_down_after_eating, fever, dehydration_thirst, food_triggers_spicy_fatty_stress`

| Disease Class | Precision | Recall | F1-Score | Support |
| --- | --- | --- | --- | --- |
| Acid Reflux (GERD) | 0.9492 | 0.9333 | 0.9412 | 60.0 |
| Gastritis | 0.7794 | 0.8833 | 0.8281 | 60.0 |
| Gastroenteritis | 0.9833 | 0.9833 | 0.9833 | 60.0 |
| Irritable Bowel Syndrome (IBS) | 0.9828 | 0.9500 | 0.9661 | 60.0 |
| Peptic Ulcer Disease | 0.8909 | 0.8167 | 0.8522 | 60.0 |

### Category D: Skin Diseases

- **Algorithm:** Logistic Regression
- **Features (20):** `comedones_blackheads_whiteheads, inflammatory_papules_pustules, deep_painful_nodules_cysts, oily_skin_seborrhea, facial_chest_back_distribution, intense_itching_pruritus, dry_cracked_flaking_skin, flexural_distribution_inner_elbows_knees, oozing_weeping_crusted_patches, silvery_white_micaceous_scales, well_demarcated_thick_red_plaques, extensor_distribution_knees_elbows_scalp, nail_changes_pitting_ridging, ring_shaped_annular_patches, macerated_scaly_skin_folds, raised_transient_wheals_welts, welts_resolve_within_24_hours, burning_or_stinging_sensation, allergic_or_contact_trigger, aggravated_by_sweat_heat_friction`

| Disease Class | Precision | Recall | F1-Score | Support |
| --- | --- | --- | --- | --- |
| Acne | 1.0000 | 1.0000 | 1.0000 | 60.0 |
| Eczema | 0.9833 | 0.9833 | 0.9833 | 60.0 |
| Fungal Skin Infection | 1.0000 | 0.9667 | 0.9831 | 60.0 |
| Psoriasis | 0.9677 | 1.0000 | 0.9836 | 60.0 |
| Urticaria (Hives) | 1.0000 | 1.0000 | 1.0000 | 60.0 |

### Category E: Urinary Tract Diseases

- **Algorithm:** Logistic Regression
- **Features (20):** `dysuria_burning_urination, urinary_frequency, urinary_urgency, urgency_incontinence, nocturia_multiple_night_trips, weak_urinary_stream, hesitancy_delayed_start, intermittent_stream_stop_start, straining_to_void, feeling_incomplete_emptying, renal_colic_severe_flank_pain, pain_radiating_to_groin, costovertebral_angle_tenderness, high_fever_and_rigors, hematuria_visible_blood_in_urine, cloudy_foul_smelling_urine, nausea_and_vomiting, suprapubic_pelvic_pressure, pain_fluctuates_in_spasms_waves, fatigue_and_malaise`

| Disease Class | Precision | Recall | F1-Score | Support |
| --- | --- | --- | --- | --- |
| Benign Prostatic Hyperplasia (BPH) | 1.0000 | 0.9833 | 0.9916 | 60.0 |
| Kidney Infection (Pyelonephritis) | 0.9661 | 0.9500 | 0.9580 | 60.0 |
| Kidney Stones | 0.9836 | 1.0000 | 0.9917 | 60.0 |
| Overactive Bladder | 0.9833 | 0.9833 | 0.9833 | 60.0 |
| Urinary Tract Infection (UTI) | 0.9344 | 0.9500 | 0.9421 | 60.0 |

