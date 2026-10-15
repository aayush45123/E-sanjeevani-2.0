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
  Building2,
  Award,
  GraduationCap,
  Clock,
  Languages,
  ShieldCheck,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { consultationApi, feedbackApi } from "../../utils/api";
import { formatDoctorName, getDoctorInitials } from "../../utils/doctorUtils";
import styles from "./AvailableDoctors.module.css";
import toast from "react-hot-toast";

export default function AvailableDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // full unfiltered list for client-side filtering
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

  // Only re-fetch when the Near Me toggle or location changes, NOT on every specialty click
  useEffect(() => {
    if (showNearMe && userLocation) {
      fetchDoctorsNearMe();
    } else if (!showNearMe) {
      fetchDoctors();
    }
  }, [showNearMe, userLocation]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await consultationApi.getAvailableDoctors({
        limit: 100,
      });
      const docs = response.data?.doctors || [];
      setAllDoctors(docs);
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
        radiusKm: 15,
        specialization: undefined, // load all, filter client-side
      });
      const docs = response.data?.doctors || response.data?.data?.doctors || [];
      setAllDoctors(docs);
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

  // Compile full available list of specialties combining DB list and all loaded doctors
  const allSpecialties = useMemo(() => {
    const specsMap = new Map();
    dbSpecialties.forEach((s) => {
      if (s.specialization) specsMap.set(s.specialization, Number(s.count || 0));
    });
    // Use allDoctors (full unfiltered list) so pills don't disappear when a specialty is selected
    allDoctors.forEach((d) => {
      if (d.specialization) {
        const cur = specsMap.get(d.specialization) || 0;
        if (!specsMap.has(d.specialization)) specsMap.set(d.specialization, cur + 1);
      }
    });
    return Array.from(specsMap.keys()).sort();
  }, [dbSpecialties, allDoctors]);

  // Filtered doctors: apply specialty + search query client-side (instant, no API call)
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = doc.name || "";
      const spec = doc.specialization || "";
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
      const matchesSpecialty = selectedSpecialty === "all" || spec === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

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

  const handleBookAppt = (doctor, mode = "video") => {
    navigate("/consultation-booking", {
      state: { doctor, consultationMode: mode },
    });
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return null;
    const parts = String(timeStr).split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatWorkingDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) return null;
    if (days.length >= 7) return "All Days";
    if (days.length === 6 && !days.includes("Sunday")) return "Mon - Sat";
    if (days.length === 5 && !days.includes("Saturday") && !days.includes("Sunday")) return "Mon - Fri";
    return days.map((d) => String(d).slice(0, 3)).join(", ");
  };

  if (loading && doctors.length === 0) {
    return <AvailableDoctorsSkeleton />;
  }

  // Doctor Card Component to ensure rich, consistent rendering with all clinical details
  const renderDoctorCard = (doc) => {
    const docDisplayName = formatDoctorName(doc.name);
    const spec = doc.specialization || "General Specialist";
    const qualification = doc.qualification || "";
    const expYears =
      doc.experience !== undefined && doc.experience !== null
        ? Number(doc.experience)
        : null;
    const initials = getDoctorInitials(doc.name);

    // Distance in KM if available
    const distanceKm =
      doc.distanceInKm !== undefined && doc.distanceInKm !== null
        ? Number(doc.distanceInKm)
        : doc.distance !== undefined && doc.distance !== null
        ? Number(doc.distance)
        : null;

    // Location / Address formatting
    const locationParts = [];
    if (doc.clinicDistrict && doc.clinicDistrict !== doc.clinicCity) {
      locationParts.push(doc.clinicDistrict);
    } else if (doc.clinicStreet) {
      locationParts.push(doc.clinicStreet);
    }
    if (doc.clinicCity) {
      locationParts.push(doc.clinicCity);
    } else if (doc.clinicAddress?.city) {
      locationParts.push(doc.clinicAddress.city);
    }
    const locationText = locationParts.join(", ") || doc.clinicAddress?.district || "";

    // Timings & Working Days
    const timingFrom = formatTime12h(doc.startTime);
    const timingTo = formatTime12h(doc.endTime);
    const timingsText = timingFrom && timingTo ? `${timingFrom} - ${timingTo}` : null;
    const daysText = formatWorkingDays(doc.workingDays);

    // Languages spoken
    let languagesList = [];
    if (Array.isArray(doc.languagesSpoken)) {
      languagesList = doc.languagesSpoken.filter(Boolean);
    } else if (typeof doc.languagesSpoken === "string" && doc.languagesSpoken.trim()) {
      languagesList = doc.languagesSpoken.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Rating data
    const r = doctorRatings[doc.id || doc._id];
    const hasReviews = r && r.totalReviews > 0;
    const ratingScore = hasReviews ? Number(r.averageRating).toFixed(1) : "4.9";
    const reviewCount = hasReviews ? r.totalReviews : "Verified";

    // Consultation Fee
    const feeValue =
      doc.consultationFee !== undefined && doc.consultationFee !== null
        ? Number(doc.consultationFee)
        : null;

    // Consultation modes
    const modes =
      Array.isArray(doc.consultationModes) && doc.consultationModes.length > 0
        ? doc.consultationModes
        : ["video", "call"];

    return (
      <div key={doc._id || doc.id} className={styles.doctorCard}>
        {/* Top Header: Avatar + Badges */}
        <div className={styles.cardHeader}>
          <div className={styles.avatarWrapper}>
            {doc.profileImage ? (
              <img
                src={doc.profileImage}
                alt={docDisplayName}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarCircle}>{initials}</div>
            )}
            <span className={styles.onlineDot} title="Online & Available" />
          </div>

          <div className={styles.headerBadges}>
            {distanceKm !== null && (
              <span className={styles.distanceBadge}>
                <MapPin size={11} /> {distanceKm.toFixed(1)} km away
              </span>
            )}
            <span className={styles.verifiedBadge}>
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className={styles.cardBody}>
          <div className={styles.nameAndRatingRow}>
            <div className={styles.nameSection}>
              <h3 className={styles.doctorName}>{docDisplayName}</h3>
              <div className={styles.specialtyContainer}>
                <span className={styles.specializationText}>{spec}</span>
                {doc.superSpecialization && (
                  <span className={styles.superSpecializationText}>
                    • {doc.superSpecialization}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.ratingBadge}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span className={styles.ratingScore}>{ratingScore}</span>
              <span className={styles.ratingCount}>
                ({reviewCount}{typeof reviewCount === "number" ? " reviews" : ""})
              </span>
            </div>
          </div>

          {/* Key Clinical Details List */}
          <div className={styles.detailsList}>
            {/* Experience & Qualification */}
            <div className={styles.detailRow}>
              <Award size={14} className={styles.detailIcon} />
              <span className={styles.detailText}>
                <strong>{expYears !== null ? `${expYears} yrs exp.` : "Experienced"}</strong>
                {qualification ? ` • ${qualification}` : " • Registered Specialist"}
              </span>
            </div>

            {/* Hospital / Clinic & City */}
            {(doc.hospitalName || locationText) && (
              <div className={styles.detailRow}>
                <Building2 size={14} className={styles.detailIcon} />
                <span
                  className={styles.detailText}
                  title={`${doc.hospitalName || ""} ${locationText ? `(${locationText})` : ""}`}
                >
                  <strong>{doc.hospitalName || "Clinic"}</strong>
                  {locationText && (
                    <span className={styles.subtleLocation}> ({locationText})</span>
                  )}
                </span>
              </div>
            )}

            {/* Available Timings & Working Days */}
            {(timingsText || daysText) && (
              <div className={styles.detailRow}>
                <Clock size={14} className={styles.detailIcon} />
                <span className={styles.detailText}>
                  {timingsText || "Available Today"}
                  {daysText && (
                    <span className={styles.subtleDays}> • {daysText}</span>
                  )}
                </span>
              </div>
            )}

            {/* Languages Spoken */}
            {languagesList.length > 0 && (
              <div className={styles.detailRow}>
                <Languages size={14} className={styles.detailIcon} />
                <div className={styles.languagesContainer}>
                  {languagesList.slice(0, 3).map((lang, idx) => (
                    <span key={idx} className={styles.langPill}>
                      {lang}
                    </span>
                  ))}
                  {languagesList.length > 3 && (
                    <span className={styles.langPillMore}>
                      +{languagesList.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Consultation Modes Supported */}
          <div className={styles.modesRow}>
            <span className={styles.modesLabel}>Consultation:</span>
            <div className={styles.modesBadges}>
              {modes.includes("video") && (
                <span className={styles.modeBadge} title="Video Consult Available">
                  <Video size={11} /> Video
                </span>
              )}
              {modes.includes("call") && (
                <span className={styles.modeBadge} title="Audio Call Available">
                  <Phone size={11} /> Audio
                </span>
              )}
              {modes.includes("chat") && (
                <span className={styles.modeBadge} title="Chat Consult Available">
                  <MessageSquare size={11} /> Chat
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: Fees & Action Buttons */}
        <div className={styles.cardFooter}>
          <div className={styles.feeBlock}>
            <span className={styles.feeLabel}>Fee</span>
            <div className={styles.feeAmount}>
              {feeValue !== null && feeValue > 0 ? (
                <>
                  <span className={styles.feeCurrency}>₹</span>
                  <span className={styles.feeValue}>{feeValue}</span>
                  <span className={styles.feePeriod}>/ session</span>
                </>
              ) : (
                <span className={styles.feeFree}>Free Consult</span>
              )}
            </div>
          </div>

          <div className={styles.ctaActions}>
            <button
              type="button"
              className={styles.iconBtn}
              title="Quick Video Consultation"
              onClick={() => handleBookAppt(doc, "video")}
            >
              <Video size={15} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              title="Quick Audio Consultation"
              onClick={() => handleBookAppt(doc, "call")}
            >
              <Phone size={15} />
            </button>
            <button
              type="button"
              className={styles.bookApptBtn}
              onClick={() => handleBookAppt(doc)}
            >
              <span>Book Appt</span>
              <Calendar size={13} />
            </button>
          </div>
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
              <span className={styles.pillBadge}>{allDoctors.length}</span>
            </button>
            {allSpecialties.map((spec) => {
              const count = allDoctors.filter(
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
