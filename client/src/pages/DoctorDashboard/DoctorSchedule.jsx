import React, { useEffect, useState, useCallback } from "react";
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
  FiPlus,
  FiTrash2,
  FiRepeat,
  FiGrid,
  FiSettings,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import { DoctorScheduleSkeleton } from "../../components/Skeletons";
import {
  doctorAvailabilityApi,
  consultationApi,
  authApi,
} from "../../utils/api";
import styles from "./DoctorSchedule.module.css";
import { performLogout } from "../../utils/auth";
import toast from "react-hot-toast";

const WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WEEK_DURATIONS = [
  { value: 2, label: "Next 2 Weeks" },
  { value: 4, label: "Next 4 Weeks" },
  { value: 8, label: "Next 8 Weeks" },
  { value: 12, label: "Next 12 Weeks" },
];

const toDateStr = (date) => {
  if (!date) return "";
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayName = (date) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "long" });

const getDatesByDayNames = (startDate, endDate, dayNames) => {
  const results = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (dayNames.includes(getDayName(cur))) {
      results.push(toDateStr(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return results;
};

const getDatesInMonth = (yearMonth, dayFilter, customDayNames = []) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  let dayNames = WORKING_DAYS;
  if (dayFilter === "weekdays")
    dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  else if (dayFilter === "weekends") dayNames = ["Saturday", "Sunday"];
  else if (dayFilter === "custom") dayNames = customDayNames;
  return getDatesByDayNames(start, end, dayNames);
};

export default function DoctorSchedule({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("single"); // 'single' | 'generator' | 'recurring'

  // Single Day Slots Editor State
  const [editSlots, setEditSlots] = useState([
    { startTime: "09:00", endTime: "09:30" },
  ]);

  // Generator State
  const [genStartTime, setGenStartTime] = useState("09:00");
  const [genEndTime, setGenEndTime] = useState("17:00");
  const [genSlotDuration, setGenSlotDuration] = useState(30);

  // Recurring Engine State
  const [recurringType, setRecurringType] = useState("weekly"); // 'weekly' | 'monthly'
  const [weeklyDays, setWeeklyDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [weekDuration, setWeekDuration] = useState(4);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthDayFilter, setMonthDayFilter] = useState("weekdays");
  const [savingSchedule, setSavingSchedule] = useState(false);

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
  FETCH DATA
  ==================================================
  */
  const fetchData = useCallback(async () => {
    try {
      const [userRes, availRes, consultRes] = await Promise.all([
        authApi.me().catch((err) => {
          if (err.status === 401 || err.response?.status === 401) {
            performLogout();
          }
          return null;
        }),
        doctorAvailabilityApi.getMySlots().catch((err) => {
          console.error("Failed to fetch slots:", err);
          return { data: { availability: [] } };
        }),
        consultationApi.getDoctorConsultations().catch((err) => {
          console.error("Failed to fetch consultations:", err);
          return { data: { consultations: [] } };
        }),
      ]);

      if (userRes?.data) {
        const userData = userRes.data.user || userRes.data;
        setUser(userData);
      }

      setAvailability(availRes?.data?.availability || []);
      setConsultations(consultRes?.data?.consultations || []);
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    })();
  }, [fetchData]);

  /*
  ==================================================
  CALCULATE ANALYTICS
  ==================================================
  */
  useEffect(() => {
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
        workingHours += 0.5;
      });
    });

    const completed = consultations.filter((c) => c.status === "completed").length;
    const ongoing = consultations.filter((c) => c.status === "ongoing").length;
    const videoCount = consultations.filter((c) => c.consultationType === "video").length;
    const callCount = consultations.filter((c) => c.consultationType === "call").length;
    const chatCount = consultations.filter((c) => c.consultationType === "chat").length;

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
  GET WEEK DATES (Safe, no mutation)
  ==================================================
  */
  const getWeekDates = () => {
    const week = [];
    const base = new Date(currentDate);
    base.setHours(0, 0, 0, 0);
    const dayOfWeek = base.getDay(); // 0 is Sunday
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  /*
  ==================================================
  GET AVAILABILITY & CONSULTATIONS FOR A SPECIFIC DATE
  ==================================================
  */
  const getAvailabilityForDate = (date) => {
    const dateStr = toDateStr(date);
    return availability.find((avail) => toDateStr(avail.availableDate) === dateStr);
  };

  const getConsultationsForDate = (date) => {
    const dateStr = toDateStr(date);
    return consultations.filter(
      (cons) => toDateStr(cons.consultationDate) === dateStr,
    );
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

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

  const isSlotExpired = (date, endTime) => {
    if (!date || !endTime) return false;
    const slotDate = new Date(date);
    const [hours, minutes] = endTime.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < new Date();
  };

  /*
  ==================================================
  SLOT MANAGEMENT HANDLERS
  ==================================================
  */
  const handleOpenAddModal = (dateToEdit = selectedDate) => {
    const existing = getAvailabilityForDate(dateToEdit);
    if (existing && existing.slots?.length > 0) {
      setEditSlots(
        existing.slots.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      );
    } else {
      setEditSlots([
        { startTime: "09:00", endTime: "09:30" },
        { startTime: "10:00", endTime: "10:30" },
        { startTime: "11:00", endTime: "11:30" },
      ]);
    }
    setIsEditModalOpen(true);
  };

  const handleDeleteSlot = async (slotId) => {
    if (!slotId) return;
    if (!window.confirm("Are you sure you want to remove this time slot?")) return;

    try {
      await doctorAvailabilityApi.deleteSlot(slotId);
      toast.success("Time slot removed successfully");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error(err.response?.data?.message || "Failed to remove time slot");
    }
  };

  const handleAddSlotRow = () => {
    setEditSlots((prev) => [...prev, { startTime: "", endTime: "" }]);
  };

  const handleRemoveSlotRow = (index) => {
    setEditSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, field, value) => {
    setEditSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  // Generate slots algorithm
  const handleGenerateSlots = () => {
    if (!genStartTime || !genEndTime) {
      toast.error("Please enter start and end working hours");
      return;
    }
    if (genStartTime >= genEndTime) {
      toast.error("Start time must be before end time");
      return;
    }

    const duration = Number(genSlotDuration) || 30;
    const [startH, startM] = genStartTime.split(":").map(Number);
    const [endH, endM] = genEndTime.split(":").map(Number);

    let curMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const generated = [];
    while (curMinutes + duration <= endMinutes) {
      const sh = String(Math.floor(curMinutes / 60)).padStart(2, "0");
      const sm = String(curMinutes % 60).padStart(2, "0");
      const nextMin = curMinutes + duration;
      const eh = String(Math.floor(nextMin / 60)).padStart(2, "0");
      const em = String(nextMin % 60).padStart(2, "0");

      generated.push({
        startTime: `${sh}:${sm}`,
        endTime: `${eh}:${em}`,
      });
      curMinutes += duration;
    }

    if (generated.length === 0) {
      toast.error("No slots could be generated with the given times.");
      return;
    }

    setEditSlots(generated);
    setModalTab("single");
    toast.success(`Generated ${generated.length} slots! Review and save below.`);
  };

  const handleSaveSlots = async (e) => {
    e.preventDefault();

    const validSlots = editSlots.filter((s) => s.startTime && s.endTime);
    if (validSlots.length === 0) {
      toast.error("Please specify at least one valid time slot");
      return;
    }

    for (const s of validSlots) {
      if (s.startTime >= s.endTime) {
        toast.error(`Invalid slot: ${s.startTime} is not before ${s.endTime}`);
        return;
      }
    }

    setSavingSchedule(true);
    try {
      if (modalTab === "recurring") {
        let dates = [];
        if (recurringType === "weekly") {
          if (weeklyDays.length === 0) {
            toast.error("Please select at least one weekday");
            setSavingSchedule(false);
            return;
          }
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + weekDuration * 7 - 1);
          dates = getDatesByDayNames(start, end, weeklyDays);
        } else {
          dates = getDatesInMonth(selectedMonth, monthDayFilter);
        }

        if (dates.length === 0) {
          toast.error("No valid dates found for recurring configuration");
          setSavingSchedule(false);
          return;
        }

        await Promise.all(
          dates.map((date) =>
            doctorAvailabilityApi.createAvailability({
              availableDate: date,
              slots: validSlots,
            }),
          ),
        );
        toast.success(`Schedule saved for ${dates.length} days!`);
      } else {
        // Single day save
        const targetDateStr = toDateStr(selectedDate);
        await doctorAvailabilityApi.createAvailability({
          availableDate: targetDateStr,
          slots: validSlots,
        });
        toast.success(`Slots saved for ${targetDateStr}!`);
      }

      setIsEditModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Save schedule error:", err);
      toast.error(err.response?.data?.message || "Failed to save schedule slots");
    } finally {
      setSavingSchedule(false);
    }
  };

  const weekDates = getWeekDates();
  const selectedDateObj = selectedDate || new Date();
  const selectedDateAvailability = getAvailabilityForDate(selectedDateObj);
  const selectedDateConsultations = getConsultationsForDate(selectedDateObj);

  if (loading) {
    return <DoctorScheduleSkeleton />;
  }

  return (
    <div className={styles.scheduleContainer}>
      <DoctorSidebar
        user={user}
        isProfileIncomplete={isProfileIncomplete}
        onLogout={performLogout}
      />

      <main className={styles.scheduleContent}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Schedule</h1>
              <p>Manage your real-time availability, time slots, and consultations.</p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.addSlotsBtn}
                onClick={() => handleOpenAddModal(selectedDateObj)}
              >
                <FiPlus size={16} /> Add / Edit Slots
              </button>
              <button
                className={styles.manageScheduleBtn}
                onClick={() => {
                  setModalTab("recurring");
                  setIsEditModalOpen(true);
                }}
              >
                <FiRepeat size={15} /> Recurring Engine
              </button>
            </div>
          </div>
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
            <span className={styles.ghostValue}>{analytics.freeSlots}</span>
            <span className={styles.ghostLabel}>Available Free</span>
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
            title="Previous week"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
              )
            }
          >
            <FiChevronLeft size={22} />
          </button>

          <div className={styles.daysWrapper}>
            {weekDates.map((date, idx) => {
              const dayAvailability = getAvailabilityForDate(date);
              const dayCons = getConsultationsForDate(date);
              const isSelected =
                toDateStr(selectedDateObj) === toDateStr(date);

              const hasSlots = dayAvailability?.slots?.length > 0;
              const hasBookings = dayCons.length > 0;
              const slotCount = dayAvailability?.slots?.length || 0;

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
                      <div className={`${styles.dot} ${styles.free}`} title={`${slotCount} slots`}></div>
                    )}
                    {hasBookings && (
                      <div className={`${styles.dot} ${styles.booked}`} title={`${dayCons.length} booked`}></div>
                    )}
                    {!hasSlots && !hasBookings && (
                      <div className={styles.dot}></div>
                    )}
                  </div>
                  {slotCount > 0 && (
                    <span className={styles.daySlotBadge}>{slotCount} slots</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className={styles.navButton}
            title="Next week"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              )
            }
          >
            <FiChevronRight size={22} />
          </button>
        </div>

        {/* Agenda / Slots List */}
        <div className={styles.agendaContainer}>
          <div className={styles.agendaHeader}>
            <div>
              <h2 className={styles.agendaDateTitle}>
                {selectedDateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className={styles.agendaSubtitle}>
                {selectedDateAvailability?.slots?.length || 0} slots configured for this day
              </p>
            </div>
            <div className={styles.agendaActions}>
              <button
                className={styles.quickAddSlotBtn}
                onClick={() => handleOpenAddModal(selectedDateObj)}
              >
                <FiPlus size={15} /> Add Slots for this Day
              </button>
            </div>
          </div>

          {selectedDateAvailability?.slots?.length > 0 ? (
            <div className={styles.timelineList}>
              {selectedDateAvailability.slots.map((slot, idx) => {
                let consultation = null;
                if (slot.consultationId) {
                  consultation = selectedDateConsultations.find(
                    (c) => c._id === slot.consultationId || c.id === slot.consultationId,
                  );
                }
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
                  <div key={slot._id || slot.id || idx} className={styles.timelineRow}>
                    {/* Left: Time */}
                    <div className={styles.timeCol}>
                      <FiClock size={14} className={styles.clockIcon} />
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
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
                              {getConsultationIcon(consultation.consultationType)}
                              {consultation.consultationType
                                ? consultation.consultationType.charAt(0).toUpperCase() +
                                  consultation.consultationType.slice(1)
                                : "Video"}{" "}
                              Consultation
                            </p>
                          </>
                        ) : (
                          <span className={styles.bookedText}>Booked Consultation</span>
                        )
                      ) : slotExpired ? (
                        <span className={styles.expiredText}>Expired Slot</span>
                      ) : (
                        <span className={styles.freeText}>
                          Available for patient booking
                        </span>
                      )}
                    </div>

                    {/* Right: Status & Actions */}
                    <div className={styles.actionCol}>
                      {slot.isBooked ? (
                        <div
                          className={`${styles.tinyStatusPill} ${
                            consultation?.status === "completed"
                              ? styles.pillCompleted
                              : styles.pillBooked
                          }`}
                        >
                          <div className={styles.pillDot}></div>
                          {consultation
                            ? consultation.status.charAt(0).toUpperCase() +
                              consultation.status.slice(1)
                            : "Booked"}
                        </div>
                      ) : slotExpired ? (
                        <div className={`${styles.tinyStatusPill} ${styles.pillExpired}`}>
                          <div className={styles.pillDot}></div>
                          Passed
                        </div>
                      ) : (
                        <div className={`${styles.tinyStatusPill} ${styles.pillAvailable}`}>
                          <div className={styles.pillDot}></div>
                          Free
                        </div>
                      )}

                      {/* Remove Slot button for unbooked slots */}
                      {!slot.isBooked && (
                        <button
                          className={styles.slotDeleteBtn}
                          onClick={() => handleDeleteSlot(slot.id || slot._id)}
                          title="Remove this slot"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiCalendar size={42} className={styles.emptyCalendarIcon} />
              <p>No slots scheduled for {selectedDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</p>
              <button
                className={styles.emptyStateAddBtn}
                onClick={() => handleOpenAddModal(selectedDateObj)}
              >
                <FiPlus size={16} /> Configure Availability for this Day
              </button>
            </div>
          )}
        </div>

        {/* ── AVAILABILITY & SLOTS EDIT MODAL ── */}
        {isEditModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Manage Schedule Availability</h3>
                  <p className={styles.modalSubtitle}>
                    {modalTab === "recurring"
                      ? "Create weekly recurring or monthly availability"
                      : `Configuring for ${toDateStr(selectedDateObj)}`}
                  </p>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === "single" ? styles.modalTabBtnActive : ""}`}
                  onClick={() => setModalTab("single")}
                >
                  <FiClock size={14} /> This Day Slots
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === "generator" ? styles.modalTabBtnActive : ""}`}
                  onClick={() => setModalTab("generator")}
                >
                  <FiSettings size={14} /> Quick Slot Generator
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === "recurring" ? styles.modalTabBtnActive : ""}`}
                  onClick={() => setModalTab("recurring")}
                >
                  <FiRepeat size={14} /> Recurring Engine
                </button>
              </div>

              {/* TAB 1: QUICK GENERATOR */}
              {modalTab === "generator" && (
                <div className={styles.generatorBox}>
                  <p className={styles.genHelpText}>
                    Specify working hours and slot duration to automatically generate slots for this day.
                  </p>
                  <div className={styles.genRow}>
                    <div className={styles.genField}>
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={genStartTime}
                        onChange={(e) => setGenStartTime(e.target.value)}
                      />
                    </div>
                    <div className={styles.genField}>
                      <label>End Time</label>
                      <input
                        type="time"
                        value={genEndTime}
                        onChange={(e) => setGenEndTime(e.target.value)}
                      />
                    </div>
                    <div className={styles.genField}>
                      <label>Duration (mins)</label>
                      <select
                        value={genSlotDuration}
                        onChange={(e) => setGenSlotDuration(Number(e.target.value))}
                      >
                        <option value={15}>15 mins</option>
                        <option value={20}>20 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.generateBtn}
                    onClick={handleGenerateSlots}
                  >
                    ⚡ Generate Slots
                  </button>
                </div>
              )}

              {/* TAB 2: RECURRING ENGINE SETTINGS */}
              {modalTab === "recurring" && (
                <div className={styles.recurringBox}>
                  <div className={styles.recurringTypeRow}>
                    <button
                      type="button"
                      className={`${styles.recurringTypeBtn} ${recurringType === "weekly" ? styles.recurringTypeBtnActive : ""}`}
                      onClick={() => setRecurringType("weekly")}
                    >
                      <FiRepeat size={14} /> Weekly Recurring
                    </button>
                    <button
                      type="button"
                      className={`${styles.recurringTypeBtn} ${recurringType === "monthly" ? styles.recurringTypeBtnActive : ""}`}
                      onClick={() => setRecurringType("monthly")}
                    >
                      <FiGrid size={14} /> Monthly Calendar
                    </button>
                  </div>

                  {recurringType === "weekly" ? (
                    <div className={styles.recurringConfig}>
                      <label className={styles.boxLabel}>Select Working Days:</label>
                      <div className={styles.dayPillRow}>
                        {WORKING_DAYS.map((day) => {
                          const active = weeklyDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`${styles.dayPill} ${active ? styles.dayPillActive : ""}`}
                              onClick={() =>
                                setWeeklyDays((prev) =>
                                  prev.includes(day)
                                    ? prev.filter((d) => d !== day)
                                    : [...prev, day],
                                )
                              }
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>

                      <div className={styles.durationRow}>
                        <label className={styles.boxLabel}>Duration:</label>
                        <select
                          value={weekDuration}
                          onChange={(e) => setWeekDuration(Number(e.target.value))}
                          className={styles.styledSelect}
                        >
                          {WEEK_DURATIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.recurringConfig}>
                      <div className={styles.durationRow}>
                        <label className={styles.boxLabel}>Month:</label>
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className={styles.styledInput}
                        />
                      </div>
                      <div className={styles.durationRow}>
                        <label className={styles.boxLabel}>Day Filter:</label>
                        <select
                          value={monthDayFilter}
                          onChange={(e) => setMonthDayFilter(e.target.value)}
                          className={styles.styledSelect}
                        >
                          <option value="weekdays">Weekdays Only (Mon–Fri)</option>
                          <option value="weekends">Weekends Only (Sat–Sun)</option>
                          <option value="all">All Days in Month</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SLOTS EDITOR LIST (Used for saving in Single or Recurring) */}
              <form onSubmit={handleSaveSlots}>
                <div className={styles.slotsEditorSection}>
                  <div className={styles.slotsEditorHeader}>
                    <span className={styles.slotsEditorTitle}>
                      Configured Time Slots ({editSlots.length})
                    </span>
                    <button
                      type="button"
                      className={styles.addSlotRowBtn}
                      onClick={handleAddSlotRow}
                    >
                      <FiPlus size={14} /> Add Slot
                    </button>
                  </div>

                  <div className={styles.slotsListScroll}>
                    {editSlots.map((slot, i) => (
                      <div key={i} className={styles.modalSlotRow}>
                        <span className={styles.slotRowIndex}>#{i + 1}</span>
                        <div className={styles.timeInputCol}>
                          <label>Start</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleSlotChange(i, "startTime", e.target.value)
                            }
                            required
                          />
                        </div>
                        <span className={styles.dashDivider}>–</span>
                        <div className={styles.timeInputCol}>
                          <label>End</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleSlotChange(i, "endTime", e.target.value)
                            }
                            required
                          />
                        </div>
                        {editSlots.length > 1 && (
                          <button
                            type="button"
                            className={styles.removeSlotRowBtn}
                            onClick={() => handleRemoveSlotRow(i)}
                            title="Remove slot"
                          >
                            <FiX size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.modalCancelBtn}
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSaveBtn}
                    disabled={savingSchedule}
                  >
                    {savingSchedule ? (
                      <><FiLoader className={styles.spinner} /> Saving...</>
                    ) : (
                      <>Save Schedule</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
