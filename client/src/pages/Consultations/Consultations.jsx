import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiClock,
  FiStar,
  FiPhone,
  FiVideo,
  FiMessageSquare,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./Consultations.module.css";
import { apiClient, consultationApi } from "../../utils/api";

export default function Consultations() {
  const [activeTab, setActiveTab] = useState("history");
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [stats, setStats] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);

  // Fetch consultation history
  useEffect(() => {
    if (activeTab === "history") {
      fetchConsultations();
      fetchStats();
    }
  }, [activeTab]);

  // Fetch available doctors
  useEffect(() => {
    if (activeTab === "doctors") {
      fetchDoctors();
    }
  }, [activeTab, specialization, searchQuery]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const response = await consultationApi.getMyConsultations();
      setConsultations(response.data.consultations || []);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await consultationApi.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await consultationApi.getAvailableDoctors({
        specialization: specialization || undefined,
        limit: 12,
      });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingModal(true);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      scheduled: "#3b82f6",
      ongoing: "#f59e0b",
      completed: "#10b981",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Consultations</h1>
              <p className={styles.pageSubtitle}>
                Manage your medical consultations
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${
                activeTab === "history" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              Consultation History
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "doctors" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("doctors")}
            >
              Available Doctors
            </button>
          </div>

          {/* History Tab */}
 {activeTab === "history" && (
            <div className={styles.historySection}>
              {/* Stats Cards */}
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div
                      className={styles.statIcon}
                      style={{ color: "#51da4d" }}
                    >
                      <FiFileText size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.total}</div>
                      <div className={styles.statLabel}>
                        Total Consultations
                      </div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div
                      className={styles.statIcon}
                      style={{ color: "#3b82f6" }}
                    >
                      <FiClock size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.upcoming}</div>
                      <div className={styles.statLabel}>Upcoming</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div
                      className={styles.statIcon}
                      style={{ color: "#10b981" }}
                    >
                      <FiCheckCircle size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{stats.completed}</div>
                      <div className={styles.statLabel}>Completed</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div
                      className={styles.statIcon}
                      style={{ color: "#f59e0b" }}
                    >
                      <FiStar size={20} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {(stats.averageRating || 0).toFixed(1)}
                      </div>
                      <div className={styles.statLabel}>Avg Rating</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consultations List */}
              <div className={styles.consultationsList}>
                {loading ? (
                  <div className={styles.loadingState}>
                    Loading consultations...
                  </div>
                ) : consultations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>
                      No consultations yet. Start by booking a consultation with
                      a doctor!
                    </p>
                  </div>
                ) : (
                  consultations.map((consultation) => (
                    <div
                      key={consultation._id}
                      className={styles.consultationCard}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.doctorInfo}>
                          <div className={styles.doctorAvatar}>
                            {consultation.doctor?.name?.charAt(0) || "D"}
                          </div>
                          <div className={styles.doctorDetails}>
                            <h3 className={styles.doctorName}>
                              {consultation.doctor?.name || "Doctor"}
                            </h3>
                            <p className={styles.doctorSpecialization}>
                              {consultation.doctor?.specialization ||
                                "Specialist"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={styles.statusBadge}
                          style={{
                            backgroundColor: getStatusBadgeColor(
                              consultation.status
                            ),
                          }}
                        >
                          {consultation.status?.charAt(0).toUpperCase() +
                            consultation.status?.slice(1)}
                        </span>
                      </div>

                      <div className={styles.cardContent}>
                        {consultation.symptoms?.length > 0 && (
                          <div className={styles.symptomsList}>
                            <strong>Symptoms:</strong>
                            {consultation.symptoms.join(", ")}
                          </div>
                        )}
                        {consultation.diagnosis && (
                          <div className={styles.diagnosis}>
                            <strong>Diagnosis:</strong> {consultation.diagnosis}
                          </div>
                        )}
                        <div className={styles.consultationMeta}>
                          <span className={styles.urgency}>
                            Urgency:{" "}
                            <strong>{consultation.urgencyScore}/10</strong>
                          </span>
                          <span className={styles.type}>
                            Type:{" "}
                            <strong>{consultation.consultationType}</strong>
                          </span>
                          {consultation.duration && (
                            <span className={styles.duration}>
                              <FiClock size={14} /> {consultation.duration} min
                            </span>
                          )}
                        </div>
                      </div>

                      {consultation.rating && (
                        <div className={styles.ratingSection}>
                          <div className={styles.ratingStars}>
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                size={14}
                                style={{
                                  fill:
                                    i < consultation.rating.score
                                      ? "#f59e0b"
                                      : "none",
                                  color: "#f59e0b",
                                }}
                              />
                            ))}
                          </div>
                          <p className={styles.ratingFeedback}>
                            {consultation.rating.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === "doctors" && (
            <div className={styles.doctorsSection}>
              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchInput}>
                  <FiSearch size={18} />
                  <input
                    type="text"
                    placeholder="Search doctors by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className={styles.filterSelect}>
                  <FiFilter size={18} />
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
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
              </div>

              {/* Doctors Grid */}
              <div className={styles.doctorsGrid}>
                {loading ? (
                  <div className={styles.loadingState}>Loading doctors...</div>
                ) : doctors.length === 0 ? (
                  <div className={styles.emptyState}>
                    No doctors found matching your criteria.
                  </div>
                ) : (
                  doctors.map((doctor) => (
                    <div key={doctor._id} className={styles.doctorCard}>
                      <div className={styles.doctorCardHeader}>
                        <div className={styles.largeAvatar}>
                          {doctor.name?.charAt(0) || "D"}
                        </div>
                        <div className={styles.ratingBadge}>
                          <FiStar
                            size={16}
                            style={{ fill: "#f59e0b", color: "#f59e0b" }}
                          />
                          <span>{(doctor.averageRating || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className={styles.doctorCardContent}>
                        <h3 className={styles.doctorCardName}>{doctor.name}</h3>
                        <p className={styles.doctorCardSpecialization}>
                          {doctor.specialization || "Specialist"}
                        </p>
                        <p className={styles.doctorCardQualification}>
                          {doctor.qualification || "Qualified"}
                        </p>
                        <p className={styles.doctorExperience}>
                          {doctor.experience || 0} years experience
                        </p>

                        <div className={styles.consultationCount}>
                          <span>
                            {doctor.totalConsultations || 0} consultations
                          </span>
                        </div>
                      </div>

                      <div className={styles.doctorCardActions}>
                        <button className={styles.consultBtn}>
                          <FiVideo size={16} /> Video
                        </button>
                        <button className={styles.consultBtn}>
                          <FiPhone size={16} /> Call
                        </button>
                        <button
                          className={styles.bookBtn}
                          onClick={() => handleBookConsultation(doctor)}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {bookingModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => {
            setBookingModal(false);
            setSelectedDoctor(null);
          }}
          onSuccess={() => {
            setBookingModal(false);
            setSelectedDoctor(null);
            setActiveTab("history");
            fetchConsultations();
          }}
        />
      )}
    </div>
  );
}

// Booking Modal Component
function BookingModal({ doctor, onClose, onSuccess }) {
  const [symptoms, setSymptoms] = useState("");
  const [urgencyScore, setUrgencyScore] = useState(5);
  const [consultationType, setConsultationType] = useState("video");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await consultationApi.createConsultation({
        doctorId: doctor._id,
        symptoms: symptoms.split(",").map((s) => s.trim()),
        urgencyScore: parseInt(urgencyScore),
        consultationType,
      });

      alert("Consultation booked successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to book consultation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.modalTitle}>Book Consultation</h2>
        <p className={styles.modalSubtitle}>with Dr. {doctor.name}</p>

        <form onSubmit={handleSubmit} className={styles.bookingForm}>
          <div className={styles.formGroup}>
            <label>Symptoms (comma-separated)</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., headache, fever, fatigue"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Urgency Level: {urgencyScore}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={urgencyScore}
              onChange={(e) => setUrgencyScore(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Consultation Type</label>
            <select
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
            >
              <option value="video">Video Call</option>
              <option value="audio">Audio Call</option>
              <option value="chat">Chat</option>
            </select>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
