import React, { useState, useEffect, useMemo } from "react";
import { AvailableDoctorsSkeleton } from "../../components/Skeletons";
import {
  Search,
  MapPin,
  Video,
  Phone,
  RefreshCw,
  Star,
  Layers,
  LayoutGrid,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { consultationApi, feedbackApi } from "../../utils/api";
import { formatDoctorName, getDoctorInitials } from "../../utils/doctorUtils";
import styles from "./AvailableDoctors.module.css";
import toast from "react-hot-toast";

export default function AvailableDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [dbSpecialties, setDbSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [viewMode, setViewMode] = useState("sections"); // "sections" | "grid"
  const [showNearMe, setShowNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [doctorRatings, setDoctorRatings] = useState({});

  const navigate = useNavigate();

  // Load distinct specialties from database on mount
  useEffect(() => {
    async function loadSpecialties() {
      try {
        const res = await consultationApi.getSpecialties();
        if (res.data?.specialties) {
          setDbSpecialties(res.data.specialties);
        }
      } catch (err) {
        console.warn("Could not fetch specialties list:", err);
      }
    }
    loadSpecialties();
  }, []);

  const fetchRatingsForDoctors = async (docs) => {
    if (!docs || docs.length === 0) return;
    const ratingsMap = {};
    await Promise.all(
      docs.map(async (doc) => {
        const docId = doc.id || doc._id;
        if (!docId) return;
        try {
          const res = await feedbackApi.getDoctorRating(docId);
          ratingsMap[docId] = res.data?.data || res.data;
        } catch {
          // ignore single doctor rating failure
        }
      })
    );
    setDoctorRatings((prev) => ({ ...prev, ...ratingsMap }));
  };

  useEffect(() => {
    if (showNearMe && userLocation) {
      fetchDoctorsNearMe();
    } else {
      fetchDoctors();
    }
  }, [selectedSpecialty, showNearMe, userLocation]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await consultationApi.getAvailableDoctors({
        specialization:
          selectedSpecialty !== "all" ? selectedSpecialty : undefined,
        limit: 100,
      });
      const docs = response.data?.doctors || [];
      setDoctors(docs);
      fetchRatingsForDoctors(docs);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsNearMe = async () => {
    try {
      setLoading(true);
      const response = await consultationApi.getDoctorsNearMe({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: 50,
        specialization:
          selectedSpecialty !== "all" ? selectedSpecialty : undefined,
      });
      const docs = response.data?.doctors || response.data?.data?.doctors || [];
      setDoctors(docs);
      fetchRatingsForDoctors(docs);
    } catch (error) {
      console.error("Failed to fetch nearby doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNearMe = () => {
    if (!showNearMe) {
      if (!userLocation) {
        setLocationLoading(true);
        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          setLocationLoading(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            setShowNearMe(true);
            setLocationLoading(false);
            toast.success("Location acquired. Showing nearby doctors.");
          },
          (error) => {
            toast.error(
              "Could not retrieve your location. Please check browser permissions."
            );
            setLocationLoading(false);
          }
        );
      } else {
        setShowNearMe(true);
      }
    } else {
      setShowNearMe(false);
    }
  };

  // Compile full available list of specialties combining DB list and currently loaded doctors
  const allSpecialties = useMemo(() => {
    const specsMap = new Map();
    dbSpecialties.forEach((s) => {
      if (s.specialization) specsMap.set(s.specialization, Number(s.count || 0));
    });
    doctors.forEach((d) => {
      if (d.specialization) {
        const cur = specsMap.get(d.specialization) || 0;
        if (!specsMap.has(d.specialization)) specsMap.set(d.specialization, cur + 1);
      }
    });
    return Array.from(specsMap.keys()).sort();
  }, [dbSpecialties, doctors]);

  // Filtered doctors based on search query
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = doc.name || "";
      const spec = doc.specialization || "";
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return name.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
    });
  }, [doctors, searchQuery]);

  // Group filtered doctors by Section / Department
  const sectionWiseDoctors = useMemo(() => {
    const groups = {};
    filteredDoctors.forEach((doc) => {
      const section = doc.specialization || "General Medicine";
      if (!groups[section]) groups[section] = [];
      groups[section].push(doc);
    });
    return groups;
  }, [filteredDoctors]);

  const handleBookAppt = (doctor) => {
    navigate("/consultation-booking", {
      state: { doctor },
    });
  };

  if (loading && doctors.length === 0) {
    return <AvailableDoctorsSkeleton />;
  }

  // Doctor Card Component to ensure consistent rendering
  const renderDoctorCard = (doc) => {
    const docDisplayName = formatDoctorName(doc.name);
    const spec = doc.specialization || "Specialist";
    const qualification = doc.qualification || "Qualified";
    const experience =
      doc.experience !== undefined
        ? `${doc.experience} years exp.`
        : "0 years exp.";
    const initials = getDoctorInitials(doc.name);

    return (
      <div key={doc._id || doc.id} className={styles.doctorCard}>
        <div className={styles.cardHeader}>
          <div className={styles.avatarCircle}>{initials}</div>
          {doc.distanceInKm && (
            <span className={styles.distanceBadge}>
              <MapPin size={12} /> {doc.distanceInKm.toFixed(1)} km away
            </span>
          )}
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.doctorName}>{docDisplayName}</h3>
          {(() => {
            const r = doctorRatings[doc.id || doc._id];
            const hasReviews = r && r.totalReviews > 0;
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  margin: "4px 0 8px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    background: "#fef3c7",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#92400e",
                    }}
                  >
                    {hasReviews ? Number(r.averageRating).toFixed(1) : "New"}
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {hasReviews
                    ? `(${r.totalReviews} review${r.totalReviews > 1 ? "s" : ""})`
                    : "No reviews yet"}
                </span>
              </div>
            );
          })()}
          <p className={styles.specializationText}>{spec}</p>
          <p className={styles.qualificationText}>{qualification}</p>
          <p className={styles.experienceText}>{experience}</p>
          {doc.hospitalName && (
            <p className={styles.hospitalText}>{doc.hospitalName}</p>
          )}
          {doc.consultationFee !== undefined &&
            doc.consultationFee !== null &&
            doc.consultationFee > 0 && (
              <p className={styles.feeText}>
                ₹{doc.consultationFee} Consultation Fee
              </p>
            )}
        </div>

        <div className={styles.cardFooter}>
          <button
            className={styles.iconBtn}
            title="Video Consultation"
            onClick={() => handleBookAppt(doc)}
          >
            <Video size={16} />
          </button>
          <button
            className={styles.iconBtn}
            title="Audio Consultation"
            onClick={() => handleBookAppt(doc)}
          >
            <Phone size={16} />
          </button>
          <button
            className={styles.bookApptBtn}
            onClick={() => handleBookAppt(doc)}
          >
            Book Appt
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h1 className={styles.pageTitle}>Available Doctors</h1>
                <p className={styles.pageSubtitle}>
                  Section-wise directory of verified specialists available for
                  teleconsultation.
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className={styles.viewModeToggle}>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${
                    viewMode === "sections" ? styles.viewModeBtnActive : ""
                  }`}
                  onClick={() => setViewMode("sections")}
                  title="Group doctors by department section"
                >
                  <Layers size={14} /> Section-Wise
                </button>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${
                    viewMode === "grid" ? styles.viewModeBtnActive : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                  title="View all doctors in standard grid"
                >
                  <LayoutGrid size={14} /> Grid View
                </button>
              </div>
            </div>
          </div>

          {/* Section / Department Quick-Filter Pills */}
          <div className={styles.sectionPillsContainer}>
            <button
              type="button"
              className={`${styles.sectionPill} ${
                selectedSpecialty === "all" ? styles.sectionPillActive : ""
              }`}
              onClick={() => setSelectedSpecialty("all")}
            >
              <span>All Sections</span>
              <span className={styles.pillBadge}>{doctors.length}</span>
            </button>
            {allSpecialties.map((spec) => {
              const count = doctors.filter(
                (d) => d.specialization === spec
              ).length;
              return (
                <button
                  key={spec}
                  type="button"
                  className={`${styles.sectionPill} ${
                    selectedSpecialty === spec ? styles.sectionPillActive : ""
                  }`}
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  <Stethoscope size={12} />
                  <span>{spec}</span>
                  {count > 0 && (
                    <span className={styles.pillBadge}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Toolbar */}
          <div className={styles.filterToolbar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by doctor name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterDropdownWrapper}>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Departments / Specialties</option>
                {allSpecialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={`${styles.nearMeBtn} ${
                showNearMe ? styles.nearMeActive : ""
              }`}
              onClick={handleToggleNearMe}
              disabled={locationLoading}
            >
              <MapPin size={15} />
              {locationLoading
                ? "Locating..."
                : showNearMe
                ? "Showing Nearby Doctors"
                : "Doctors Near Me"}
            </button>
          </div>

          {/* Doctors Listing */}
          {filteredDoctors.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No doctors found matching the selected section or search query.</p>
              {(searchQuery || selectedSpecialty !== "all" || showNearMe) && (
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialty("all");
                    setShowNearMe(false);
                  }}
                >
                  <RefreshCw size={14} /> Reset Filters
                </button>
              )}
            </div>
          ) : viewMode === "sections" ? (
            /* SECTION-WISE ORGANIZED DISPLAY */
            <div className={styles.sectionWiseContainer}>
              {Object.keys(sectionWiseDoctors).map((sectionName) => {
                const sectionDoctors = sectionWiseDoctors[sectionName];
                return (
                  <section key={sectionName} className={styles.sectionGroup}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionTitleGroup}>
                        <Stethoscope size={18} color="#0ea5a4" />
                        <h2 className={styles.sectionTitle}>{sectionName}</h2>
                        <span className={styles.sectionBadge}>
                          {sectionDoctors.length} {sectionDoctors.length === 1 ? "Doctor" : "Doctors"} Available
                        </span>
                      </div>
                    </div>

                    <div className={styles.doctorsGrid}>
                      {sectionDoctors.map((doc) => renderDoctorCard(doc))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            /* STANDARD GRID DISPLAY */
            <div className={styles.doctorsGrid}>
              {filteredDoctors.map((doc) => renderDoctorCard(doc))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
