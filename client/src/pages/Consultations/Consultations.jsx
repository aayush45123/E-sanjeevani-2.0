import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiClock,
  FiStar,
  FiPhone,
  FiVideo,
  FiFileText,
  FiCheckCircle,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./Consultations.module.css";
import { useNavigate } from "react-router-dom";
import { consultationApi } from "../../utils/api";

export default function Consultations() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const navigate = useNavigate();

  /*
  ==================================================
  FETCH PATIENT CONSULTATIONS
  ==================================================
  */

  useEffect(() => {
    if (activeTab === "history" || activeTab === "upcoming") {
      fetchConsultations();
    }
  }, [activeTab]);

  /*
  ==================================================
  FETCH DOCTORS
  ==================================================
  */

  useEffect(() => {
    if (activeTab === "doctors") {
      fetchDoctors();
    }
  }, [activeTab, specialization, searchQuery]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);

      const response = await consultationApi.getMyConsultations();

      setConsultations(response.data.consultations || []);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const response = await consultationApi.getAvailableDoctors({
        specialization: specialization || undefined,
      });

      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
  ==================================================
  NAVIGATE TO FULL CONSULTATION FORM
  ==================================================
  */

  const handleBookConsultation = (doctor) => {
    navigate("/consultation-booking", {
      state: {
        doctor,
      },
    });
  };

  /*
  ==================================================
  STATUS COLORS
  ==================================================
  */

  const getStatusClass = (status) => {
    switch (status) {
      case "scheduled":
        return styles.scheduled;
      case "ongoing":
        return styles.ongoing;
      case "completed":
        return styles.completed;
      case "cancelled":
        return styles.cancelled;
      default:
        return styles.defaultStatus;
    }
  };

  /*
  ==================================================
  SEPARATE CONSULTATIONS INTO UPCOMING & HISTORY
  ==================================================
  */

  const separateConsultations = () => {
    const now = new Date();

    const upcoming = consultations
      .filter((consultation) => {
        const consultationDate = new Date(consultation.consultationDate);
        // Upcoming: scheduled status OR future date
        return consultation.status === "scheduled" || consultationDate > now;
      })
      .sort((a, b) => {
        return new Date(a.consultationDate) - new Date(b.consultationDate);
      });

    const history = consultations
      .filter((consultation) => {
        const consultationDate = new Date(consultation.consultationDate);
        // History: completed status OR past date
        return (
          consultation.status === "completed" ||
          (consultationDate <= now && consultation.status !== "scheduled")
        );
      })
      .sort((a, b) => {
        return new Date(b.consultationDate) - new Date(a.consultationDate);
      });

    return { upcoming, history };
  };

  const { upcoming, history } = separateConsultations();

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* ================= HEADER ================= */}

          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Consultations</h1>
            <p className={styles.pageSubtitle}>
              Manage your consultations and connect with doctors.
            </p>
          </div>

          {/* ================= TABS ================= */}

          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "upcoming" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Consultations
            </button>

            <button
              className={`${styles.tabButton} ${
                activeTab === "history" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              Consultation History
            </button>

            <button
              className={`${styles.tabButton} ${
                activeTab === "doctors" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("doctors")}
            >
              Available Doctors
            </button>
          </div>

          {/* ================= UPCOMING CONSULTATIONS TAB ================= */}

          {activeTab === "upcoming" && (
            <div className={styles.historySection}>
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                </div>
              ) : upcoming.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiFileText size={24} />
                  <p>No upcoming consultations</p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    Book a consultation with an available doctor
                  </p>
                </div>
              ) : (
                <div className={styles.consultationList}>
                  {upcoming.map((consultation) => (
                    <div
                      key={consultation._id}
                      className={styles.consultationCard}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.doctorProfile}>
                          <div className={styles.avatar}>
                            {consultation.doctor?.name?.charAt(0) || "D"}
                          </div>
                          <div className={styles.doctorInfoText}>
                            <h3 className={styles.doctorName}>
                              Dr. {consultation.doctor?.name || "Unknown"}
                            </h3>
                            <p className={styles.specialization}>
                              {consultation.doctor?.specialization ||
                                "Specialist"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            consultation.status,
                          )}`}
                        >
                          {consultation.status}
                        </span>
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Symptoms</span>
                          <span className={styles.detailValue}>
                            {consultation.symptoms || "Not provided"}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>
                            Current Problem
                          </span>
                          <span className={styles.detailValue}>
                            {consultation.currentProblem || "Not provided"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.metaInfo}>
                          <div className={styles.metaItem}>
                            <FiCalendar />
                            <span>
                              {new Date(
                                consultation.consultationDate,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className={styles.metaItem}>
                            <FiClock />
                            <span>
                              {consultation.startTime} - {consultation.endTime}
                            </span>
                          </div>
                          <div className={styles.metaItemBadge}>
                            {consultation.consultationType?.toUpperCase()}
                          </div>
                        </div>

                        <button
                          className={styles.joinBtn}
                          onClick={() =>
                            navigate(`/video-call/${consultation._id}`)
                          }
                        >
                          Join Call <FiArrowRight />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= HISTORY TAB ================= */}

          {activeTab === "history" && (
            <div className={styles.historySection}>
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                </div>
              ) : history.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiFileText size={24} />
                  <p>No consultation history</p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    Your completed consultations will appear here
                  </p>
                </div>
              ) : (
                <div className={styles.consultationList}>
                  {history.map((consultation) => (
                    <div
                      key={consultation._id}
                      className={styles.consultationCard}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.doctorProfile}>
                          <div className={styles.avatar}>
                            {consultation.doctor?.name?.charAt(0) || "D"}
                          </div>
                          <div className={styles.doctorInfoText}>
                            <h3 className={styles.doctorName}>
                              Dr. {consultation.doctor?.name || "Unknown"}
                            </h3>
                            <p className={styles.specialization}>
                              {consultation.doctor?.specialization ||
                                "Specialist"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            consultation.status,
                          )}`}
                        >
                          {consultation.status}
                        </span>
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Symptoms</span>
                          <span className={styles.detailValue}>
                            {consultation.symptoms || "Not provided"}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>
                            Current Problem
                          </span>
                          <span className={styles.detailValue}>
                            {consultation.currentProblem || "Not provided"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.metaInfo}>
                          <div className={styles.metaItem}>
                            <FiCalendar />
                            <span>
                              {new Date(
                                consultation.consultationDate,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className={styles.metaItem}>
                            <FiClock />
                            <span>
                              {consultation.startTime} - {consultation.endTime}
                            </span>
                          </div>
                          <div className={styles.metaItemBadge}>
                            {consultation.consultationType?.toUpperCase()}
                          </div>
                        </div>

                        {consultation.status !== "completed" && (
                          <button
                            className={styles.joinBtn}
                            onClick={() =>
                              navigate(`/video-call/${consultation._id}`)
                            }
                          >
                            Join Call <FiArrowRight />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= DOCTORS TAB ================= */}

          {activeTab === "doctors" && (
            <div className={styles.doctorsSection}>
              {/* FILTERS */}

              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search doctor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className={styles.selectBox}>
                  <FiFilter />
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>

              {/* DOCTOR GRID */}

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                </div>
              ) : (
                <div className={styles.doctorsGrid}>
                  {doctors.map((doctor) => (
                    <div key={doctor._id} className={styles.doctorCard}>
                      <div className={styles.doctorAvatar}>
                        {doctor.name?.charAt(0) || "D"}
                      </div>

                      <h3>Dr. {doctor.name}</h3>

                      <p className={styles.docSpec}>
                        {doctor.specialization || "Specialist"}
                      </p>
                      <p className={styles.docQual}>
                        {doctor.qualification || "Qualified"}
                      </p>
                      <p className={styles.docExp}>
                        {doctor.experience || 0} years exp.
                      </p>

                      <div className={styles.actionRow}>
                        <button className={styles.iconBtn}>
                          <FiVideo />
                        </button>

                        <button className={styles.iconBtn}>
                          <FiPhone />
                        </button>

                        <button
                          className={styles.bookBtn}
                          onClick={() => handleBookConsultation(doctor)}
                        >
                          Book Appt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
