import React, { useState, useEffect } from "react";
import {
  Search,
  Stethoscope,
  MapPin,
  Clock,
  Calendar,
  Award,
  DollarSign,
  Star,
  CheckCircle,
  Video,
  Phone,
  Building,
  Navigation,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { consultationApi } from "../../utils/api";
import styles from "./AvailableDoctors.module.css";

const POPULAR_SPECIALTIES = [
  "All",
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "Neurologist",
  "Psychiatrist",
  "ENT Specialist",
];

export default function AvailableDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [showNearMe, setShowNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const navigate = useNavigate();

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
        specialization: selectedSpecialty !== "All" ? selectedSpecialty : undefined,
      });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch available doctors:", error);
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
        specialization: selectedSpecialty !== "All" ? selectedSpecialty : undefined,
      });
      setDoctors(response.data.doctors || response.data.data?.doctors || []);
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
          alert("Geolocation is not supported by your browser");
          setLocationLoading(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            setShowNearMe(true);
            setLocationLoading(false);
          },
          (error) => {
            alert("Could not retrieve your location. Showing all doctors.");
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

  const filteredDoctors = doctors.filter((doc) => {
    const name = doc.name || "";
    const spec = doc.specialization || "";
    const hospital = doc.hospitalName || doc.clinicAddress?.city || "";
    const q = searchQuery.toLowerCase();

    return (
      name.toLowerCase().includes(q) ||
      spec.toLowerCase().includes(q) ||
      hospital.toLowerCase().includes(q)
    );
  });

  const handleBookDoctor = (doctor) => {
    navigate("/consultation-booking", {
      state: { doctor },
    });
  };

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Hero Header */}
          <div className={styles.heroHeader}>
            <div className={styles.heroText}>
              <div className={styles.heroBadge}>
                <Sparkles size={14} /> Verified Medical Professionals
              </div>
              <h1 className={styles.heroTitle}>Available Doctors</h1>
              <p className={styles.heroSubtitle}>
                Connect instantly with top specialists for video and in-person consultations.
              </p>
            </div>
            
            <button
              className={`${styles.nearMeBtn} ${showNearMe ? styles.nearMeActive : ""}`}
              onClick={handleToggleNearMe}
              disabled={locationLoading}
            >
              <Navigation size={16} className={locationLoading ? styles.spin : ""} />
              {locationLoading
                ? "Locating..."
                : showNearMe
                ? "Showing Nearby Doctors"
                : "Find Doctors Near Me"}
            </button>
          </div>

          {/* Specialty Filter Pills */}
          <div className={styles.pillsScroll}>
            {POPULAR_SPECIALTIES.map((spec) => (
              <button
                key={spec}
                className={`${styles.pillBtn} ${
                  selectedSpecialty === spec ? styles.pillActive : ""
                }`}
                onClick={() => setSelectedSpecialty(spec)}
              >
                {spec === "All" && <Filter size={13} />}
                {spec}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className={styles.searchBarContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search doctors by name, specialty, or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
                Clear
              </button>
            )}
          </div>

          {/* Doctor Cards Grid */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Fetching available medical specialists...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconCircle}>
                <Stethoscope size={36} />
              </div>
              <h3>No Doctors Currently Available</h3>
              <p>
                {searchQuery || selectedSpecialty !== "All"
                  ? "Try resetting your search query or selecting a different specialty filter."
                  : "Check back shortly or explore alternative medical specialties."}
              </p>
              {(searchQuery || selectedSpecialty !== "All") && (
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialty("All");
                  }}
                >
                  <RefreshCw size={14} /> Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className={styles.doctorsGrid}>
              {filteredDoctors.map((doc) => {
                const doctorName = doc.name || "Specialist";
                const spec = doc.specialization || "General Medicine";
                const experience = doc.experience ? `${doc.experience} yrs exp` : "10+ yrs exp";
                const fee = doc.consultationFee ? `₹${doc.consultationFee}` : "₹500";
                const hospital = doc.hospitalName || "Partner Medical Center";
                const rating = doc.rating || 4.9;
                const workingDays = Array.isArray(doc.workingDays)
                  ? doc.workingDays.slice(0, 3).join(", ")
                  : "Mon - Sat";
                const timeSlot = doc.startTime && doc.endTime ? `${doc.startTime} - ${doc.endTime}` : "09:00 AM - 05:00 PM";

                return (
                  <div key={doc._id || doc.id} className={styles.doctorCard}>
                    {/* Header Banner & Photo */}
                    <div className={styles.cardHeaderBanner}>
                      <div className={styles.verifiedBadge}>
                        <CheckCircle size={12} /> Verified Specialist
                      </div>
                    </div>

                    <div className={styles.cardMainContent}>
                      <div className={styles.doctorAvatarBox}>
                        <div className={styles.avatarCircle}>
                          {doctorName.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.onlineDot} title="Available for booking"></span>
                      </div>

                      <div className={styles.doctorIdentity}>
                        <h3 className={styles.docName}>Dr. {doctorName}</h3>
                        <p className={styles.docSpec}>{spec}</p>

                        <div className={styles.metaRow}>
                          <span className={styles.metaBadge}>
                            <Award size={13} /> {experience}
                          </span>
                          <span className={styles.ratingBadge}>
                            <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {rating}
                          </span>
                        </div>
                      </div>

                      <div className={styles.detailsList}>
                        <div className={styles.detailItem}>
                          <Building size={14} className={styles.itemIcon} />
                          <span>{hospital}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <Clock size={14} className={styles.itemIcon} />
                          <span>{workingDays} ({timeSlot})</span>
                        </div>
                        {doc.clinicAddress?.city && (
                          <div className={styles.detailItem}>
                            <MapPin size={14} className={styles.itemIcon} />
                            <span>{doc.clinicAddress.city}, {doc.clinicAddress.state || ""}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardFooterRow}>
                        <div className={styles.feeBox}>
                          <span className={styles.feeLabel}>Consultation Fee</span>
                          <span className={styles.feeAmount}>{fee}</span>
                        </div>

                        <button
                          className={styles.bookBtn}
                          onClick={() => handleBookDoctor(doc)}
                        >
                          Book Appointment <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
