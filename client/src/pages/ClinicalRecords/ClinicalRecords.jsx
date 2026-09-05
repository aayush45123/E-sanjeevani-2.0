import React, { useState, useEffect } from "react";
import { ClinicalRecordsSkeleton } from "../../components/Skeletons";
import {
  FileText,
  Plus,
  Search,
  Download,
  Calendar,
  Building,
  User,
  ExternalLink,
  ShieldCheck,
  Paperclip,
  Clock,
  Filter,
  FilePen,
  GitBranch,
  Ban,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import AddPreviousRecordModal from "../../components/MedicalRecords/AddPreviousRecordModal";
import AmendPrescriptionModal from "./AmendPrescriptionModal";
import { medicalRecordApi, authApi } from "../../utils/api";
import { performLogout } from "../../utils/auth";
import styles from "./ClinicalRecords.module.css";

export default function ClinicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'consultation', 'patient_upload'
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amendTarget, setAmendTarget] = useState(null); // prescription object to amend
  const [user, setUser] = useState(null);
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => performLogout();

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [uRes, recRes] = await Promise.all([
          userRole === "doctor" ? authApi.me().catch(() => null) : Promise.resolve(null),
          medicalRecordApi.getMyRecords().catch((err) => {
            console.error("Failed to fetch medical records:", err);
            return { data: { records: [] } };
          }),
        ]);

        if (uRes?.data) {
          setUser(uRes.data.user || uRes.data);
        }
        setRecords(recRes?.data?.records || []);
      } catch (err) {
        console.error("Failed to load clinical records:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [userRole]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await medicalRecordApi.getMyRecords();
      setRecords(res.data.records || []);
    } catch (err) {
      console.error("Failed to fetch medical records:", err);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = userRole === "doctor";

  const filteredRecords = records.filter((rec) => {
    // Tab filter for patient
    if (!isDoctor) {
      if (activeTab === "consultation" && rec.source !== "consultation") return false;
      if (activeTab === "patient_upload" && rec.source !== "patient_upload") return false;
    }

    // Search query
    const q = searchQuery.toLowerCase();
    const title = rec.recordTitle || "";
    const diag = rec.diagnosis || "";
    const doc = rec.doctorName || "";
    const patient = rec.patientName || "";
    const hosp = rec.hospitalName || "";

    return (
      title.toLowerCase().includes(q) ||
      diag.toLowerCase().includes(q) ||
      doc.toLowerCase().includes(q) ||
      patient.toLowerCase().includes(q) ||
      hosp.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <ClinicalRecordsSkeleton />;
  }

  return (
    <div className={styles.dashboardLayout}>
      {isDoctor ? (
        <DoctorSidebar user={user} onLogout={handleLogout} />
      ) : (
        <Sidebar />
      )}

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>
                {isDoctor
                  ? "Issued Prescriptions & Consultations"
                  : "Medical & Health Records"}
              </h1>
              <p className={styles.pageSubtitle}>
                {isDoctor
                  ? "Manage and review all digital prescriptions and clinical summaries you have prescribed to your patients."
                  : "Access all your past medical history, hospital prescriptions, and eSanjeevani digital prescriptions."}
              </p>
            </div>

            {!isDoctor && (
              <button
                className={styles.addRecordBtn}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} /> Add Previous Medical Record
              </button>
            )}
          </div>

          {/* Filter Bar & Search */}
          <div className={styles.filterToolbar}>
            {!isDoctor ? (
              <div className={styles.tabGroup}>
                <button
                  className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Records ({records.length})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === "consultation" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("consultation")}
                >
                  eSanjeevani Prescriptions (
                  {records.filter((r) => r.source === "consultation").length})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === "patient_upload" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("patient_upload")}
                >
                  My Uploads ({records.filter((r) => r.source === "patient_upload").length})
                </button>
              </div>
            ) : (
              <div className={styles.tabGroup}>
                <button className={`${styles.tabBtn} ${styles.tabActive}`}>
                  All Prescriptions Issued ({records.length})
                </button>
              </div>
            )}

            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={
                  isDoctor
                    ? "Search by patient name, diagnosis, medication..."
                    : "Search by title, diagnosis, doctor..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Records Grid / List */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconCircle}>
                <FileText size={36} />
              </div>
              <h3>
                {isDoctor
                  ? "No Prescriptions Issued Yet"
                  : "No Medical Records Found"}
              </h3>
              <p>
                {searchQuery || activeTab !== "all"
                  ? "No records match your selected search criteria."
                  : isDoctor
                  ? "When you conduct telemedicine consultations and generate digital prescriptions, they will be archived here."
                  : "Upload your historical medical records or complete an eSanjeevani consultation to view digital prescriptions."}
              </p>
              {!isDoctor && (
                <button
                  className={styles.emptyAddBtn}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={15} /> Upload First Medical Record
                </button>
              )}
            </div>
          ) : (
            <div className={styles.recordsList}>
              {filteredRecords.map((rec) => {
                const dateStr = rec.recordDate
                  ? new Date(rec.recordDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                const isConsultation = rec.source === "consultation";

                return (
                  <div key={rec.id} className={styles.recordCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitleBox}>
                        <FileText size={20} className={styles.cardTitleIcon} />
                        <div>
                          <h3 className={styles.recordTitle}>
                            {rec.recordTitle || (isConsultation ? "Digital Prescription" : "Medical Record")}
                          </h3>
                          <span className={styles.recordDate}>
                            <Calendar size={13} /> {dateStr}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`${styles.sourceBadge} ${
                          isConsultation ? styles.badgeConsultation : styles.badgeUpload
                        }`}
                      >
                        {isConsultation ? (
                          <>
                            <ShieldCheck size={13} /> {isDoctor ? "Prescription Issued" : "eSanjeevani Digital"}
                          </>
                        ) : (
                          "Patient Uploaded"
                        )}
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.metaRow}>
                        {isDoctor ? (
                          <div className={styles.metaItem}>
                            <User size={14} className={styles.metaIcon} />
                            <span>
                              <strong>Patient:</strong> {rec.patientName || "Patient"}
                            </span>
                          </div>
                        ) : (
                          rec.doctorName && (
                            <div className={styles.metaItem}>
                              <User size={14} className={styles.metaIcon} />
                              <span>Dr. {rec.doctorName.replace(/^Dr\.\s*/i, "")}</span>
                            </div>
                          )
                        )}
                        {rec.hospitalName && (
                          <div className={styles.metaItem}>
                            <Building size={14} className={styles.metaIcon} />
                            <span>{rec.hospitalName}</span>
                          </div>
                        )}
                      </div>

                      {rec.diagnosis && (
                        <div className={styles.diagnosisBox}>
                          <span className={styles.diagnosisLabel}>DIAGNOSIS</span>
                          <p className={styles.diagnosisText}>{rec.diagnosis}</p>
                        </div>
                      )}

                      {/* Structured Medicines Table if present */}
                      {rec.prescriptionItems && rec.prescriptionItems.length > 0 && (
                        <div className={styles.medsBox}>
                          <h4 className={styles.medsTitle}>Rx — Prescribed Medicines</h4>
                          <div className={styles.medsGrid}>
                            {rec.prescriptionItems.map((med, idx) => (
                              <div key={med.id || idx} className={styles.medItem}>
                                <div className={styles.medName}>
                                  {idx + 1}. {med.medicineName} <span className={styles.medDosage}>{med.dosage}</span>
                                </div>
                                <div className={styles.medMeta}>
                                  <span>{med.frequency}</span> • <span>{med.duration}</span>
                                  {med.instructions && <span className={styles.medInstruction}> ({med.instructions})</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* General Prescription text if no structured items */}
                      {(!rec.prescriptionItems || rec.prescriptionItems.length === 0) && rec.prescription && (
                        <div className={styles.prescriptionTextBlock}>
                          <h4 className={styles.medsTitle}>Prescription / Notes</h4>
                          <p className={styles.prescriptionText}>{rec.prescription}</p>
                        </div>
                      )}

                      {rec.advice && (
                        <div className={styles.adviceBlock}>
                          <span className={styles.subLabel}>ADVICE & RECOMMENDATIONS:</span>
                          <p className={styles.subText}>{rec.advice}</p>
                        </div>
                      )}

                      {rec.recommendedTests && (
                        <div className={styles.adviceBlock}>
                          <span className={styles.subLabel}>RECOMMENDED TESTS:</span>
                          <p className={styles.subText}>{rec.recommendedTests}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {rec.attachments && rec.attachments.length > 0 && (
                        <div className={styles.attachmentsRow}>
                          <span className={styles.attachLabel}>
                            <Paperclip size={13} /> Uploaded Documents:
                          </span>
                          <div className={styles.attachPills}>
                            {rec.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.attachPill}
                              >
                                {att.fileName || "View Document"} <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PDF Download + Amend Footer */}
                    <div className={styles.cardFooter}>
                      {/* Amendment chain link — shown when this record was amended FROM another */}
                      {rec.amendedFromId && (
                        <div className={styles.amendChainBadge}>
                          <GitBranch size={13} />
                          <span>Amendment — corrects prescription issued on {rec.originalDate || "a prior date"}</span>
                        </div>
                      )}

                      {/* Superseded badge — shown when this record has been superseded by an amendment */}
                      {rec.status === "amended" && (
                        <div className={styles.supersededBadge}>
                          <Ban size={13} />
                          <span>Superseded — a corrected prescription has replaced this record</span>
                        </div>
                      )}

                      <div className={styles.cardFooterActions}>
                        {rec.prescriptionPdfUrl && (
                          <a
                            href={rec.prescriptionPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfDownloadBtn}
                          >
                            <Download size={15} /> Download PDF
                          </a>
                        )}

                        {/* Amend button — Doctor only, for finalized prescriptions that haven't been superseded */}
                        {isDoctor && rec.source === "consultation" && rec.status !== "amended" && (
                          <button
                            className={styles.amendBtn}
                            onClick={() => setAmendTarget(rec)}
                            title="Create a correction for this finalized prescription"
                          >
                            <FilePen size={14} /> Amend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AddPreviousRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRecords}
      />

      <AmendPrescriptionModal
        isOpen={!!amendTarget}
        prescription={amendTarget}
        onClose={() => setAmendTarget(null)}
        onSuccess={() => {
          setAmendTarget(null);
          fetchRecords();
        }}
      />
    </div>
  );
}
