# IEEE Evaluation Report — E-Sanjeevani Fever Differential Classifier

Generated: 2026-09-09 21:26:44

---

## MODEL

| Field | Value |
|---|---|
| Model type | `LogisticRegression` |
| Model artifact | `C:\Users\aayush\OneDrive\Desktop\E-sanjeevani 2.0\ai-model\models\fever_model.pkl` |
| Feature count | 25 |
| Class count | 5 |
| Encoder order | Chikungunya, Dengue, Malaria, Typhoid, Viral_Fever |

### Feature Names (25 binary symptom indicators)

```
   1. fever
   2. high_fever
   3. sudden_onset
   4. headache
   5. severe_headache
   6. chills
   7. sweating
   8. body_pain
   9. muscle_pain
  10. joint_pain
  11. severe_joint_pain
  12. pain_behind_eyes
  13. rash
  14. nausea
  15. vomiting
  16. abdominal_pain
  17. diarrhea
  18. constipation
  19. cough
  20. sore_throat
  21. runny_nose
  22. fatigue
  23. weakness
  24. swollen_lymph_nodes
  25. loss_of_appetite
```

### Class Labels

| Index | Class (encoder order) | Paper display name |
|---|---|---|
| 0 | Chikungunya | Chikungunya |
| 1 | Dengue | Dengue |
| 2 | Malaria | Malaria |
| 3 | Typhoid | Typhoid |
| 4 | Viral\_Fever | Viral Fever |

### Preprocessing Pipeline

- **Input**: Binary integer vector (0/1) of 25 symptom indicators
- **Scaling / normalization**: None (raw binary features passed directly)
- **Imputation**: None (missing symptoms default to 0 in production)
- **Feature ordering**: Fixed by `fever_feature_names.pkl`
- **Label encoding**: `sklearn.preprocessing.LabelEncoder` (alphabetical → integer)

---

## DATASET

| Field | Value |
|---|---|
| Dataset file | `fever_model/data/fever_dataset.csv` |
| Dataset type | Synthetic/Curated (WHO-grounded) |
| Total rows | 1,500 |
| Total test rows | 300 |
| Split method | Stratified 80/20, random\_state=42 |
| Genuinely held-out? | **NO** (see note below) |

**IMPORTANT — Dataset provenance note (mandatory for academic reporting):**

The fever differential dataset (`fever_dataset.csv`) is **synthetic/curated** — it was programmatically generated from WHO clinical symptom profiles (see `fever_model/data/sources.md`).  It consists of 1,500 rows (300 per class) with binary symptom indicators sampled from disease-specific probability distributions grounded in WHO fact sheets.

The test split (20%, 300 samples) was produced by `sklearn.model_selection.train_test_split(test_size=0.20, random_state=42, stratify=y)` inside `train_model.py`.  **This same split was used during model training to select the best classifier** (the script compares Logistic Regression, Random Forest, and XGBoost on this split).  Therefore:

- The test set is **not an independent held-out set in the strict sense**; it was seen by the model-selection procedure.
- The metrics below reflect **in-distribution performance** on synthetic data.
- These results **cannot be extrapolated to real patient populations** without validation on genuine clinical data.

These limitations must be stated explicitly in the paper.

### Class Distribution (Test Set)

| Disease | Samples | % |
|---|---:|---:|
| Dengue             |      60 | 20.0% |
| Malaria            |      60 | 20.0% |
| Typhoid            |      60 | 20.0% |
| Chikungunya        |      60 | 20.0% |
| Viral Fever        |      60 | 20.0% |
| **Total** | **300** | **100%** |

**Balance assessment**: BALANCED (all classes ≈ 20%)

---

## RESULTS

### Overall

| Metric | Value |
|---|---:|
| Overall Accuracy | 0.8600 |
| Top-1 Accuracy | 0.8600 |
| Top-3 Accuracy | 0.9967 |
| Macro Precision | 0.8621 |
| Macro Recall | 0.8600 |
| Macro F1-score | 0.8600 |
| Weighted Precision | 0.8621 |
| Weighted Recall | 0.8600 |
| Weighted F1-score | 0.8600 |

### Per-Class Results

| Class | Precision | Recall | F1-score | Support |
|---|---:|---:|---:|---:|
| Dengue          | 0.8421 | 0.8000 | 0.8205 |      60 |
| Malaria         | 0.8226 | 0.8500 | 0.8361 |      60 |
| Typhoid         | 0.9259 | 0.8333 | 0.8772 |      60 |
| Chikungunya     | 0.8182 | 0.9000 | 0.8571 |      60 |
| Viral Fever     | 0.9016 | 0.9167 | 0.9091 |      60 |
| **Macro Avg**   | **0.8621** | **0.8600** | **0.8600** |     300 |
| **Weighted Avg**| **0.8621** | **0.8600** | **0.8600** |     300 |


> Top-1 Accuracy: highest-probability predicted class == true class.
> Top-3 Accuracy: true class appears in the 3 highest-probability predictions.

---

## CONFUSION MATRIX

True class = row, Predicted class = column.
Class ordering: Dengue, Malaria, Typhoid, Chikungunya, Viral Fever.

```
             Dengue  Malaria  Typhoid  Chikungunya  Viral_Fever
Dengue           48        0        1           10            1
Malaria           0       51        3            2            4
Typhoid           2        7       50            0            1
Chikungunya       5        1        0           54            0
Viral_Fever       2        3        0            0           55
```

See `confusion_matrix.png` for the heatmap visualization.

---

## SHAP ANALYSIS

| Rank | Feature | Mean |SHAP| |
|---|---|---:|
| 1 | `joint_pain` | 0.65022 |
| 2 | `chills` | 0.54210 |
| 3 | `severe_joint_pain` | 0.48023 |
| 4 | `sudden_onset` | 0.47358 |
| 5 | `cough` | 0.46574 |
| 6 | `rash` | 0.42558 |
| 7 | `abdominal_pain` | 0.39560 |
| 8 | `muscle_pain` | 0.38448 |
| 9 | `high_fever` | 0.34969 |
| 10 | `pain_behind_eyes` | 0.34451 |


Mean |SHAP| values represent the average absolute contribution of each symptom to the model's output logit across all test samples and all 5 disease classes.  A high mean |SHAP| indicates that the feature shifts the model's predictions substantially, on average.  This is a measure of **model feature importance** — it does NOT imply clinical causality or diagnostic sufficiency of any individual symptom.

See `shap_summary_bar.png` for the global bar chart.
Per-class plots: `shap_beeswarm_<ClassName>.png` (5 files).

---

## INFERENCE LATENCY

- **Test samples timed**: 300
- **Total inference time** (predict only): 1.39 ms
- **Average per sample**: 0.0046 ms

> **Note**: Timing reflects model `.predict()` only (numpy matrix-vector multiply for Logistic Regression). It excludes preprocessing, API/network latency, database access, and SHAP computation.

---

## SANITY CHECKS (ALL PASSED)

- [x] `len(predictions) == len(test_labels)` (300)
- [x] All predictions belong to the 5 expected class indices (0–4)
- [x] `proba.shape == (300, 5)`
- [x] All probability rows sum to 1.0 (±1e-5)
- [x] All probabilities in [0, 1]
- [x] No NaN or Inf in test features
- [x] Feature count matches model (25)
- [x] Column ordering matches `fever_feature_names.pkl`
- [x] Confusion matrix total == test set size (300)
- [x] Per-class support totals == test set size (300)
- [x] Top-3 accuracy ≥ Top-1 accuracy (0.9967 ≥ 0.8600)

---

## LIMITATIONS / DATA QUALITY NOTES

1. **Synthetic data**: The dataset is generated, not from real patient records. Performance
   on real clinical data may differ substantially.

2. **Model type discrepancy**: The production artifact (`fever_model.pkl`) contains a
   **Logistic Regression** classifier — NOT XGBoost as described in the paper. XGBoost was
   one of three candidates evaluated during training, but Logistic Regression was selected
   as the best performer by macro F1 on this test split. The paper must be corrected or
   clarified: the deployed model is a multinomial Logistic Regression with L2 regularization,
   `class_weight='balanced'`, `solver='lbfgs'`, `max_iter=1000`, `random_state=42`.

3. **Test-set independence**: The 20% test split was used for model *selection* inside
   `train_model.py` (best model picked by F1 on this split), so these results carry mild
   optimistic bias. A genuinely held-out dataset was never created.

4. **SHAP explainer**: Production `app.py` uses `shap.TreeExplainer` for tree-based models
   and falls back to linear coefficient weights for `LogisticRegression`. This evaluation
   uses `shap.LinearExplainer` (the mathematically appropriate SHAP method for linear models),
   which provides signed, additive Shapley values. Results will differ from coefficient-based
   attribution.

5. **No scaling**: Binary (0, 1) features are passed raw. Logistic Regression is not
   sensitive to scale on binary features, so this is appropriate.

6. **Class balance**: The test set is perfectly balanced (60 samples per class) due to
   stratified splitting of the balanced synthetic dataset. Weighted and macro averages
   are therefore equal for balanced classes.
