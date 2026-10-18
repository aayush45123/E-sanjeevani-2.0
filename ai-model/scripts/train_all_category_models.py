"""
train_all_category_models.py
============================
E-Sanjeevani 2.0 — Unified Triage System Multi-Category Model Trainer

Trains and evaluates classification models for all five disease categories:
  1. fever
  2. respiratory
  3. digestive
  4. skin
  5. urinary_tract

Evaluates multiple algorithms per category:
  - Logistic Regression
  - Random Forest Classifier
  - Extra Trees Classifier
  - Gradient Boosting Classifier

Saves best model artifacts into `ai-model/models/`:
  - {category}_model.pkl
  - {category}_label_encoder.pkl
  - {category}_feature_names.pkl
  - {category}_metadata.json

Generates comprehensive evaluation results and metrics.
"""

import os
import sys
import json
import time
import joblib
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# Force UTF-8 stdout/stderr encoding on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_MODEL_DIR = os.path.join(SCRIPT_DIR, "..")
DATA_DIR = os.path.join(AI_MODEL_DIR, "data")
MODELS_DIR = os.path.join(AI_MODEL_DIR, "models")
EVAL_DIR = os.path.join(AI_MODEL_DIR, "evaluation_results")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

CATEGORIES = [
    {
        "key": "fever",
        "name": "Category A: Fever",
        "filename": "fever_dataset.csv",
    },
    {
        "key": "respiratory",
        "name": "Category B: Respiratory Diseases",
        "filename": "respiratory_dataset.csv",
    },
    {
        "key": "digestive",
        "name": "Category C: Digestive Diseases",
        "filename": "digestive_dataset.csv",
    },
    {
        "key": "skin",
        "name": "Category D: Skin Diseases",
        "filename": "skin_dataset.csv",
    },
    {
        "key": "urinary_tract",
        "name": "Category E: Urinary Tract Diseases",
        "filename": "urinary_tract_dataset.csv",
    },
]


def get_candidate_algorithms():
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
            solver="lbfgs",
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=250,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        ),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=250,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
        ),
    }


def train_and_evaluate_category(cat_info):
    cat_key = cat_info["key"]
    cat_name = cat_info["name"]
    csv_file = os.path.join(DATA_DIR, cat_info["filename"])

    print("\n" + "=" * 70)
    print(f"TRAINING {cat_name.upper()} ({csv_file})")
    print("=" * 70)

    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"Dataset not found: {csv_file}")

    df = pd.read_csv(csv_file)
    print(f"Dataset shape: {df.shape[0]} rows x {df.shape[1]} columns")

    X = df.drop("disease", axis=1)
    y = df["disease"]
    feature_names = X.columns.tolist()

    # Encode target labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    classes = list(le.classes_)
    print(f"Disease classes ({len(classes)}): {classes}")

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded,
    )
    print(f"Split: Train={len(X_train)} samples, Test={len(X_test)} samples (Stratified)")

    # 5-Fold Stratified Cross Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    candidates = get_candidate_algorithms()
    candidate_results = []

    print("\nEvaluating Candidate Algorithms (5-Fold CV + Test Set Evaluation):")
    print(f"  {'Algorithm':<22} {'CV F1':>10} {'Test Acc':>10} {'Test F1':>10} {'Time(s)':>8}")
    print("  " + "-" * 64)

    for alg_name, model in candidates.items():
        t0 = time.time()
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
        model.fit(X_train, y_train)
        elapsed = time.time() - t0

        test_preds = model.predict(X_test)
        acc = accuracy_score(y_test, test_preds)
        f1_macro = f1_score(y_test, test_preds, average="macro")

        try:
            test_proba = model.predict_proba(X_test)
            roc_auc = roc_auc_score(y_test, test_proba, multi_class="ovr", average="macro")
        except Exception:
            roc_auc = 0.0

        candidate_results.append({
            "name": alg_name,
            "model": model,
            "cv_f1_mean": float(cv_scores.mean()),
            "cv_f1_std": float(cv_scores.std()),
            "test_accuracy": float(acc),
            "test_f1_macro": float(f1_macro),
            "test_roc_auc": float(roc_auc),
            "train_time_sec": round(elapsed, 2),
        })

        print(f"  {alg_name:<22} {cv_scores.mean():>10.4f} {acc:>10.4f} {f1_macro:>10.4f} {elapsed:>8.2f}")

    # Select best model based on test F1 macro and CV mean
    best = max(candidate_results, key=lambda r: (r["test_f1_macro"], r["cv_f1_mean"]))
    print(f"\n>> Selected Best Model: {best['name']} (Test F1: {best['test_f1_macro']:.4f}, Test Acc: {best['test_accuracy']:.4f})")

    best_model = best["model"]
    y_pred = best_model.predict(X_test)
    report_dict = classification_report(y_test, y_pred, target_names=classes, output_dict=True)
    report_text = classification_report(y_test, y_pred, target_names=classes)
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=classes, columns=classes)

    print("\nClassification Report (Best Model):")
    print(report_text)
    print("\nConfusion Matrix:")
    print(cm_df.to_string())

    # Save trained artifacts
    model_path = os.path.join(MODELS_DIR, f"{cat_key}_model.pkl")
    encoder_path = os.path.join(MODELS_DIR, f"{cat_key}_label_encoder.pkl")
    features_path = os.path.join(MODELS_DIR, f"{cat_key}_feature_names.pkl")
    meta_path = os.path.join(MODELS_DIR, f"{cat_key}_metadata.json")

    joblib.dump(best_model, model_path, compress=3)
    joblib.dump(le, encoder_path, compress=3)
    joblib.dump(feature_names, features_path, compress=3)

    metadata = {
        "category": cat_key,
        "category_name": cat_name,
        "selected_algorithm": best["name"],
        "model_class": best_model.__class__.__name__,
        "dataset_rows": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "num_features": len(feature_names),
        "features": feature_names,
        "classes": classes,
        "metrics": {
            "test_accuracy": best["test_accuracy"],
            "test_f1_macro": best["test_f1_macro"],
            "test_precision_macro": float(precision_score(y_test, y_pred, average="macro")),
            "test_recall_macro": float(recall_score(y_test, y_pred, average="macro")),
            "test_roc_auc": best["test_roc_auc"],
            "cv_5fold_f1_mean": best["cv_f1_mean"],
            "cv_5fold_f1_std": best["cv_f1_std"],
        },
        "per_class_metrics": {
            cls: {
                "precision": report_dict[cls]["precision"],
                "recall": report_dict[cls]["recall"],
                "f1_score": report_dict[cls]["f1-score"],
                "support": report_dict[cls]["support"],
            }
            for cls in classes
        },
        "confusion_matrix": cm.tolist(),
        "candidate_comparison": [
            {
                "algorithm": r["name"],
                "cv_f1_mean": r["cv_f1_mean"],
                "test_accuracy": r["test_accuracy"],
                "test_f1_macro": r["test_f1_macro"],
                "test_roc_auc": r["test_roc_auc"],
            }
            for r in candidate_results
        ],
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "disclaimer": "Trained on clinically curated synthetic data for prototyping and educational use only. Independent clinical validation required before medical use.",
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[OK] Persisted Artifacts for {cat_key}:")
    print(f"  ✓ Model:          {model_path}")
    print(f"  ✓ Label Encoder:  {encoder_path}")
    print(f"  ✓ Feature List:   {features_path}")
    print(f"  ✓ Metadata:       {meta_path}")

    return metadata


def main():
    print("=" * 70)
    print("E-Sanjeevani 2.0 — Unified Triage System Multi-Category Training")
    print("=" * 70)

    summary_results = []
    for cat_info in CATEGORIES:
        meta = train_and_evaluate_category(cat_info)
        summary_results.append(meta)

    # Save summary report
    summary_path = os.path.join(EVAL_DIR, "all_categories_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_results, f, indent=2)

    summary_md_path = os.path.join(EVAL_DIR, "TRIAGE_MODELS_EVALUATION_REPORT.md")
    with open(summary_md_path, "w", encoding="utf-8") as f:
        f.write("# E-Sanjeevani 2.0 — Unified Triage Models Evaluation Report\n\n")
        f.write("> **Clinical Notice:** These evaluation metrics are derived from stratified held-out test splits of clinically curated synthetic datasets. High statistical scores demonstrate internal feature-pattern separation under explicit clinical profiles, not real-world clinical efficacy. Diagnostic validation with certified medical datasets is mandatory prior to clinical application.\n\n")
        f.write("## Overall Performance Summary\n\n")
        f.write("| Category | Selected Algorithm | Test Accuracy | Macro F1 | Macro Precision | Macro Recall | ROC-AUC | 5-Fold CV F1 |\n")
        f.write("| --- | --- | --- | --- | --- | --- | --- | --- |\n")
        for m in summary_results:
            met = m["metrics"]
            f.write(f"| **{m['category_name']}** | {m['selected_algorithm']} | {met['test_accuracy']*100:.2f}% | {met['test_f1_macro']:.4f} | {met['test_precision_macro']:.4f} | {met['test_recall_macro']:.4f} | {met['test_roc_auc']:.4f} | {met['cv_5fold_f1_mean']:.4f} ± {met['cv_5fold_f1_std']:.4f} |\n")

        f.write("\n## Per-Category Disease Breakdown\n\n")
        for m in summary_results:
            f.write(f"### {m['category_name']}\n\n")
            f.write(f"- **Algorithm:** {m['selected_algorithm']}\n")
            f.write(f"- **Features ({m['num_features']}):** `{', '.join(m['features'])}`\n\n")
            f.write("| Disease Class | Precision | Recall | F1-Score | Support |\n")
            f.write("| --- | --- | --- | --- | --- |\n")
            for cls, pmet in m["per_class_metrics"].items():
                f.write(f"| {cls} | {pmet['precision']:.4f} | {pmet['recall']:.4f} | {pmet['f1_score']:.4f} | {pmet['support']} |\n")
            f.write("\n")

    print("\n" + "=" * 70)
    print("ALL 5 CATEGORY MODELS TRAINED & EVALUATED SUCCESSFULLY!")
    print(f"Summary JSON:     {summary_path}")
    print(f"Summary Markdown: {summary_md_path}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
