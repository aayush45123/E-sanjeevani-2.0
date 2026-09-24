import React from "react";
import {
  X,
  Download,
  Calendar,
  Building,
  User,
  Stethoscope,
  Pill,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import styles from "./PrescriptionDetailsModal.module.css";

export default function PrescriptionDetailsModal({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null;

  const dateStr = record.recordDate || record.createdAt
    ? new Date(record.recordDate || record.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const medicines = record.prescriptionItems || record.items || [];
  const doctorName = record.doctorName
    ? `Dr. ${record.doctorName.replace(/^Dr\.\s*/i, "")}`
    : "Authorized Medical Officer";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Digital Prescription Details</h3>
              <p className={styles.modalSubtitle}>eSanjeevani Verified Telemedicine Consultation</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Metadata Grid */}
          <div className={styles.infoGrid}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Prescribing Doctor</span>
              <span className={styles.infoValue}>
                <Stethoscope size={16} /> {doctorName}
              </span>
              <span className={styles.infoSub}>{record.hospitalName || "E-Sanjeevani Teleconsultation"}</span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Patient & Date</span>
              <span className={styles.infoValue}>
                <User size={16} /> {record.patientName || "Patient"}
              </span>
              <span className={styles.infoSub}>
                <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {dateStr}
              </span>
            </div>
          </div>

          {/* Diagnosis */}
          {record.diagnosis && (
            <div className={styles.diagnosisCard}>
              <span className={styles.diagnosisTag}>Clinical Diagnosis</span>
              <h4 className={styles.diagnosisHeading}>{record.diagnosis}</h4>
            </div>
          )}

          {/* Medicines Table */}
          <div className={styles.medSection}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <Pill size={18} /> Rx — Prescribed Medicines ({medicines.length})
              </h4>
            </div>

            {medicines.length > 0 ? (
              <div className={styles.medTableWrapper}>
                <table className={styles.medTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((med, idx) => (
                      <tr key={med.id || idx}>
                        <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <div className={styles.medNameCell}>{med.medicineName}</div>
                          {med.instructions && (
                            <div className={styles.medInstructionSub}>Notes: {med.instructions}</div>
                          )}
                        </td>
                        <td><strong>{med.dosage || "As directed"}</strong></td>
                        <td>{med.frequency || "—"}</td>
                        <td>{med.duration || "—"}</td>
                        <td>
                          <span className={styles.routeBadge}>{med.route || "Oral"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.detailCard}>
                <p style={{ margin: 0, color: "#64748b", fontStyle: "italic", fontSize: "0.9rem" }}>
                  {record.prescription || "No structured medicines recorded for this consultation."}
                </p>
              </div>
            )}
          </div>

          {/* Additional Clinical Details */}
          <div className={styles.detailGrid}>
            {record.advice && (
              <div className={styles.detailCard}>
                <span className={styles.detailCardLabel}>Advice & Patient Recommendations</span>
                <p className={styles.detailCardText}>{record.advice}</p>
              </div>
            )}

            {record.recommendedTests && (
              <div className={styles.detailCard}>
                <span className={styles.detailCardLabel}>Recommended Lab Tests & Investigations</span>
                <p className={styles.detailCardText}>{record.recommendedTests}</p>
              </div>
            )}

            {record.referralInfo && (
              <div className={styles.detailCard}>
                <span className={styles.detailCardLabel}>Specialist Referral Information</span>
                <p className={styles.detailCardText}>{record.referralInfo}</p>
              </div>
            )}

            {record.followUpInstructions && (
              <div className={styles.detailCard}>
                <span className={styles.detailCardLabel}>Follow-up Instructions</span>
                <p className={styles.detailCardText}>{record.followUpInstructions}</p>
              </div>
            )}

            {record.followUpRequired && record.followUpDays && (
              <div className={styles.detailCard} style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                <span className={styles.detailCardLabel} style={{ color: "#166534" }}>Follow-up Schedule</span>
                <p className={styles.detailCardText} style={{ color: "#14532d", fontWeight: 600 }}>
                  Recommended follow-up appointment in {record.followUpDays} days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {record.prescriptionPdfUrl ? (
            <a
              href={record.prescriptionPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadPdfBtn}
            >
              <Download size={16} /> Download Signed PDF
            </a>
          ) : (
            <div style={{ fontSize: "0.82rem", color: "#64748b", fontStyle: "italic" }}>
              Digital record archived in verified electronic health record
            </div>
          )}

          <button className={styles.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
