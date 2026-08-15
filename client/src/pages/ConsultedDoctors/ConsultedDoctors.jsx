import React, { useState, useEffect } from "react";
import { ConsultedDoctorsSkeleton } from "../../components/Skeletons";

import {
  Search,
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  Stethoscope,
  ChevronRight,
  Pill,
  Award,
  MapPin,
  RefreshCw,
  X,
  Phone,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { consultationApi } from "../../utils/api";
import styles from "./ConsultedDoctors.module.css";

export default function ConsultedDoctors() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await consultationApi.getMyConsultations();
      const allConsultations = response.data.consultations || [];
      
      // Filter for past / completed consultations
      const pastConsultations = allConsultations.filter(
        (c) => c.status === "completed" || new Date(c.consultationDate) <= new Date()
      );
      setConsultations(pastConsultations);
    } catch (error) {
      console.error("Failed to fetch consulted doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique specialties for filter dropdown
  const specialties = [
    "all",
    ...new Set(
      consultations
        .map((c) => c.doctor?.specialization || c.doctorProfile?.specialization)
        .filter(Boolean)
    ),
  ];

  // Filter consultations by search & specialty
  const filteredConsultations = consultations.filter((c) => {
    const doctorName = c.doctor?.name || c.doctorProfile?.name || "";
    const spec = c.doctor?.specialization || c.doctorProfile?.specialization || "";
    const symptoms = c.symptoms || "";
    
    const matchesSearch =
      doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symptoms.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "all" || spec.toLowerCase() === selectedSpecialty.toLowerCase();

    return matchesSearch && matchesSpecialty;
  });

  const handleBookFollowUp = (doctor) => {
    navigate("/consultation-booking", {
      state: { doctor },
    });
  };

  if (loading) {
    return <ConsultedDoctorsSkeleton />;
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Consulted Doctors</h1>
              <p className={styles.pageSubtitle}>
                Review past consultations, prescriptions, diagnosis summaries, and book follow-up appointments.
              </p>
            </div>
            <button className={styles.refreshBtn} onClick={fetchConsultations}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className={styles.filterCard}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Specialty:</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className={styles.filterSelect}
              >
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec === "all" ? "All Specialties" : spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consultation List */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading consulted doctors history...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconCircle}>
                <Stethoscope size={32} />
              </div>
              <h3>No Consulted Doctors Found</h3>
              <p>
                {searchQuery || selectedSpecialty !== "all"
                  ? "No consultations matched your search criteria."
                  : "You haven't completed any consultations yet."}
              </p>
              <button
                className={styles.browseDoctorsBtn}
                onClick={() => navigate("/consultations")}
              >
                Find & Book a Doctor
              </button>
            </div>
          ) : (
            <div className={styles.doctorGrid}>
              {filteredConsultations.map((c) => {
                const doctorName = c.doctor?.name || "Dr. Specialist";
                const spec = c.doctor?.specialization || "General Practitioner";
                const hospital = c.doctor?.hospitalName || "Partner Clinic";
                const dateStr = new Date(c.consultationDate).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" }
                );

                return (
                  <div key={c._id || c.id} className={styles.doctorCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarCircle}>
                        {doctorName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.doctorInfo}>
                        <h3 className={styles.doctorName}>Dr. {doctorName}</h3>
                        <div className={styles.badgeRow}>
                          <span className={styles.specBadge}>
                            <Stethoscope size={13} /> {spec}
                          </span>
                          <span className={styles.statusCompleted}>
                            <CheckCircle size={13} /> Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.infoMetaRow}>
                        <span className={styles.metaItem}>
                          <Calendar size={14} /> {dateStr}
                        </span>
                        <span className={styles.metaItem}>
                          <Clock size={14} /> {c.startTime} - {c.endTime}
                        </span>
                        <span className={styles.typeBadge}>
                          {c.consultationType === "video" ? (
                            <Video size={13} />
                          ) : (
                            <Phone size={13} />
                          )}
                          {c.consultationType || "Video Call"}
                        </span>
                      </div>

                      <div className={styles.detailsBox}>
                        <div className={styles.detailBlock}>
                          <span className={styles.detailTitle}>Reported Symptoms</span>
                          <p className={styles.detailText}>{c.symptoms || "General checkup and consultation."}</p>
                        </div>

                        {c.currentProblem && (
                          <div className={styles.detailBlock}>
                            <span className={styles.detailTitle}>Clinical Context</span>
                            <p className={styles.detailText}>{c.currentProblem}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewDetailsBtn}
                        onClick={() => setSelectedConsultation(c)}
                      >
                        <FileText size={15} /> View Prescription
                      </button>
                      <button
                        className={styles.bookAgainBtn}
                        onClick={() => handleBookFollowUp(c.doctor)}
                      >
                        Book Follow-up <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Prescription / Details Modal */}
      {selectedConsultation && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedConsultation(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBox}>
                <Award className={styles.modalHeaderIcon} size={24} />
                <div>
                  <h2>Consultation Details & Summary</h2>
                  <p>
                    Dr. {selectedConsultation.doctor?.name || "Specialist"} •{" "}
                    {new Date(selectedConsultation.consultationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedConsultation(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <h4>Symptoms</h4>
                  <p>{selectedConsultation.symptoms || "N/A"}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h4>Current Problem</h4>
                  <p>{selectedConsultation.currentProblem || "N/A"}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h4>Medication & History</h4>
                  <p>{selectedConsultation.currentMedication || "None recorded"}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h4>Allergies</h4>
                  <p>{selectedConsultation.allergies || "No known allergies"}</p>
                </div>
              </div>

              <div className={styles.prescriptionNotice}>
                <Pill size={20} className={styles.rxIcon} />
                <div>
                  <h5>Digital Prescription & Clinical Advice</h5>
                  <p>
                    Follow the prescribed treatment schedule. For urgent side effects or worsening conditions, re-consult your physician immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedConsultation(null)}
              >
                Close
              </button>
              <button
                className={styles.modalBookBtn}
                onClick={() => {
                  const doc = selectedConsultation.doctor;
                  setSelectedConsultation(null);
                  handleBookFollowUp(doc);
                }}
              >
                Re-book with Dr. {selectedConsultation.doctor?.name || "Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
