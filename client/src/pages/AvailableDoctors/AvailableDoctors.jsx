import React, { useState, useEffect } from "react";
import { AvailableDoctorsSkeleton } from "../../components/Skeletons";

import { Search, MapPin, Video, Phone, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { consultationApi } from "../../utils/api";
import styles from "./AvailableDoctors.module.css";

export default function AvailableDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState("all");
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
  }, [specialization, showNearMe, userLocation]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await consultationApi.getAvailableDoctors({
        specialization: specialization !== "all" ? specialization : undefined,
        limit: 50,
      });
      setDoctors(response.data.doctors || []);
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
        specialization: specialization !== "all" ? specialization : undefined,
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
            alert("Could not retrieve your location.");
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

  // Get unique specializations for filter dropdown
  const specializationsList = [
    "all",
    ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const name = doc.name || "";
    const spec = doc.specialization || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
  });

  const handleBookAppt = (doctor) => {
    navigate("/consultation-booking", {
      state: { doctor },
    });
  };

  if (loading) {
    return <AvailableDoctorsSkeleton />;
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Available Doctors</h1>
            <p className={styles.pageSubtitle}>
              Find and book appointments with available doctors.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className={styles.filterToolbar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterDropdownWrapper}>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Specializations</option>
                {specializationsList
                  .filter((s) => s !== "all")
                  .map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className={`${styles.nearMeBtn} ${showNearMe ? styles.nearMeActive : ""}`}
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

          {/* Doctors Grid */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading available doctors...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No available doctors found.</p>
              {(searchQuery || specialization !== "all" || showNearMe) && (
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSearchQuery("");
                    setSpecialization("all");
                    setShowNearMe(false);
                  }}
                >
                  <RefreshCw size={14} /> Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className={styles.doctorsGrid}>
              {filteredDoctors.map((doc) => {
                const doctorName = doc.name || "Doctor";
                const spec = doc.specialization || "Specialist";
                const qualification = doc.qualification || "Qualified";
                const experience =
                  doc.experience !== undefined
                    ? `${doc.experience} years exp.`
                    : "0 years exp.";
                const initial = doctorName.charAt(0).toUpperCase();

                return (
                  <div key={doc._id || doc.id} className={styles.doctorCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarCircle}>{initial}</div>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.doctorName}>Dr. {doctorName}</h3>
                      <p className={styles.specializationText}>{spec}</p>
                      <p className={styles.qualificationText}>{qualification}</p>
                      <p className={styles.experienceText}>{experience}</p>
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
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
