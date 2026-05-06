import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiUsers,
  FiPhone,
  FiCalendar,
  FiMessageSquare,
  FiTrendingUp,
  FiLoader,
  FiChevronDown,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./MyPatients.module.css";
import { consultationApi } from "../../utils/api";

export default function MyPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("consultations");
  const [expandedPatient, setExpandedPatient] = useState(null);

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  // Fetch consultations and process patient data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await consultationApi.getDoctorConsultations();
        const consultations = response.data.consultations || [];

        // Group consultations by patient
        const patientMap = {};

        consultations.forEach((consultation) => {
          const patientId = consultation.patient?._id;
          if (patientId) {
            if (!patientMap[patientId]) {
              patientMap[patientId] = {
                id: patientId,
                name: consultation.patient?.name || "Unknown",
                email: consultation.patient?.email || "",
                phone: consultation.patient?.phone || "N/A",
                age: consultation.patient?.age || "N/A",
                gender: consultation.patient?.gender || "N/A",
                bloodType: consultation.patient?.bloodType || "N/A",
                consultations: [],
                conditions: new Set(),
                consultationTypes: new Set(),
                totalSessions: 0,
                completedSessions: 0,
                lastConsultationDate: null,
              };
            }

            patientMap[patientId].consultations.push(consultation);
            patientMap[patientId].conditions.add(consultation.currentProblem);
            patientMap[patientId].consultationTypes.add(
              consultation.consultationType,
            );
            patientMap[patientId].totalSessions++;

            if (consultation.status === "completed") {
              patientMap[patientId].completedSessions++;
            }

            const consultationDate = new Date(consultation.consultationDate);
            if (
              !patientMap[patientId].lastConsultationDate ||
              consultationDate > patientMap[patientId].lastConsultationDate
            ) {
              patientMap[patientId].lastConsultationDate = consultationDate;
            }
          }
        });

        // Convert Sets to Arrays and sort
        const processedPatients = Object.values(patientMap).map((p) => ({
          ...p,
          conditions: Array.from(p.conditions),
          consultationTypes: Array.from(p.consultationTypes),
        }));

        setPatients(processedPatients);
        setFilteredPatients(processedPatients);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Search and filter patients
  useEffect(() => {
    let filtered = patients;

    // Search by name
    if (searchQuery) {
      filtered = filtered.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    if (sortBy === "consultations") {
      filtered.sort((a, b) => b.totalSessions - a.totalSessions);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.lastConsultationDate) - new Date(a.lastConsultationDate),
      );
    }

    setFilteredPatients(filtered);
  }, [searchQuery, sortBy, patients]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.dashboardLayout}>
        <DoctorSidebar onLogout={handleLogout} />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <FiLoader className={styles.spinner} />
            <p>Loading patients...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar onLogout={handleLogout} />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Patients</h1>
              <p className={styles.subtitle}>
                Manage and view all your patients' consultation history
              </p>
            </div>
            <div className={styles.statsOverview}>
              <div className={styles.statBox}>
                <FiUsers size={20} />
                <div>
                  <p className={styles.statLabel}>Total Patients</p>
                  <p className={styles.statValue}>{patients.length}</p>
                </div>
              </div>
              <div className={styles.statBox}>
                <FiTrendingUp size={20} />
                <div>
                  <p className={styles.statLabel}>Total Consultations</p>
                  <p className={styles.statValue}>
                    {patients.reduce((sum, p) => sum + p.totalSessions, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterBox}>
              <FiFilter size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="consultations">Most Consultations</option>
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Patient List */}
          {filteredPatients.length === 0 ? (
            <div className={styles.emptyState}>
              <FiUsers size={48} />
              <h2>No patients found</h2>
              <p>
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "You haven't had any consultations yet"}
              </p>
            </div>
          ) : (
            <div className={styles.patientsList}>
              {filteredPatients.map((patient) => (
                <div key={patient.id} className={styles.patientCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.patientInfo}>
                      <div className={styles.avatar}>
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.patientBasicInfo}>
                        <h3 className={styles.patientName}>{patient.name}</h3>
                        <p className={styles.patientEmail}>{patient.email}</p>
                      </div>
                    </div>

                    <div className={styles.quickStats}>
                      <div className={styles.stat}>
                        <span className={styles.statIcon}>📋</span>
                        <span className={styles.statText}>
                          {patient.totalSessions} consultations
                        </span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statIcon}>✓</span>
                        <span className={styles.statText}>
                          {patient.completedSessions} completed
                        </span>
                      </div>
                    </div>

                    <button
                      className={styles.expandBtn}
                      onClick={() =>
                        setExpandedPatient(
                          expandedPatient === patient.id ? null : patient.id,
                        )
                      }
                    >
                      <FiChevronDown
                        size={20}
                        style={{
                          transform:
                            expandedPatient === patient.id
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>
                  </div>

                  {expandedPatient === patient.id && (
                    <div className={styles.cardDetails}>
                      {/* Personal Info */}
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          Personal Information
                        </h4>
                        <div className={styles.detailsGrid}>
                          <div className={styles.detailItem}>
                            <span className={styles.label}>Phone</span>
                            <span className={styles.value}>
                              <FiPhone size={14} />
                              {patient.phone}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.label}>Age</span>
                            <span className={styles.value}>{patient.age}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.label}>Gender</span>
                            <span className={styles.value}>
                              {patient.gender}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.label}>Blood Type</span>
                            <span className={styles.value}>
                              {patient.bloodType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Details */}
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          Consultation Details
                        </h4>
                        <div className={styles.consultationMetrics}>
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>
                              <FiCalendar size={14} />
                              Last Consultation
                            </span>
                            <span className={styles.metricValue}>
                              {formatDate(patient.lastConsultationDate)}
                            </span>
                          </div>
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>
                              <FiMessageSquare size={14} />
                              Consultation Types
                            </span>
                            <span className={styles.metricValue}>
                              {patient.consultationTypes
                                .map(
                                  (t) => t.charAt(0).toUpperCase() + t.slice(1),
                                )
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          Conditions Consulted For
                        </h4>
                        <div className={styles.conditionsList}>
                          {patient.conditions.map((condition, idx) => (
                            <span key={idx} className={styles.conditionTag}>
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Consultation History */}
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          Recent Consultations
                        </h4>
                        <div className={styles.consultationHistory}>
                          {patient.consultations
                            .slice(0, 5)
                            .map((consultation, idx) => (
                              <div key={idx} className={styles.historyItem}>
                                <div className={styles.historyDate}>
                                  {formatDate(consultation.consultationDate)}
                                </div>
                                <div className={styles.historyDetails}>
                                  <p className={styles.historyProblem}>
                                    {consultation.currentProblem}
                                  </p>
                                  <p className={styles.historyTime}>
                                    {consultation.startTime} -{" "}
                                    {consultation.endTime}
                                  </p>
                                </div>
                                <span
                                  className={`${styles.historyStatus} ${styles[`status-${consultation.status}`]}`}
                                >
                                  {consultation.status}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
