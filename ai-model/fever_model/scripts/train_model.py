"""
train_model.py
==============
Trains and compares three classifiers for fever differential assessment:
  - Logistic Regression
  - Random Forest (primary model)
  - XGBoost

Saves the best-performing model as:
  ../../models/fever_model.pkl
  ../../models/fever_label_encoder.pkl
  ../../models/fever_feature_names.pkl

Usage:
    python scripts/train_model.py
"""

import os
import sys

# Force UTF-8 stdout/stderr encoding on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import time
import joblib
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
)

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("[INFO] XGBoost not installed. Skipping XGBoost.")

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.join(SCRIPT_DIR, "..")
DATA_PATH   = os.path.join(BASE_DIR, "data", "fever_dataset.csv")
MODELS_DIR  = os.path.join(SCRIPT_DIR, "..", "..", "models")

os.makedirs(MODELS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# LOAD & PREPARE DATA
# ─────────────────────────────────────────────────────────────────────────────

def load_data():
    if not os.path.exists(DATA_PATH):
        print(f"\n[ERROR] Dataset not found at: {DATA_PATH}")
        print("   Run generate_dataset.py first.\n")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"[OK] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"  Class distribution:\n{df['disease'].value_counts().to_string()}\n")
    return df


def prepare_features(df):
    X = df.drop("disease", axis=1)
    y = df["disease"]

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Stratified split — 80% train / 20% test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded,
    )

    print(f"  Train size: {X_train.shape[0]} rows")
    print(f"  Test size:  {X_test.shape[0]} rows\n")

    return X_train, X_test, y_train, y_test, le, X.columns.tolist()


# ─────────────────────────────────────────────────────────────────────────────
# MODEL DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

def get_models(n_classes):
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
            multi_class="multinomial",
            solver="lbfgs",
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        ),
    }

    if XGBOOST_AVAILABLE:
        models["XGBoost"] = XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="mlogloss",
            random_state=42,
        )

    return models


# ─────────────────────────────────────────────────────────────────────────────
# EVALUATE ONE MODEL
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_model(name, model, X_train, X_test, y_train, y_test, le):
    print(f"\n{'-'*55}")
    print(f"  MODEL: {name}")
    print(f"{'-'*55}")

    t0 = time.time()
    model.fit(X_train, y_train)
    elapsed = time.time() - t0

    preds      = model.predict(X_test)
    proba      = model.predict_proba(X_test)

    accuracy   = accuracy_score(y_test, preds)
    f1_macro   = f1_score(y_test, preds, average="macro")
    roc_auc    = roc_auc_score(y_test, proba, multi_class="ovr", average="macro")

    print(f"  Training time : {elapsed:.2f}s")
    print(f"  Accuracy      : {accuracy:.4f}")
    print(f"  F1 (macro)    : {f1_macro:.4f}")
    print(f"  ROC-AUC (OvR) : {roc_auc:.4f}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, preds, target_names=le.classes_))
    print(f"\n  Confusion Matrix:")
    cm = confusion_matrix(y_test, preds)
    cm_df = pd.DataFrame(cm, index=le.classes_, columns=le.classes_)
    print(cm_df.to_string())

    # 5-fold cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
    print(f"\n  5-Fold CV F1 (macro): {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    return {
        "model":    model,
        "name":     name,
        "accuracy": accuracy,
        "f1":       f1_macro,
        "roc_auc":  roc_auc,
        "cv_mean":  cv_scores.mean(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Fever Differential Assessment - Model Training")
    print("=" * 60)

    # Load
    df = load_data()
    X_train, X_test, y_train, y_test, le, feature_names = prepare_features(df)

    # Train & evaluate all models
    results = []
    models_dict = get_models(len(le.classes_))

    for name, model in models_dict.items():
        result = evaluate_model(name, model, X_train, X_test, y_train, y_test, le)
        results.append(result)

    # Pick best model (by F1 macro)
    best = max(results, key=lambda r: r["f1"])

    print(f"\n{'='*55}")
    print(f"  RESULTS SUMMARY")
    print(f"{'='*55}")
    print(f"  {'Model':<25} {'Accuracy':>10} {'F1 Macro':>10} {'ROC-AUC':>10}")
    print(f"  {'-'*55}")
    for r in results:
        marker = " [BEST]" if r["name"] == best["name"] else ""
        print(f"  {r['name']:<25} {r['accuracy']:>10.4f} {r['f1']:>10.4f} {r['roc_auc']:>10.4f}{marker}")

    print(f"\n  Best model: {best['name']}")
    print(f"  F1 (macro): {best['f1']:.4f}")

    # Save artifacts
    model_path   = os.path.join(MODELS_DIR, "fever_model.pkl")
    encoder_path = os.path.join(MODELS_DIR, "fever_label_encoder.pkl")
    features_path = os.path.join(MODELS_DIR, "fever_feature_names.pkl")

    joblib.dump(best["model"], model_path)
    joblib.dump(le, encoder_path)
    joblib.dump(feature_names, features_path)

    print(f"\n[OK] Saved: {model_path}")
    print(f"[OK] Saved: {encoder_path}")
    print(f"[OK] Saved: {features_path}")
    print(f"\n[DONE] Training complete.\n")


if __name__ == "__main__":
    main()
