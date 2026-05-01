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
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./Consultations.module.css";
import { useNavigate } from "react-router-dom";
import { consultationApi } from "../../utils/api";

export default function Consultations() {
  const [activeTab, setActiveTab] = useState("history");
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
    if (activeTab === "history") {
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

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* ================= HEADER ================= */}

          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Consultations</h1>
            <p className={styles.pageSubtitle}>
              Manage your consultations and connect with doctors
            </p>
          </div>

          {/* ================= TABS ================= */}

          <div className={styles.tabsContainer}>
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

          {/* ================= HISTORY TAB ================= */}

          {activeTab === "history" && (
            <div className={styles.historySection}>
              {loading ? (
                <div className={styles.loadingState}>
                  Loading consultations...
                </div>
              ) : consultations.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiFileText size={32} />
                  <p>No consultations found yet</p>
                </div>
              ) : (
                <div className={styles.consultationList}>
                  {consultations.map((consultation) => (
                    <div
                      key={consultation._id}
                      className={styles.consultationCard}
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.doctorInfo}>
                          <div className={styles.avatar}>
                            {consultation.doctor?.name?.charAt(0) || "D"}
                          </div>

                          <div>
                            <h3 className={styles.doctorName}>
                              Dr. {consultation.doctor?.name || "Doctor"}
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

                      <div className={styles.cardBody}>
                        <p>
                          <strong>Symptoms:</strong> {consultation.symptoms}
                        </p>

                        <p>
                          <strong>Current Problem:</strong>{" "}
                          {consultation.currentProblem}
                        </p>

                        <div className={styles.metaRow}>
                          <span>
                            <FiCalendar />{" "}
                            {new Date(
                              consultation.consultationDate,
                            ).toLocaleDateString()}
                          </span>

                          <span>
                            <FiClock /> {consultation.startTime} -{" "}
                            {consultation.endTime}
                          </span>

                          <span>
                            {consultation.consultationType?.toUpperCase()}
                          </span>

                          <button
                            className={styles.bookBtn}
                            onClick={() =>
                              navigate(`/video-call/${consultation._id}`)
                            }
                          >
                            Join Consultation
                          </button>
                        </div>
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
                <div className={styles.loadingState}>Loading doctors...</div>
              ) : (
                <div className={styles.doctorsGrid}>
                  {doctors.map((doctor) => (
                    <div key={doctor._id} className={styles.doctorCard}>
                      <div className={styles.doctorAvatar}>
                        {doctor.name?.charAt(0) || "D"}
                      </div>

                      <h3>Dr. {doctor.name}</h3>

                      <p>{doctor.specialization || "Specialist"}</p>

                      <p>{doctor.qualification || "Qualified"}</p>

                      <p>{doctor.experience || 0} years experience</p>

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
                          Consult Now
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
