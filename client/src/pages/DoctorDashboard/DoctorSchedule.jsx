import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLoader,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiX,
  FiUser,
  FiPhone,
  FiVideo,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import {
  doctorAvailabilityApi,
  consultationApi,
  authApi,
} from "../../utils/api";
import styles from "./DoctorSchedule.module.css";
import { performLogout } from "../../utils/auth";

export default function DoctorSchedule({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("week"); // week or day
  const [analytics, setAnalytics] = useState({
    totalSlots: 0,
    bookedSlots: 0,
    freeSlots: 0,
    workingHours: 0,
    completedConsultations: 0,
    ongoingConsultations: 0,
    videoConsultations: 0,
    callConsultations: 0,
    chatConsultations: 0,
  });

  /*
  ==================================================
  FETCH DATA ON MOUNT
  ==================================================
  */

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Fetch logged-in user
        const userRes = await authApi.me();
        const userData = userRes.data.user || userRes.data;
        setUser(userData);

        // Fetch doctor's availability
        const availRes = await doctorAvailabilityApi.getMySlots();
        setAvailability(availRes.data.availability || []);

        // Fetch doctor's consultations
        const consultRes = await consultationApi.getDoctorConsultations();
        setConsultations(consultRes.data.consultations || []);

        // Set initial selected date to today
        setSelectedDate(new Date());
      } catch (err) {
        console.error("Error fetching schedule data:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /*
  ==================================================
  CALCULATE ANALYTICS
  ==================================================
  */

  useEffect(() => {
    if (!availability.length) return;

    let totalSlots = 0;
    let bookedSlots = 0;
    let freeSlots = 0;
    let workingHours = 0;

    availability.forEach((day) => {
      if (!day.slots) return;
      day.slots.forEach((slot) => {
        totalSlots++;
        if (slot.isBooked) {
          bookedSlots++;
        } else {
          freeSlots++;
        }
        // Calculate working hours (each slot is 30 min = 0.5 hours)
        workingHours += 0.5;
      });
    });

    const completed = consultations.filter(
      (c) => c.status === "completed",
    ).length;
    const ongoing = consultations.filter((c) => c.status === "ongoing").length;

    const videoCount = consultations.filter(
      (c) => c.consultationType === "video",
    ).length;
    const callCount = consultations.filter(
      (c) => c.consultationType === "call",
    ).length;
    const chatCount = consultations.filter(
      (c) => c.consultationType === "chat",
    ).length;

    setAnalytics({
      totalSlots,
      bookedSlots,
      freeSlots,
      workingHours,
      completedConsultations: completed,
      ongoingConsultations: ongoing,
      videoConsultations: videoCount,
      callConsultations: callCount,
      chatConsultations: chatCount,
    });
  }, [availability, consultations]);

  /*
  ==================================================
  GET WEEK DATES
  ==================================================
  */

  const getWeekDates = () => {
    const week = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); // First day is the day of the week

    for (let i = 0; i < 7; i++) {
      const date = new Date(curr.setDate(first + i));
      week.push(new Date(date));
    }

    return week;
  };

  /*
  ==================================================
  GET AVAILABILITY FOR A SPECIFIC DATE
  ==================================================
  */

  const getAvailabilityForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availability.find(
      (avail) => avail.availableDate.split("T")[0] === dateStr,
    );
  };

  /*
  ==================================================
  GET CONSULTATIONS FOR A SPECIFIC DATE
  ==================================================
  */

  const getConsultationsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return consultations.filter(
      (cons) => cons.consultationDate.split("T")[0] === dateStr,
    );
  };

  /*
  ==================================================
  FORMAT TIME
  ==================================================
  */

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  /*
  ==================================================
  GET CONSULTATION TYPE ICON
  ==================================================
  */

  const getConsultationIcon = (type) => {
    switch (type) {
      case "video":
        return <FiVideo className={styles.videoIcon} />;
      case "call":
        return <FiPhone className={styles.callIcon} />;
      default:
        return <FiUser />;
    }
  };

  /*
  ==================================================
  CHECK IF SLOT HAS EXPIRED
  ==================================================
  */

  const isSlotExpired = (date, endTime) => {
    const slotDate = new Date(date);
    const [hours, minutes] = endTime.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    return slotDate < now;
  };

  /*
  ==================================================
  GET STATUS COLOR
  ==================================================
  */

  const getStatusClass = (status) => {
    switch (status) {
      case "scheduled":
        return styles.statusScheduled;
      case "ongoing":
        return styles.statusOngoing;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      case "expired":
        return styles.statusExpired;
      default:
        return styles.statusScheduled;
    }
  };

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => performLogout();

  if (loading) {
    return (
      <div className={styles.scheduleContainer}>
        <DoctorSidebar
          user={user}
          isProfileIncomplete={isProfileIncomplete}
          onLogout={handleLogout}
        />
        <div className={styles.loadingContainer}>
          <FiLoader className={styles.spinner} />
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates();
  const selectedDateAvailability = getAvailabilityForDate(
    selectedDate || new Date(),
  );
  const selectedDateConsultations = getConsultationsForDate(
    selectedDate || new Date(),
  );

  return (
    <div className={styles.scheduleContainer}>
      <DoctorSidebar
        user={user}
        isProfileIncomplete={isProfileIncomplete}
        onLogout={handleLogout}
      />

      <main className={styles.scheduleContent}>
        <header className={styles.header}>
          <h1>Schedule</h1>
          <p>Manage your availability and upcoming consultations.</p>
        </header>

        {/* Ghost Stats */}
        <div className={styles.ghostStatsContainer}>
          <div className={styles.ghostStat}>
            <span className={styles.ghostValue}>{analytics.totalSlots}</span>
            <span className={styles.ghostLabel}>Total Slots</span>
          </div>
          <div className={styles.ghostStat}>
            <span className={styles.ghostValue}>{analytics.bookedSlots}</span>
            <span className={styles.ghostLabel}>Booked</span>
          </div>
          <div className={styles.ghostStat}>
            <span className={styles.ghostValue}>
              {analytics.completedConsultations}
            </span>
            <span className={styles.ghostLabel}>Completed</span>
          </div>
          <div className={styles.ghostStat}>
            <span className={styles.ghostValue}>
              {analytics.workingHours.toFixed(1)}h
            </span>
            <span className={styles.ghostLabel}>Hours</span>
          </div>
        </div>

        {/* Week Timeline Selector */}
        <div className={styles.weekTimeline}>
          <button
            className={styles.navButton}
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
              )
            }
          >
            <FiChevronLeft size={24} />
          </button>

          <div className={styles.daysWrapper}>
            {weekDates.map((date, idx) => {
              const dayAvailability = getAvailabilityForDate(date);
              const dayCons = getConsultationsForDate(date);
              const isSelected =
                selectedDate?.toDateString() === date.toDateString();

              const hasSlots = dayAvailability?.slots?.length > 0;
              const hasBookings = dayCons.length > 0;

              return (
                <div
                  key={idx}
                  className={`${styles.dayItem} ${isSelected ? styles.dayItemActive : ""}`}
                  onClick={() => setSelectedDate(new Date(date))}
                >
                  <span className={styles.dayName}>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  <div className={styles.dotIndicators}>
                    {hasSlots && (
                      <div className={`${styles.dot} ${styles.free}`}></div>
                    )}
                    {hasBookings && (
                      <div className={`${styles.dot} ${styles.booked}`}></div>
                    )}
                    {!hasSlots && !hasBookings && (
                      <div className={styles.dot}></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className={styles.navButton}
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              )
            }
          >
            <FiChevronRight size={24} />
          </button>
        </div>

        {/* Agenda / Slots List */}
        {selectedDate && (
          <div className={styles.agendaContainer}>
            <div className={styles.agendaHeader}>
              <h2 className={styles.agendaDateTitle}>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p className={styles.agendaSubtitle}>
                {selectedDateAvailability?.slots?.length || 0} slots available
              </p>
            </div>

            {selectedDateAvailability?.slots?.length > 0 ? (
              <div className={styles.timelineList}>
                {selectedDateAvailability.slots.map((slot, idx) => {
                  // Try to find consultation by ID first (most reliable)
                  // Then fall back to matching by time
                  let consultation = null;
                  if (slot.consultationId) {
                    consultation = selectedDateConsultations.find(
                      (c) => c._id === slot.consultationId,
                    );
                  }
                  // Fallback to time-based matching if ID lookup failed
                  if (!consultation && slot.isBooked) {
                    consultation = selectedDateConsultations.find(
                      (c) =>
                        c.startTime === slot.startTime &&
                        c.endTime === slot.endTime,
                    );
                  }

                  const slotExpired = isSlotExpired(
                    selectedDateAvailability.availableDate,
                    slot.endTime,
                  );

                  return (
                    <div key={idx} className={styles.timelineRow}>
                      {/* Left: Time */}
                      <div className={styles.timeCol}>
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </div>

                      {/* Middle: Info */}
                      <div className={styles.infoCol}>
                        {slot.isBooked ? (
                          consultation ? (
                            <>
                              <p className={styles.patientName}>
                                {consultation.patient?.name || "Patient"}
                              </p>
                              <p className={styles.consultationType}>
                                {getConsultationIcon(
                                  consultation.consultationType,
                                )}
                                {consultation.consultationType
                                  .charAt(0)
                                  .toUpperCase() +
                                  consultation.consultationType.slice(1)}
                              </p>
                            </>
                          ) : (
                            <span className={styles.bookedText}>Booked</span>
                          )
                        ) : slotExpired ? (
                          <span className={styles.expiredText}>Expired</span>
                        ) : (
                          <span className={styles.freeText}>
                            Available for booking
                          </span>
                        )}
                      </div>

                      {/* Right: Status */}
                      <div className={styles.actionCol}>
                        {slot.isBooked ? (
                          <div
                            className={`${styles.tinyStatusPill} ${consultation?.status === "completed" ? styles.pillCompleted : styles.pillBooked}`}
                          >
                            <div className={styles.pillDot}></div>
                            {consultation
                              ? consultation.status.charAt(0).toUpperCase() +
                                consultation.status.slice(1)
                              : "Booked"}
                          </div>
                        ) : slotExpired ? (
                          <div
                            className={`${styles.tinyStatusPill} ${styles.pillExpired}`}
                          >
                            <div className={styles.pillDot}></div>
                            Passed
                          </div>
                        ) : (
                          <div
                            className={`${styles.tinyStatusPill} ${styles.pillAvailable}`}
                          >
                            <div className={styles.pillDot}></div>
                            Free
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No slots scheduled for this day.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
