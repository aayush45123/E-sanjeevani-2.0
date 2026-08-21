import React, { useState } from "react";
import { X, UploadCloud, FileText, Calendar, Building, User, Plus, Trash2 } from "lucide-react";
import { medicalRecordApi } from "../../utils/api";
import styles from "./AddPreviousRecordModal.module.css";
import toast from "react-hot-toast";

export default function AddPreviousRecordModal({ isOpen, onClose, onSuccess }) {
  const [recordTitle, setRecordTitle] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordTitle.trim()) {
      setErrorMsg("Please enter a record title.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const formData = new FormData();
      formData.append("recordTitle", recordTitle);
      formData.append("recordDate", recordDate);
      formData.append("doctorName", doctorName);
      formData.append("hospitalName", hospitalName);
      formData.append("diagnosis", diagnosis);
      formData.append("prescription", prescription);
      formData.append("doctorNotes", doctorNotes);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await medicalRecordApi.uploadPatientRecord(formData);
      
      setSubmitting(false);
      toast.success("Medical record uploaded successfully!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to upload medical record:", err);
      const msg = err.response?.data?.message || "Failed to save medical record";
      setErrorMsg(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleBox}>
            <FileText size={20} className={styles.headerIcon} />
            <h2>Add Previous Medical Record</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formBody}>
          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Record Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Diabetes Treatment, Routine Blood Report"
              value={recordTitle}
              onChange={(e) => setRecordTitle(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Record Date</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Doctor / Specialist Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Sharma"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Hospital / Clinic Name</label>
            <input
              type="text"
              placeholder="e.g. Apollo Hospital, City Health Center"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Diagnosis</label>
            <input
              type="text"
              placeholder="e.g. Type 2 Diabetes, Hypertension"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Prescription / Notes</label>
            <textarea
              placeholder="Enter prescribed medicines or clinical observations..."
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              rows={3}
              className={styles.textarea}
            ></textarea>
          </div>

          {/* File Dropzone */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Upload Documents (PDF, Images, Lab Reports)</label>
            <div className={styles.dropzone}>
              <UploadCloud size={28} className={styles.uploadIcon} />
              <p className={styles.dropzoneText}>
                Click to browse or drag and drop files here
              </p>
              <span className={styles.dropzoneSub}>PDF, PNG, JPG up to 10MB per file</span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className={styles.fileList}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? "Saving Record..." : "Save Medical Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
