import React, { useState, useEffect } from "react";
import { prescriptionApi } from "../../utils/api";
import toast from "react-hot-toast";
import {
  X,
  FilePen,
  Plus,
  Trash2,
  AlertCircle,
  PillIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import styles from "./AmendPrescriptionModal.module.css";

const EMPTY_ITEM = {
  medicineName: "",
  dosage: "",
  route: "oral",
  frequency: "",
  duration: "",
  instructions: "",
};

const ROUTES = ["oral", "topical", "intravenous", "intramuscular", "subcutaneous", "sublingual", "inhaled", "rectal", "nasal", "ophthalmic", "otic"];
const FREQUENCIES = ["Once daily", "Twice daily", "Thrice daily", "Four times daily", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed (SOS)", "At bedtime", "Before food", "After food", "With food"];

/**
 * AmendPrescriptionModal
 * Allows a doctor to amend (correct) a finalized prescription.
 * Creates a new prescription record linked to the original via amendedFromId.
 * Original is marked status: "amended" (superseded).
 */
export default function AmendPrescriptionModal({ isOpen, onClose, prescription, onSuccess }) {
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [recommendedTests, setRecommendedTests] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItems, setExpandedItems] = useState([0]);

  // Pre-populate from the original prescription when modal opens
  useEffect(() => {
    if (isOpen && prescription) {
      setDiagnosis(prescription.diagnosis || "");
      setAdvice(prescription.advice || "");
      setRecommendedTests(prescription.recommendedTests || "");
      setDoctorNotes(prescription.doctorNotes || "");
      const sourceItems = prescription.prescriptionItems || prescription.items || [];
      if (sourceItems.length > 0) {
        setItems(
          sourceItems.map((item) => ({
            medicineName: item.medicineName || "",
            dosage: item.dosage || "",
            route: item.route || "oral",
            frequency: item.frequency || "",
            duration: item.duration || "",
            instructions: item.instructions || "",
          }))
        );
        setExpandedItems(sourceItems.map((_, idx) => idx));
      } else {
        setItems([{ ...EMPTY_ITEM }]);
        setExpandedItems([0]);
      }
    }
  }, [isOpen, prescription]);

  if (!isOpen || !prescription) return null;

  const addItem = () => {
    const newIdx = items.length;
    setItems([...items, { ...EMPTY_ITEM }]);
    setExpandedItems([...expandedItems, newIdx]);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
    setExpandedItems(expandedItems.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const toggleItemExpanded = (idx) => {
    setExpandedItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!diagnosis.trim()) {
      toast.error("Diagnosis is required.");
      return;
    }
    const invalidItems = items.some((item) => !item.medicineName.trim() || !item.frequency.trim() || !item.duration.trim());
    if (invalidItems) {
      toast.error("All medicines must have a name, frequency, and duration.");
      return;
    }

    setIsSubmitting(true);
    try {
      await prescriptionApi.amendPrescription(prescription.id, {
        diagnosis: diagnosis.trim(),
        advice: advice.trim() || null,
        recommendedTests: recommendedTests.trim() || null,
        doctorNotes: doctorNotes.trim() || null,
        items: items.map((item) => ({
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          route: item.route,
          frequency: item.frequency,
          duration: item.duration.trim(),
          instructions: item.instructions.trim() || null,
        })),
      });

      toast.success("Prescription amended successfully! Original has been superseded.");
      onSuccess?.();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to amend prescription.";
      toast.error(msg);
      console.error("Amendment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const originalDate = prescription.recordDate || prescription.createdAt
    ? new Date(prescription.recordDate || prescription.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="amend-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconCircle}>
              <FilePen size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h2 id="amend-title" className={styles.headerTitle}>
                Amend Prescription
              </h2>
              <p className={styles.headerSubtitle}>
                Creating a correction to the prescription issued on{" "}
                <strong>{originalDate}</strong>
                {prescription.patientName && ` for ${prescription.patientName}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Immutability Notice */}
        <div className={styles.immutabilityNotice}>
          <AlertCircle size={16} className={styles.noticeIcon} />
          <p>
            The original prescription will be <strong>marked as "Superseded"</strong> and cannot be further
            edited. A new prescription will be created with a reference to the original.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {/* Diagnosis */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Clinical Details</h3>

            <div className={styles.field}>
              <label className={styles.label}>
                Diagnosis <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g., Viral Fever, Type 2 Diabetes Mellitus"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Advice &amp; Recommendations</label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Lifestyle advice, dietary restrictions, activity limitations..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Recommended Tests / Investigations</label>
                <textarea
                  value={recommendedTests}
                  onChange={(e) => setRecommendedTests(e.target.value)}
                  placeholder="CBC, LFT, Blood Culture..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Doctor&apos;s Notes (Internal)</label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Clinical reasoning, amendment rationale..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Medicine Items */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitleRow}>
              <h3 className={styles.sectionTitle}>
                <PillIcon size={16} className={styles.sectionIcon} />
                Prescribed Medicines
              </h3>
              <button type="button" onClick={addItem} className={styles.addMedBtn}>
                <Plus size={15} /> Add Medicine
              </button>
            </div>

            <div className={styles.itemsList}>
              {items.map((item, idx) => {
                const isExpanded = expandedItems.includes(idx);
                return (
                  <div key={idx} className={styles.itemCard}>
                    {/* Item Header (collapsible) */}
                    <div
                      className={styles.itemCardHeader}
                      onClick={() => toggleItemExpanded(idx)}
                    >
                      <div className={styles.itemCardHeaderLeft}>
                        <span className={styles.itemBadge}>#{idx + 1}</span>
                        <span className={styles.itemMedName}>
                          {item.medicineName || <span className={styles.placeholder}>Medicine #{idx + 1}</span>}
                        </span>
                        {item.dosage && (
                          <span className={styles.itemDosagePill}>{item.dosage}</span>
                        )}
                      </div>
                      <div className={styles.itemCardActions}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(idx);
                            }}
                            className={styles.removeItemBtn}
                            title="Remove medicine"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={16} className={styles.toggleChevron} />
                        ) : (
                          <ChevronDown size={16} className={styles.toggleChevron} />
                        )}
                      </div>
                    </div>

                    {/* Item Fields */}
                    {isExpanded && (
                      <div className={styles.itemFields}>
                        <div className={styles.itemFieldRow}>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Medicine Name <span className={styles.required}>*</span>
                            </label>
                            <input
                              type="text"
                              value={item.medicineName}
                              onChange={(e) => updateItem(idx, "medicineName", e.target.value)}
                              placeholder="e.g., Paracetamol, Azithromycin"
                              className={styles.input}
                              required
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>Dosage / Strength</label>
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                              placeholder="e.g., 500mg, 10mg/5ml"
                              className={styles.input}
                            />
                          </div>
                        </div>

                        <div className={styles.itemFieldRow}>
                          <div className={styles.field}>
                            <label className={styles.label}>Route of Administration</label>
                            <select
                              value={item.route}
                              onChange={(e) => updateItem(idx, "route", e.target.value)}
                              className={styles.select}
                            >
                              {ROUTES.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Frequency <span className={styles.required}>*</span>
                            </label>
                            <select
                              value={item.frequency}
                              onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                              className={styles.select}
                              required
                            >
                              <option value="">— Select frequency —</option>
                              {FREQUENCIES.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Duration <span className={styles.required}>*</span>
                            </label>
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(e) => updateItem(idx, "duration", e.target.value)}
                              placeholder="e.g., 5 days, 2 weeks"
                              className={styles.input}
                              required
                            />
                          </div>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Special Instructions</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                            placeholder="e.g., Take after meals, Avoid sunlight"
                            className={styles.input}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <FileEdit size={16} className={styles.spinnerIcon} />
                  Amending Prescription...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Submit Amendment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
