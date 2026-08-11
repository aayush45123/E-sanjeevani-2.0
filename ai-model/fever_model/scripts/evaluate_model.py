"""
evaluate_model.py
=================
Loads the saved fever model and produces full evaluation artifacts:
  - Classification report
  - Confusion matrix (saved as PNG)
  - Per-class ROC curves (saved as PNG)
  - SHAP feature importance plot (saved as PNG)
  - SHAP summary plot (saved as PNG)

Output saved to: fever_model/notebook/

Usage:
    python scripts/evaluate_model.py
"""

import os
import sys
import warnings
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    auc,
)
from sklearn.preprocessing import label_binarize

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BASE_DIR     = os.path.join(SCRIPT_DIR, "..")
MODELS_DIR   = os.path.join(SCRIPT_DIR, "..", "..", "models")
DATA_PATH    = os.path.join(BASE_DIR, "data", "fever_dataset.csv")
OUTPUT_DIR   = os.path.join(BASE_DIR, "notebook")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# LOAD ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────

def load_artifacts():
    model_path    = os.path.join(MODELS_DIR, "fever_model.pkl")
    encoder_path  = os.path.join(MODELS_DIR, "fever_label_encoder.pkl")
    features_path = os.path.join(MODELS_DIR, "fever_feature_names.pkl")

    for p in [model_path, encoder_path, features_path]:
        if not os.path.exists(p):
            print(f"❌ Missing: {p}")
            print("   Run train_model.py first.")
            sys.exit(1)

    model         = joblib.load(model_path)
    le            = joblib.load(encoder_path)
    feature_names = joblib.load(features_path)
    return model, le, feature_names


# ─────────────────────────────────────────────────────────────────────────────
# CONFUSION MATRIX PLOT
# ─────────────────────────────────────────────────────────────────────────────

def plot_confusion_matrix(y_test, preds, class_names, output_dir):
    cm = confusion_matrix(y_test, preds)
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.title("Confusion Matrix — Fever Differential Assessment Model", fontsize=13, fontweight="bold")
    plt.ylabel("Actual Disease", fontsize=11)
    plt.xlabel("Predicted Disease", fontsize=11)
    plt.tight_layout()
    path = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"✓ Confusion matrix saved: {path}")


# ─────────────────────────────────────────────────────────────────────────────
# ROC CURVES
# ─────────────────────────────────────────────────────────────────────────────

def plot_roc_curves(y_test, proba, le, output_dir):
    classes = le.classes_
    n_classes = len(classes)
    y_bin = label_binarize(y_test, classes=list(range(n_classes)))

    plt.figure(figsize=(9, 6))
    colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"]

    for i, (cls, color) in enumerate(zip(classes, colors)):
        fpr, tpr, _ = roc_curve(y_bin[:, i], proba[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, color=color, lw=2,
                 label=f"{cls} (AUC = {roc_auc:.3f})")

    plt.plot([0, 1], [0, 1], "k--", lw=1, label="Random (AUC = 0.500)")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate", fontsize=11)
    plt.ylabel("True Positive Rate", fontsize=11)
    plt.title("Per-Class ROC Curves — Fever Differential Assessment", fontsize=13, fontweight="bold")
    plt.legend(loc="lower right", fontsize=9)
    plt.tight_layout()
    path = os.path.join(output_dir, "roc_curves.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"✓ ROC curves saved: {path}")


# ─────────────────────────────────────────────────────────────────────────────
# SHAP PLOTS
# ─────────────────────────────────────────────────────────────────────────────

def plot_shap(model, X_test, feature_names, le, output_dir):
    try:
        import shap
    except ImportError:
        print("⚠  SHAP not installed. Skipping SHAP plots. Run: pip install shap")
        return

    print("\n  Computing SHAP values (this may take ~30s)...")
    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    class_names = le.classes_

    # Summary plot (all classes, one bar per feature)
    plt.figure()
    shap.summary_plot(
        shap_values,
        X_test,
        class_names=class_names,
        plot_type="bar",
        show=False,
    )
    plt.title("SHAP Feature Importance — All Classes", fontsize=12, fontweight="bold")
    plt.tight_layout()
    path = os.path.join(output_dir, "shap_summary.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"✓ SHAP summary saved: {path}")

    # Per-class dot plot for Dengue (class 0 typically)
    try:
        dengue_idx = list(class_names).index("Dengue")
        plt.figure()
        shap.summary_plot(
            shap_values[dengue_idx],
            X_test,
            show=False,
        )
        plt.title("SHAP — Dengue Class Feature Impact", fontsize=12, fontweight="bold")
        plt.tight_layout()
        path2 = os.path.join(output_dir, "shap_dengue.png")
        plt.savefig(path2, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"✓ SHAP Dengue plot saved: {path2}")
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Fever Differential Assessment — Model Evaluation")
    print("=" * 60)

    model, le, feature_names = load_artifacts()

    # Reload data and reconstruct test set (same seed = same split)
    df            = pd.read_csv(DATA_PATH)
    X             = df[feature_names]
    y_encoded     = le.transform(df["disease"])

    _, X_test, _, y_test = train_test_split(
        X, y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded,
    )

    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)

    # ── Text report ──────────────────────────────────────────────────────────
    print(f"\n{'─'*55}")
    print("  CLASSIFICATION REPORT")
    print(f"{'─'*55}")
    print(classification_report(y_test, preds, target_names=le.classes_))

    macro_roc = roc_auc_score(y_test, proba, multi_class="ovr", average="macro")
    print(f"  ROC-AUC (macro OvR): {macro_roc:.4f}")

    # ── Plots ────────────────────────────────────────────────────────────────
    plot_confusion_matrix(y_test, preds, le.classes_, OUTPUT_DIR)
    plot_roc_curves(y_test, proba, le, OUTPUT_DIR)
    plot_shap(model, X_test, feature_names, le, OUTPUT_DIR)

    print(f"\n✓ All evaluation artifacts saved to: {OUTPUT_DIR}\n")


if __name__ == "__main__":
    main()
