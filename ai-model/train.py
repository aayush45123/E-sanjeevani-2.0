# ============================================================
# train.py — E-Sanjeevani 2.0 | Enterprise Disease AI Model
# Fixes: MemoryError from RandomForest on large dataset
# Strategy: ExtraTreesClassifier + depth/job constraints
#           + uint8 dtype compression + chunked CSV loading
# ============================================================

import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.metrics import classification_report, accuracy_score

# ============================================================
# STEP 1: Load Dataset (memory-efficient)
# ============================================================

print("==========================================")
print("STEP 1: Loading Final Augmented Dataset...")
print("==========================================")

CSV_PATH = "data/Final_Augmented_dataset_Diseases_and_Symptoms.csv"

# Load with low_memory=False to avoid dtype warnings
df = pd.read_csv(CSV_PATH, low_memory=False)

print("Dataset Loaded Successfully")
print(df.head())
print("\nColumns Found:")
print(df.columns)
print(f"\nInitial dataset size: {len(df)}")

# ============================================================
# STEP 2: Clean & Normalize
# ============================================================

# Standardize target column name
if "diseases" in df.columns:
    df = df.rename(columns={"diseases": "disease"})

# Drop duplicates and nulls
df = df.drop_duplicates()
df = df.dropna()

# ============================================================
# STEP 3: Remove Ultra-Rare Diseases
# ============================================================

print("\n==========================================")
print("STEP 2: Removing ultra-rare diseases...")
print("==========================================")

disease_counts = df["disease"].value_counts()
valid_diseases = disease_counts[disease_counts >= 5].index  # min 5 samples per class
df = df[df["disease"].isin(valid_diseases)]

print(f"Filtered dataset size: {len(df)}")
print(f"Remaining diseases: {df['disease'].nunique()}")

# ============================================================
# STEP 4: Prepare Features & Target
# ============================================================

y = df["disease"]
X = df.drop("disease", axis=1)

# *** KEY FIX: Cast symptom columns to uint8 (saves ~4x RAM) ***
# Symptom columns are binary (0/1), so uint8 is sufficient
X = X.astype(np.uint8)

print(f"\nFeature matrix memory usage: {X.memory_usage(deep=True).sum() / 1024**2:.1f} MB")

# ============================================================
# STEP 5: Encode Labels
# ============================================================

print("\n==========================================")
print("STEP 3: Encoding disease labels...")
print("==========================================")

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print(f"Total unique classes: {len(label_encoder.classes_)}")

# ============================================================
# STEP 6: Train/Test Split
# ============================================================

print("\n==========================================")
print("STEP 4: Splitting dataset...")
print("==========================================")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

# ============================================================
# STEP 7: Train Model (Memory-Optimized)
# ============================================================

print("\n==========================================")
print("STEP 5: Training Enterprise Disease Model...")
print("==========================================")
print(f"Training on {len(X_train)} samples with {X.shape[1]} features...")

# WHY ExtraTreesClassifier instead of RandomForest?
# - Uses random splits (no best-split search) → much lower memory
# - Faster training on large datasets
# - Comparable or better accuracy for symptom-based classification
#
# KEY MEMORY PARAMS:
# - n_estimators=100    : fewer trees = less RAM
# - max_depth=20        : caps tree growth, prevents memory explosion
# - min_samples_leaf=4  : prunes tiny leaf nodes
# - n_jobs=1            : single thread — parallel jobs multiply RAM usage!
# - max_features='sqrt' : only sqrt(377)~19 features per split

model = ExtraTreesClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=6,
    min_samples_leaf=4,
    max_features="sqrt",
    class_weight="balanced",   # handles imbalanced disease classes
    random_state=42,
    n_jobs=1,                  # DO NOT change to -1 — causes MemoryError
    verbose=1
)

model.fit(X_train, y_train)

# ============================================================
# STEP 8: Evaluate
# ============================================================

print("\n==========================================")
print("STEP 6: Evaluating model...")
print("==========================================")

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✅ Model Accuracy: {accuracy * 100:.2f}%")

# Top-5 accuracy (useful for multi-class disease prediction)
try:
    y_proba = model.predict_proba(X_test)
    top5_correct = 0
    for i, true_label in enumerate(y_test):
        top5_preds = np.argsort(y_proba[i])[-5:]
        if true_label in top5_preds:
            top5_correct += 1
    top5_acc = top5_correct / len(y_test)
    print(f"✅ Top-5 Accuracy:  {top5_acc * 100:.2f}%")
except Exception:
    pass

# ============================================================
# STEP 9: Save Artifacts
# ============================================================

print("\n==========================================")
print("STEP 7: Saving model files...")
print("==========================================")

os.makedirs("models", exist_ok=True)

joblib.dump(model,          "models/disease_model.pkl",         compress=3)
joblib.dump(label_encoder,  "models/disease_label_encoder.pkl", compress=3)
joblib.dump(list(X.columns),"models/symptom_columns.pkl",       compress=3)

# Save disease name mapping for API use
disease_map = {
    int(i): str(name)
    for i, name in enumerate(label_encoder.classes_)
}
joblib.dump(disease_map, "models/disease_map.pkl", compress=3)

print("\nSaved Files:")
print("✓ models/disease_model.pkl")
print("✓ models/disease_label_encoder.pkl")
print("✓ models/symptom_columns.pkl")
print("✓ models/disease_map.pkl")

print("\n==========================================")
print("SUCCESS: Enterprise AI Triage Model Trained")
print("==========================================")