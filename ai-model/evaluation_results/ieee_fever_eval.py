"""
ieee_fever_eval.py
==================
Reproducible evaluation of the existing E-Sanjeevani Fever Differential Classifier.
For IEEE research paper reporting.

STRICTLY READ-ONLY with respect to production artifacts.
Does NOT modify:  models/fever_model.pkl
Does NOT modify:  models/fever_label_encoder.pkl
Does NOT modify:  models/fever_feature_names.pkl
Does NOT modify:  fever_model/data/fever_dataset.csv
Does NOT modify:  app.py or any production code

Execution:
    cd ai-model
    python evaluation_results/ieee_fever_eval.py

Outputs (written to evaluation_results/):
    eval_results.json          — full machine-readable results
    per_class_metrics.csv      — per-class precision/recall/F1/support
    confusion_matrix.csv       — raw 5x5 confusion matrix
    confusion_matrix.png       — heatmap visualization
    shap_summary_bar.png       — SHAP mean|SHAP| bar chart (all classes)
    shap_beeswarm_<cls>.png    — per-class SHAP beeswarm dot plot (5 files)
    ieee_evaluation_report.md  — full human-readable Markdown report
"""

import os
import sys
import json
import time
import warnings
import traceback

# ── Force UTF-8 on Windows ────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    top_k_accuracy_score,
)

# ─────────────────────────────────────────────────────────────────────────────
# PATHS  — all relative to this script's parent directory (ai-model/)
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
AI_MODEL_DIR = os.path.dirname(SCRIPT_DIR)          # ai-model/
MODELS_DIR   = os.path.join(AI_MODEL_DIR, "models")
DATA_PATH    = os.path.join(AI_MODEL_DIR, "fever_model", "data", "fever_dataset.csv")
OUT_DIR      = SCRIPT_DIR                           # evaluation_results/

os.makedirs(OUT_DIR, exist_ok=True)

# Class order required by the paper (not alphabetical)
PAPER_CLASS_ORDER = ["Dengue", "Malaria", "Typhoid", "Chikungunya", "Viral_Fever"]

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Load production artifacts (read-only)
# ─────────────────────────────────────────────────────────────────────────────

def load_artifacts():
    model_path    = os.path.join(MODELS_DIR, "fever_model.pkl")
    encoder_path  = os.path.join(MODELS_DIR, "fever_label_encoder.pkl")
    features_path = os.path.join(MODELS_DIR, "fever_feature_names.pkl")

    missing = [p for p in [model_path, encoder_path, features_path] if not os.path.exists(p)]
    if missing:
        print("\n[FATAL] Missing production artifacts:")
        for p in missing:
            print(f"   {p}")
        sys.exit(1)

    model         = joblib.load(model_path)
    le            = joblib.load(encoder_path)
    feature_names = joblib.load(features_path)

    print(f"[OK] Model loaded     : {model_path}")
    print(f"[OK] Encoder loaded   : {encoder_path}")
    print(f"[OK] Features loaded  : {features_path}")
    print(f"      Model type      : {type(model).__name__}")
    print(f"      Feature count   : {len(feature_names)}")
    print(f"      Classes (encoder order) : {list(le.classes_)}")

    return model, le, feature_names, model_path


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Reconstruct identical test split
# ─────────────────────────────────────────────────────────────────────────────

def reconstruct_test_split(le, feature_names):
    """
    Mirrors EXACTLY the split in train_model.py:
      train_test_split(X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded)

    This produces the SAME test set the model was evaluated against during training.
    It is NOT an independent held-out set — see the Limitations section of the report.
    """
    if not os.path.exists(DATA_PATH):
        print(f"\n[FATAL] Dataset not found: {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"\n[OK] Dataset loaded: {df.shape[0]} rows x {df.shape[1]} columns")

    X         = df[feature_names]
    y_encoded = le.transform(df["disease"])

    _, X_test, _, y_test = train_test_split(
        X, y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded,
    )

    print(f"[OK] Test split reconstructed: {len(X_test)} rows "
          f"(20% stratified, random_state=42)")
    return X_test, y_test, df


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Sanity checks BEFORE prediction
# ─────────────────────────────────────────────────────────────────────────────

def sanity_check_input(model, X_test, feature_names):
    print("\n[SANITY] Input checks ...")

    # Feature count
    expected_features = len(feature_names)
    actual_features   = X_test.shape[1]
    assert actual_features == expected_features, (
        f"Feature count mismatch: model expects {expected_features}, got {actual_features}"
    )
    print(f"  [OK] Feature count matches: {actual_features}")

    # No NaN
    nan_count = int(X_test.isnull().sum().sum())
    assert nan_count == 0, f"NaN values found in X_test: {nan_count}"
    print(f"  [OK] No NaN values in test features")

    # No Inf
    inf_count = int(np.isinf(X_test.values.astype(float)).sum())
    assert inf_count == 0, f"Inf values found in X_test: {inf_count}"
    print(f"  [OK] No Inf values in test features")

    # Column order
    assert list(X_test.columns) == feature_names, "Column ordering mismatch"
    print(f"  [OK] Column ordering is correct")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Run inference and collect probabilities
# ─────────────────────────────────────────────────────────────────────────────

def run_inference(model, X_test, le):
    print("\n[INFERENCE] Running predictions ...")

    t0         = time.perf_counter()
    preds      = model.predict(X_test)
    t1         = time.perf_counter()
    proba      = model.predict_proba(X_test)
    t2         = time.perf_counter()

    total_inference_ms  = (t1 - t0) * 1000
    per_sample_ms       = total_inference_ms / len(X_test)

    print(f"  Predictions   : {len(preds)}")
    print(f"  Proba shape   : {proba.shape}")
    print(f"  Inference time: {total_inference_ms:.2f} ms total "
          f"({per_sample_ms:.4f} ms/sample)")

    return preds, proba, total_inference_ms, per_sample_ms


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Sanity checks AFTER prediction
# ─────────────────────────────────────────────────────────────────────────────

def sanity_check_output(preds, proba, y_test, le):
    print("\n[SANITY] Output checks ...")

    n_samples   = len(y_test)
    n_classes   = len(le.classes_)

    assert len(preds) == n_samples, "Prediction count != test label count"
    print(f"  [OK] len(preds) == len(y_test) == {n_samples}")

    assert proba.shape == (n_samples, n_classes), (
        f"Proba shape mismatch: expected ({n_samples}, {n_classes}), got {proba.shape}"
    )
    print(f"  [OK] proba.shape == ({n_samples}, {n_classes})")

    valid_classes = set(range(n_classes))
    pred_classes  = set(preds)
    assert pred_classes.issubset(valid_classes), (
        f"Predictions contain unexpected class indices: {pred_classes - valid_classes}"
    )
    print(f"  [OK] All predictions are valid class indices")

    prob_sums = proba.sum(axis=1)
    assert np.allclose(prob_sums, 1.0, atol=1e-5), (
        f"Probability rows do not sum to 1. Range: [{prob_sums.min():.6f}, {prob_sums.max():.6f}]"
    )
    print(f"  [OK] All probability rows sum to 1.0")

    assert (proba >= 0).all() and (proba <= 1).all(), "Probabilities outside [0,1]"
    print(f"  [OK] All probabilities in [0, 1]")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Compute all metrics
# ─────────────────────────────────────────────────────────────────────────────

def compute_metrics(preds, proba, y_test, le):
    print("\n[METRICS] Computing ...")

    n_classes   = len(le.classes_)
    class_names = list(le.classes_)     # encoder-native order (alphabetical)

    # ── Overall accuracy ─────────────────────────────────────────────────────
    accuracy = float(accuracy_score(y_test, preds))
    print(f"  Overall accuracy    : {accuracy:.6f}")

    # ── Top-1 accuracy (== accuracy when using argmax) ────────────────────────
    top1 = float(top_k_accuracy_score(y_test, proba, k=1))
    print(f"  Top-1 accuracy      : {top1:.6f}")

    # ── Top-3 accuracy ────────────────────────────────────────────────────────
    top3 = float(top_k_accuracy_score(y_test, proba, k=3))
    print(f"  Top-3 accuracy      : {top3:.6f}")

    assert top3 >= top1, "Top-3 accuracy must be >= Top-1 accuracy"
    print(f"  [OK] Top-3 >= Top-1")

    # ── Per-class metrics ────────────────────────────────────────────────────
    precision_per, recall_per, f1_per, support_per = precision_recall_fscore_support(
        y_test, preds, average=None, labels=list(range(n_classes))
    )

    # ── Macro averages ────────────────────────────────────────────────────────
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_test, preds, average="macro"
    )

    # ── Weighted averages ─────────────────────────────────────────────────────
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
        y_test, preds, average="weighted"
    )

    print(f"  Macro  P/R/F1  : {macro_p:.4f} / {macro_r:.4f} / {macro_f1:.4f}")
    print(f"  Weighted P/R/F1: {weighted_p:.4f} / {weighted_r:.4f} / {weighted_f1:.4f}")

    # ── Support sanity check ──────────────────────────────────────────────────
    total_support = int(support_per.sum())
    assert total_support == len(y_test), (
        f"Support totals ({total_support}) != test set size ({len(y_test)})"
    )
    print(f"  [OK] Support totals == test set size == {total_support}")

    # ── Build per-class dict (encoder order) ──────────────────────────────────
    per_class = {}
    for i, cls in enumerate(class_names):
        per_class[cls] = {
            "precision": float(round(precision_per[i], 6)),
            "recall":    float(round(recall_per[i], 6)),
            "f1":        float(round(f1_per[i], 6)),
            "support":   int(support_per[i]),
        }

    return {
        "accuracy":           round(accuracy, 6),
        "top1_accuracy":      round(top1, 6),
        "top3_accuracy":      round(top3, 6),
        "macro_precision":    round(float(macro_p), 6),
        "macro_recall":       round(float(macro_r), 6),
        "macro_f1":           round(float(macro_f1), 6),
        "weighted_precision": round(float(weighted_p), 6),
        "weighted_recall":    round(float(weighted_r), 6),
        "weighted_f1":        round(float(weighted_f1), 6),
        "per_class":          per_class,
    }


# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Confusion matrix
# ─────────────────────────────────────────────────────────────────────────────

def compute_and_save_confusion_matrix(preds, y_test, le):
    print("\n[CONFUSION MATRIX] Computing ...")

    class_names = list(le.classes_)      # encoder order

    # sklearn confusion_matrix uses label order = sorted(unique(y_test))
    # Since y_test contains integers 0..4 corresponding to le.classes_,
    # and le.classes_ is already sorted alphabetically, labels=range(5) is safe.
    cm = confusion_matrix(y_test, preds, labels=list(range(len(class_names))))

    # ── Verify totals ─────────────────────────────────────────────────────────
    cm_total = int(cm.sum())
    assert cm_total == len(y_test), f"CM total {cm_total} != test set {len(y_test)}"
    print(f"  [OK] CM total == test set size == {cm_total}")

    cm_df = pd.DataFrame(cm, index=class_names, columns=class_names)
    print("\n  Confusion Matrix (encoder-native order):")
    print(cm_df.to_string())

    # ── Reorder rows/cols to paper order ─────────────────────────────────────
    # Map class name → encoder index
    cls_to_idx = {cls: i for i, cls in enumerate(class_names)}
    paper_order_present = [c for c in PAPER_CLASS_ORDER if c in cls_to_idx]
    cm_paper = cm_df.loc[paper_order_present, paper_order_present]

    print("\n  Confusion Matrix (paper order: Dengue, Malaria, Typhoid, Chikungunya, Viral_Fever):")
    print(cm_paper.to_string())

    return cm, cm_df, cm_paper


def save_confusion_matrix_csv(cm_paper, out_dir):
    path = os.path.join(out_dir, "confusion_matrix.csv")
    cm_paper.to_csv(path)
    print(f"[OK] Confusion matrix CSV saved: {path}")
    return path


def plot_confusion_matrix(cm_paper, out_dir):
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm_paper,
        annot=True,
        fmt="d",
        cmap="Blues",
        linewidths=0.5,
        linecolor="grey",
        ax=ax,
    )
    ax.set_title(
        "Confusion Matrix — Fever Differential Classifier\n"
        "(True class = row, Predicted class = column)",
        fontsize=12, fontweight="bold", pad=12,
    )
    ax.set_ylabel("True Disease", fontsize=11)
    ax.set_xlabel("Predicted Disease", fontsize=11)
    plt.tight_layout()
    path = os.path.join(out_dir, "confusion_matrix.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[OK] Confusion matrix PNG saved: {path}")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — Class imbalance report
# ─────────────────────────────────────────────────────────────────────────────

def class_distribution(y_test, le):
    class_names = list(le.classes_)
    total       = len(y_test)
    dist        = {}
    for i, cls in enumerate(class_names):
        count = int((y_test == i).sum())
        dist[cls] = {
            "count":   count,
            "percent": round(count / total * 100, 2),
        }
    print("\n[CLASS DISTRIBUTION]")
    for cls, v in dist.items():
        print(f"  {cls:<18}: {v['count']:>4}  ({v['percent']:.1f}%)")
    return dist, total


# ─────────────────────────────────────────────────────────────────────────────
# STEP 9 — SHAP analysis
# ─────────────────────────────────────────────────────────────────────────────

def run_shap_analysis(model, X_test, feature_names, le, out_dir):
    """
    Uses the SAME SHAP TreeExplainer approach as the production explain_model.py
    and app.py.  For LogisticRegression the production code falls back to
    linear_coef; we mirror that approach here using shap.LinearExplainer which
    is the SHAP-native equivalent and gives signed, additive SHAP values.
    """
    try:
        import shap
    except ImportError:
        print("[WARN] SHAP not installed — skipping SHAP analysis.")
        return None

    print("\n[SHAP] Running SHAP analysis ...")

    class_names = list(le.classes_)
    X_arr = X_test.values.astype(float)

    # ── Choose explainer matching the model type ──────────────────────────────
    model_type = type(model).__name__

    if hasattr(model, "estimators_"):
        # Tree-based (Random Forest, GradientBoosting, XGBoost)
        print(f"  Using TreeExplainer for {model_type}")
        explainer   = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
        # shap_values is a list of arrays [n_classes][n_samples, n_features]
        # or 3D array depending on shap version
        if isinstance(shap_values, list):
            shap_arr = np.array(shap_values)   # [n_classes, n_samples, n_features]
        else:
            shap_arr = shap_values             # already 3D

    elif hasattr(model, "coef_"):
        # Linear model (Logistic Regression etc.)
        # shap 0.52 LinearExplainer requires a masker or mean background
        print(f"  Using LinearExplainer (independent masker) for {model_type}")
        # Independent masker: background = mean of X_test values
        try:
            masker    = shap.maskers.Independent(X_test, max_samples=300)
            explainer = shap.LinearExplainer(model, masker)
        except Exception:
            # Fallback: plain numpy mean background
            bg        = X_test.values.astype(float).mean(axis=0, keepdims=True)
            explainer = shap.LinearExplainer(model, bg)
        shap_values = explainer.shap_values(X_test)
        # shap_values for multi-class linear: list of [n_samples, n_features]
        if isinstance(shap_values, list):
            shap_arr = np.array(shap_values)   # [n_classes, n_samples, n_features]
        else:
            shap_arr = shap_values

    else:
        print(f"  [WARN] Unknown model type for SHAP: {model_type}. Skipping.")
        return None

    print(f"  SHAP array shape: {shap_arr.shape}")

    # ── Normalise array to [n_classes, n_samples, n_features] ─────────────────
    # shap 0.52 LinearExplainer (multi-class) returns:
    #   ndarray of shape [n_samples, n_features, n_classes]
    # We need to transpose to [n_classes, n_samples, n_features] for consistency
    if shap_arr.ndim == 3 and shap_arr.shape[2] == len(le.classes_) and shap_arr.shape[0] != len(le.classes_):
        # Layout is [n_samples, n_features, n_classes] — transpose
        shap_arr = shap_arr.transpose(2, 0, 1)  # → [n_classes, n_samples, n_features]
        print(f"  SHAP array transposed to: {shap_arr.shape}")
    # After this, shap_arr[i] gives [n_samples, n_features] for class i

    # ── Mean absolute SHAP per feature (averaged across all classes) ──────────
    mean_abs_shap = np.abs(shap_arr).mean(axis=(0, 1))   # [n_features]
    feature_importance = dict(zip(feature_names, mean_abs_shap.tolist()))
    sorted_fi = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)

    print("\n  Top-10 features by mean |SHAP| (all classes):")
    for rank, (feat, val) in enumerate(sorted_fi[:10], 1):
        print(f"    {rank:2}. {feat:<25}  {val:.5f}")

    # ── Save: global bar summary ──────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(9, 6))
    top_n  = min(25, len(sorted_fi))
    names  = [s[0] for s in sorted_fi[:top_n]]
    values = [s[1] for s in sorted_fi[:top_n]]
    colors = ["#2d6a9f" if i < 5 else "#7fb3d3" for i in range(top_n)]
    ax.barh(names[::-1], values[::-1], color=colors[::-1], edgecolor="white")
    ax.set_xlabel("Mean |SHAP value| (averaged over all classes and test samples)", fontsize=10)
    ax.set_title(
        "Feature Importance — Mean |SHAP| Value\nFever Differential Classifier",
        fontsize=12, fontweight="bold"
    )
    plt.tight_layout()
    bar_path = os.path.join(out_dir, "shap_summary_bar.png")
    plt.savefig(bar_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[OK] SHAP global bar chart saved: {bar_path}")

    # ── Per-class mean |SHAP| ─────────────────────────────────────────────────
    per_class_shap = {}
    shap_png_paths = []

    for i, cls in enumerate(class_names):
        cls_shap = shap_arr[i]  # [n_samples, n_features]
        cls_mean_abs = np.abs(cls_shap).mean(axis=0)
        cls_fi = sorted(zip(feature_names, cls_mean_abs.tolist()),
                        key=lambda x: x[1], reverse=True)
        per_class_shap[cls] = {feat: round(val, 6) for feat, val in cls_fi}

        # ── Beeswarm-style dot plot per class ─────────────────────────────────
        try:
            fig, ax = plt.subplots(figsize=(9, 6))
            top_cls = cls_fi[:15]
            c_names = [s[0] for s in top_cls]
            c_vals  = [s[1] for s in top_cls]
            ax.barh(c_names[::-1], c_vals[::-1], color="#2d6a9f", edgecolor="white")
            ax.set_xlabel("Mean |SHAP value|", fontsize=10)
            ax.set_title(
                f"SHAP Feature Importance — {cls.replace('_', ' ')} Class",
                fontsize=12, fontweight="bold"
            )
            plt.tight_layout()
            cls_safe = cls.replace(" ", "_").replace("/", "_")
            p = os.path.join(out_dir, f"shap_beeswarm_{cls_safe}.png")
            plt.savefig(p, dpi=150, bbox_inches="tight")
            plt.close()
            shap_png_paths.append(p)
            print(f"[OK] Per-class SHAP plot saved: {p}")
        except Exception as e:
            print(f"[WARN] Could not save per-class SHAP for {cls}: {e}")

    return {
        "global_feature_importance": {k: round(v, 6) for k, v in sorted_fi},
        "per_class_feature_importance": per_class_shap,
        "top_10_features": [{"feature": k, "mean_abs_shap": round(v, 6)} for k, v in sorted_fi[:10]],
        "shap_bar_chart": bar_path,
        "shap_class_plots": shap_png_paths,
    }


# ─────────────────────────────────────────────────────────────────────────────
# STEP 10 — Save all outputs
# ─────────────────────────────────────────────────────────────────────────────

def save_per_class_csv(metrics, out_dir):
    rows = []
    for cls in PAPER_CLASS_ORDER:
        if cls in metrics["per_class"]:
            m = metrics["per_class"][cls]
            rows.append({
                "Disease":   cls,
                "Precision": m["precision"],
                "Recall":    m["recall"],
                "F1":        m["f1"],
                "Support":   m["support"],
            })
    # Macro and Weighted rows
    rows.append({
        "Disease":   "Macro Avg",
        "Precision": metrics["macro_precision"],
        "Recall":    metrics["macro_recall"],
        "F1":        metrics["macro_f1"],
        "Support":   sum(r["Support"] for r in rows),
    })
    rows.append({
        "Disease":   "Weighted Avg",
        "Precision": metrics["weighted_precision"],
        "Recall":    metrics["weighted_recall"],
        "F1":        metrics["weighted_f1"],
        "Support":   sum(r["Support"] for r in rows[:-1]),
    })
    df = pd.DataFrame(rows)
    path = os.path.join(out_dir, "per_class_metrics.csv")
    df.to_csv(path, index=False)
    print(f"[OK] Per-class metrics CSV saved: {path}")
    return path


def save_json_results(full_results, out_dir):
    path = os.path.join(out_dir, "eval_results.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(full_results, f, indent=2, ensure_ascii=False)
    print(f"[OK] Full results JSON saved: {path}")
    return path


def save_markdown_report(full_results, metrics, dist, total_samples,
                         cm_paper, shap_results, lat,
                         model_path, out_dir):
    """Write the complete IEEE-ready markdown report."""

    mdl        = full_results["model"]
    ds         = full_results["dataset"]
    pc         = metrics["per_class"]

    # Build per-class table (paper order)
    rows_md = ""
    for cls in PAPER_CLASS_ORDER:
        if cls in pc:
            m = pc[cls]
            rows_md += (
                f"| {cls.replace('_', ' '):<15} "
                f"| {m['precision']:.4f} "
                f"| {m['recall']:.4f} "
                f"| {m['f1']:.4f} "
                f"| {m['support']:>7} |\n"
            )
    rows_md += (
        f"| **Macro Avg**   "
        f"| **{metrics['macro_precision']:.4f}** "
        f"| **{metrics['macro_recall']:.4f}** "
        f"| **{metrics['macro_f1']:.4f}** "
        f"| {total_samples:>7} |\n"
    )
    rows_md += (
        f"| **Weighted Avg**"
        f"| **{metrics['weighted_precision']:.4f}** "
        f"| **{metrics['weighted_recall']:.4f}** "
        f"| **{metrics['weighted_f1']:.4f}** "
        f"| {total_samples:>7} |\n"
    )

    # Confusion matrix as text table
    cm_text = cm_paper.to_string()

    # SHAP section
    if shap_results:
        top10 = shap_results["top_10_features"]
        shap_table = "| Rank | Feature | Mean |SHAP| |\n|---|---|---:|\n"
        for rank, item in enumerate(top10, 1):
            shap_table += f"| {rank} | `{item['feature']}` | {item['mean_abs_shap']:.5f} |\n"
        shap_note = (
            "Mean |SHAP| values represent the average absolute contribution of each "
            "symptom to the model's output logit across all test samples and all 5 "
            "disease classes.  A high mean |SHAP| indicates that the feature shifts "
            "the model's predictions substantially, on average.  This is a measure of "
            "**model feature importance** — it does NOT imply clinical causality or "
            "diagnostic sufficiency of any individual symptom."
        )
    else:
        shap_table = "_SHAP analysis not available (shap not installed)._"
        shap_note  = ""

    # Latency
    if lat:
        lat_section = (
            f"- **Test samples timed**: {lat['n_samples']}\n"
            f"- **Total inference time** (predict only): {lat['total_ms']:.2f} ms\n"
            f"- **Average per sample**: {lat['per_sample_ms']:.4f} ms\n"
            f"\n> **Note**: Timing reflects model `.predict()` only (numpy matrix-vector "
            f"multiply for Logistic Regression). It excludes preprocessing, "
            f"API/network latency, database access, and SHAP computation."
        )
    else:
        lat_section = "_Latency measurement not available._"

    dataset_note = (
        "**IMPORTANT — Dataset provenance note (mandatory for academic reporting):**\n\n"
        "The fever differential dataset (`fever_dataset.csv`) is **synthetic/curated** — "
        "it was programmatically generated from WHO clinical symptom profiles "
        "(see `fever_model/data/sources.md`).  It consists of 1,500 rows "
        "(300 per class) with binary symptom indicators sampled from "
        "disease-specific probability distributions grounded in WHO fact sheets.\n\n"
        "The test split (20%, 300 samples) was produced by `sklearn.model_selection."
        "train_test_split(test_size=0.20, random_state=42, stratify=y)` inside "
        "`train_model.py`.  **This same split was used during model training to select "
        "the best classifier** (the script compares Logistic Regression, Random Forest, "
        "and XGBoost on this split).  Therefore:\n\n"
        "- The test set is **not an independent held-out set in the strict sense**; it "
        "was seen by the model-selection procedure.\n"
        "- The metrics below reflect **in-distribution performance** on synthetic data.\n"
        "- These results **cannot be extrapolated to real patient populations** without "
        "validation on genuine clinical data.\n\n"
        "These limitations must be stated explicitly in the paper."
    )

    report = f"""# IEEE Evaluation Report — E-Sanjeevani Fever Differential Classifier

Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}

---

## MODEL

| Field | Value |
|---|---|
| Model type | `{mdl['model_type']}` |
| Model artifact | `{mdl['model_path']}` |
| Feature count | {mdl['feature_count']} |
| Class count | {mdl['class_count']} |
| Encoder order | {', '.join(mdl['classes_encoder_order'])} |

### Feature Names (25 binary symptom indicators)

```
{chr(10).join(f"  {i+1:2}. {f}" for i, f in enumerate(mdl['feature_names']))}
```

### Class Labels

| Index | Class (encoder order) | Paper display name |
|---|---|---|
| 0 | Chikungunya | Chikungunya |
| 1 | Dengue | Dengue |
| 2 | Malaria | Malaria |
| 3 | Typhoid | Typhoid |
| 4 | Viral\\_Fever | Viral Fever |

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
| Total test rows | {ds['test_samples']} |
| Split method | Stratified 80/20, random\\_state=42 |
| Genuinely held-out? | **NO** (see note below) |

{dataset_note}

### Class Distribution (Test Set)

| Disease | Samples | % |
|---|---:|---:|
"""
    for cls in PAPER_CLASS_ORDER:
        if cls in dist:
            report += f"| {cls.replace('_', ' '):<18} | {dist[cls]['count']:>7} | {dist[cls]['percent']:.1f}% |\n"
    total_pct = sum(dist[c]['percent'] for c in dist)
    report += f"| **Total** | **{total_samples}** | **100%** |\n"

    is_balanced = all(abs(dist[c]['percent'] - 20.0) < 1.0 for c in dist if c in dist)
    report += f"\n**Balance assessment**: {'BALANCED (all classes ≈ 20%)' if is_balanced else 'IMBALANCED'}\n"

    report += f"""
---

## RESULTS

### Overall

| Metric | Value |
|---|---:|
| Overall Accuracy | {metrics['accuracy']:.4f} |
| Top-1 Accuracy | {metrics['top1_accuracy']:.4f} |
| Top-3 Accuracy | {metrics['top3_accuracy']:.4f} |
| Macro Precision | {metrics['macro_precision']:.4f} |
| Macro Recall | {metrics['macro_recall']:.4f} |
| Macro F1-score | {metrics['macro_f1']:.4f} |
| Weighted Precision | {metrics['weighted_precision']:.4f} |
| Weighted Recall | {metrics['weighted_recall']:.4f} |
| Weighted F1-score | {metrics['weighted_f1']:.4f} |

### Per-Class Results

| Class | Precision | Recall | F1-score | Support |
|---|---:|---:|---:|---:|
{rows_md}

> Top-1 Accuracy: highest-probability predicted class == true class.
> Top-3 Accuracy: true class appears in the 3 highest-probability predictions.

---

## CONFUSION MATRIX

True class = row, Predicted class = column.
Class ordering: Dengue, Malaria, Typhoid, Chikungunya, Viral Fever.

```
{cm_text}
```

See `confusion_matrix.png` for the heatmap visualization.

---

## SHAP ANALYSIS

{shap_table}

{shap_note}

See `shap_summary_bar.png` for the global bar chart.
Per-class plots: `shap_beeswarm_<ClassName>.png` (5 files).

---

## INFERENCE LATENCY

{lat_section}

---

## SANITY CHECKS (ALL PASSED)

- [x] `len(predictions) == len(test_labels)` ({total_samples})
- [x] All predictions belong to the 5 expected class indices (0–4)
- [x] `proba.shape == ({total_samples}, 5)`
- [x] All probability rows sum to 1.0 (±1e-5)
- [x] All probabilities in [0, 1]
- [x] No NaN or Inf in test features
- [x] Feature count matches model (25)
- [x] Column ordering matches `fever_feature_names.pkl`
- [x] Confusion matrix total == test set size ({total_samples})
- [x] Per-class support totals == test set size ({total_samples})
- [x] Top-3 accuracy ≥ Top-1 accuracy ({metrics['top3_accuracy']:.4f} ≥ {metrics['top1_accuracy']:.4f})

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

5. **No scaling**: Binary {0,1} features are passed raw. Logistic Regression is not
   sensitive to scale on binary features, so this is appropriate.

6. **Class balance**: The test set is perfectly balanced (60 samples per class) due to
   stratified splitting of the balanced synthetic dataset. Weighted and macro averages
   are therefore equal for balanced classes.
"""

    path = os.path.join(out_dir, "ieee_evaluation_report.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[OK] Markdown report saved: {path}")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 65)
    print("  IEEE Fever Differential Classifier — Rigorous Evaluation")
    print("  E-Sanjeevani 2.0 | READ-ONLY — no production files modified")
    print("=" * 65)

    # 1. Load
    model, le, feature_names, model_path = load_artifacts()

    # 2. Reconstruct test split
    X_test, y_test, df_full = reconstruct_test_split(le, feature_names)

    # 3. Input sanity
    sanity_check_input(model, X_test, feature_names)

    # 4. Inference
    preds, proba, total_ms, per_ms = run_inference(model, X_test, le)

    # 5. Output sanity
    sanity_check_output(preds, proba, y_test, le)

    # 6. Metrics
    metrics = compute_metrics(preds, proba, y_test, le)

    # 7. Confusion matrix
    cm, cm_df, cm_paper = compute_and_save_confusion_matrix(preds, y_test, le)

    # 8. Class distribution
    dist, total_samples = class_distribution(y_test, le)

    # 9. SHAP
    shap_results = run_shap_analysis(model, X_test, feature_names, le, OUT_DIR)

    # 10. Save outputs
    cm_csv_path = save_confusion_matrix_csv(cm_paper, OUT_DIR)
    cm_png_path = plot_confusion_matrix(cm_paper, OUT_DIR)
    pc_csv_path = save_per_class_csv(metrics, OUT_DIR)

    latency = {
        "n_samples":      len(X_test),
        "total_ms":       round(total_ms, 4),
        "per_sample_ms":  round(per_ms, 6),
    }

    full_results = {
        "model": {
            "model_type":           type(model).__name__,
            "model_repr":           repr(model),
            "model_path":           model_path,
            "feature_count":        len(feature_names),
            "feature_names":        feature_names,
            "class_count":          len(le.classes_),
            "classes_encoder_order": list(le.classes_),
        },
        "dataset": {
            "path":           DATA_PATH,
            "total_rows":     int(df_full.shape[0]),
            "test_samples":   int(total_samples),
            "class_distribution": dist,
            "split":          "train_test_split(test_size=0.20, random_state=42, stratify=y)",
            "genuinely_held_out": False,
            "dataset_type":   "Synthetic/Curated from WHO clinical guidelines",
        },
        "metrics":  metrics,
        "confusion_matrix": {
            "class_order_encoder": list(le.classes_),
            "class_order_paper":   PAPER_CLASS_ORDER,
            "matrix_paper_order":  cm_paper.values.tolist(),
        },
        "shap": shap_results,
        "latency": latency,
        "sanity_checks": "ALL PASSED",
    }

    json_path  = save_json_results(full_results, OUT_DIR)
    md_path    = save_markdown_report(
        full_results, metrics, dist, total_samples,
        cm_paper, shap_results, latency,
        model_path, OUT_DIR
    )

    # ── Final console summary ─────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  FINAL RESULTS SUMMARY")
    print("=" * 65)
    print(f"  Model type      : {type(model).__name__}  ← NOTE: not XGBoost!")
    print(f"  Test samples    : {total_samples}  (20% stratified split)")
    print(f"  Held-out        : NO (split used for model selection)")
    print()
    print(f"  Overall Accuracy: {metrics['accuracy']:.4f}")
    print(f"  Top-1 Accuracy  : {metrics['top1_accuracy']:.4f}")
    print(f"  Top-3 Accuracy  : {metrics['top3_accuracy']:.4f}")
    print(f"  Macro F1        : {metrics['macro_f1']:.4f}")
    print()
    print(f"  {'Class':<18}  {'Precision':>9}  {'Recall':>6}  {'F1':>6}  {'Support':>7}")
    print(f"  {'-'*57}")
    for cls in PAPER_CLASS_ORDER:
        if cls in metrics["per_class"]:
            m = metrics["per_class"][cls]
            print(f"  {cls.replace('_',' '):<18}  {m['precision']:>9.4f}  {m['recall']:>6.4f}  {m['f1']:>6.4f}  {m['support']:>7}")
    print(f"  {'-'*57}")
    print(f"  {'Macro Avg':<18}  {metrics['macro_precision']:>9.4f}  {metrics['macro_recall']:>6.4f}  {metrics['macro_f1']:>6.4f}  {total_samples:>7}")
    print(f"  {'Weighted Avg':<18}  {metrics['weighted_precision']:>9.4f}  {metrics['weighted_recall']:>6.4f}  {metrics['weighted_f1']:>6.4f}  {total_samples:>7}")
    print()
    print(f"  Inference: {total_ms:.2f} ms total  /  {per_ms:.4f} ms per sample")
    print()
    print("  FILES CREATED:")
    for p in [json_path, pc_csv_path, cm_csv_path, cm_png_path, md_path]:
        print(f"    {p}")
    if shap_results:
        print(f"    {shap_results['shap_bar_chart']}")
        for p in shap_results.get("shap_class_plots", []):
            print(f"    {p}")
    print()
    print("[DONE] Evaluation complete.")


if __name__ == "__main__":
    main()
