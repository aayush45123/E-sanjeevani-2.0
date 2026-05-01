import React, { useEffect, useState } from "react";
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

export default function DoctorSchedule({ isProfileIncomplete = false }) {
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

  if (loading) {
    return (
      <div className={styles.scheduleContainer}>
        <DoctorSidebar user={user} isProfileIncomplete={isProfileIncomplete} />
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
      <DoctorSidebar user={user} isProfileIncomplete={isProfileIncomplete} />

      <main className={styles.scheduleContent}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Schedule & Availability</h1>
          <p>Manage your consultations and working hours</p>
        </div>

        {/* Analytics Grid */}
        <div className={styles.analyticsGrid}>
          <div className={styles.analyticsCard}>
            <div className={styles.analyticsIconWrapper}>
              <FiCalendar className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Total Slots</p>
              <h3 className={styles.analyticsValue}>{analytics.totalSlots}</h3>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div
              className={styles.analyticsIconWrapper + " " + styles.bookedColor}
            >
              <FiCheckCircle className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Booked Slots</p>
              <h3 className={styles.analyticsValue}>{analytics.bookedSlots}</h3>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div
              className={styles.analyticsIconWrapper + " " + styles.freeColor}
            >
              <FiClock className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Free Slots</p>
              <h3 className={styles.analyticsValue}>{analytics.freeSlots}</h3>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div
              className={
                styles.analyticsIconWrapper + " " + styles.workingColor
              }
            >
              <FiTrendingUp className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Working Hours</p>
              <h3 className={styles.analyticsValue}>
                {analytics.workingHours.toFixed(1)}h
              </h3>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div
              className={
                styles.analyticsIconWrapper + " " + styles.completedColor
              }
            >
              <FiCheckCircle className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Completed</p>
              <h3 className={styles.analyticsValue}>
                {analytics.completedConsultations}
              </h3>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div
              className={
                styles.analyticsIconWrapper + " " + styles.ongoingColor
              }
            >
              <FiAlertCircle className={styles.analyticsIcon} />
            </div>
            <div className={styles.analyticsContent}>
              <p className={styles.analyticsLabel}>Ongoing</p>
              <h3 className={styles.analyticsValue}>
                {analytics.ongoingConsultations}
              </h3>
            </div>
          </div>
        </div>

        {/* Consultation Type Breakdown */}
        <div className={styles.typeBreakdownContainer}>
          <div className={styles.typeBreakdownCard}>
            <FiVideo className={styles.typeIcon + " " + styles.videoType} />
            <div>
              <p className={styles.typeLabel}>Video Calls</p>
              <h4 className={styles.typeValue}>
                {analytics.videoConsultations}
              </h4>
            </div>
          </div>

          <div className={styles.typeBreakdownCard}>
            <FiPhone className={styles.typeIcon + " " + styles.callType} />
            <div>
              <p className={styles.typeLabel}>Audio Calls</p>
              <h4 className={styles.typeValue}>
                {analytics.callConsultations}
              </h4>
            </div>
          </div>

          <div className={styles.typeBreakdownCard}>
            <FiUser className={styles.typeIcon + " " + styles.chatType} />
            <div>
              <p className={styles.typeLabel}>Chat Consultations</p>
              <h4 className={styles.typeValue}>
                {analytics.chatConsultations}
              </h4>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className={styles.weekViewContainer}>
          <div className={styles.weekHeader}>
            <button
              className={styles.navButton}
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                )
              }
            >
              <FiChevronLeft />
            </button>
            <h2 className={styles.weekTitle}>
              Week of{" "}
              {weekDates[0]?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <button
              className={styles.navButton}
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                )
              }
            >
              <FiChevronRight />
            </button>
          </div>

          <div className={styles.weekGrid}>
            {weekDates.map((date, idx) => {
              const dayAvailability = getAvailabilityForDate(date);
              const dayCons = getConsultationsForDate(date);
              const isSelected =
                selectedDate?.toDateString() === date.toDateString();

              return (
                <div
                  key={idx}
                  className={`${styles.dayCard} ${isSelected ? styles.dayCardActive : ""}`}
                  onClick={() => setSelectedDate(new Date(date))}
                >
                  <p className={styles.dayName}>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className={styles.dayDate}>{date.getDate()}</p>
                  <div className={styles.dayStats}>
                    <span className={styles.slotBadge}>
                      {dayAvailability?.slots?.length || 0} slots
                    </span>
                    <span className={styles.consultationBadge}>
                      {dayCons.length} bookings
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail View */}
        {selectedDate && (
          <div className={styles.dayDetailContainer}>
            <div className={styles.dayDetailHeader}>
              <h2 className={styles.dayDetailTitle}>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
            </div>

            {/* Slots for the day */}
            {selectedDateAvailability ? (
              <div className={styles.slotsContainer}>
                <h3 className={styles.slotsSectionTitle}>Available Slots</h3>
                <div className={styles.slotsList}>
                  {selectedDateAvailability.slots?.map((slot, idx) => {
                    const consultation = selectedDateConsultations.find(
                      (c) =>
                        c.startTime === slot.startTime &&
                        c.endTime === slot.endTime,
                    );

                    const slotExpired = isSlotExpired(
                      selectedDateAvailability.availableDate,
                      slot.endTime,
                    );

                    return (
                      <div
                        key={idx}
                        className={`${styles.slotCard} ${
                          slot.isBooked
                            ? styles.slotBooked
                            : slotExpired
                              ? styles.slotExpired
                              : styles.slotFree
                        }`}
                      >
                        <div className={styles.slotTime}>
                          <FiClock className={styles.slotTimeIcon} />
                          <span>
                            {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </span>
                        </div>

                        {slot.isBooked && consultation ? (
                          <div className={styles.slotBookedInfo}>
                            <div className={styles.slotPatientInfo}>
                              <p className={styles.slotPatientName}>
                                {consultation.patient?.name || "Patient"}
                              </p>
                              <p className={styles.slotConsultationType}>
                                {getConsultationIcon(
                                  consultation.consultationType,
                                )}
                                {consultation.consultationType
                                  .charAt(0)
                                  .toUpperCase() +
                                  consultation.consultationType.slice(1)}
                              </p>
                            </div>
                            <div
                              className={`${styles.slotStatus} ${getStatusClass(consultation.status)}`}
                            >
                              {consultation.status}
                            </div>
                          </div>
                        ) : slotExpired ? (
                          <div className={styles.slotExpiredInfo}>
                            <FiX className={styles.expiredIcon} />
                            <p>Expired</p>
                          </div>
                        ) : (
                          <div className={styles.slotFreeInfo}>
                            <FiCheckCircle className={styles.freeCheckIcon} />
                            <p>Available</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.noSlotsMessage}>
                <FiAlertCircle className={styles.noSlotsIcon} />
                <p>No slots scheduled for this date</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
