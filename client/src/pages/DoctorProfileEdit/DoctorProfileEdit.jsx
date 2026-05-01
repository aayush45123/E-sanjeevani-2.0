// src/pages/DoctorProfileEdit/DoctorProfileEdit.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FiClock,
  FiCalendar,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiRepeat,
  FiGrid,
  FiList,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorProfileEdit.module.css";
import { doctorProfileApi, doctorAvailabilityApi } from "../../utils/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MODE_OPTIONS = ["video", "call", "chat"];

const SCHEDULE_TYPES = [
  { key: "custom", label: "Custom Date", icon: FiCalendar },
  { key: "weekly", label: "Weekly", icon: FiRepeat },
  { key: "monthly", label: "Monthly", icon: FiGrid },
];

const WEEK_DURATIONS = [
  { value: 2, label: "Next 2 Weeks" },
  { value: 4, label: "Next 4 Weeks" },
  { value: 8, label: "Next 8 Weeks" },
  { value: 12, label: "Next 12 Weeks" },
];

const MONTH_DAY_PRESETS = [
  { key: "all", label: "All Days" },
  { key: "weekdays", label: "Weekdays Only" },
  { key: "weekends", label: "Weekends Only" },
  { key: "custom", label: "Custom Days" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toYYYYMMDD = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDayName = (date) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "long" });

/** Returns an array of YYYY-MM-DD strings for dates within
 *  [startDate, endDate] whose weekday is in the selectedDays set. */
const getDatesByDayNames = (startDate, endDate, dayNames) => {
  const results = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (dayNames.includes(getDayName(cur))) {
      results.push(toYYYYMMDD(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return results;
};

/** Returns all dates in a given month (YYYY-MM) filtered by dayFilter preset
 *  or custom day names. */
const getDatesInMonth = (yearMonth, dayFilter, customDayNames = []) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day
  let dayNames = WORKING_DAYS;
  if (dayFilter === "weekdays")
    dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  else if (dayFilter === "weekends") dayNames = ["Saturday", "Sunday"];
  else if (dayFilter === "custom") dayNames = customDayNames;
  return getDatesByDayNames(start, end, dayNames);
};

const emptySlot = () => ({ startTime: "", endTime: "" });

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScheduleTypeSelector({ value, onChange }) {
  return (
    <div className={styles.scheduleTypeBar}>
      {SCHEDULE_TYPES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className={`${styles.scheduleTypeBtn} ${
            value === key ? styles.scheduleTypeBtnActive : ""
          }`}
          onClick={() => onChange(key)}
        >
          <Icon size={15} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function SlotEditor({ slots, onChange, onAdd, onRemove }) {
  return (
    <div className={styles.slotsContainer}>
      <div className={styles.slotsHeader}>
        <FiClock size={14} />
        <span>Time Slots</span>
        <span className={styles.slotBadge}>
          {slots.length} slot{slots.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className={styles.slotInfo}>Each slot is typically 30 minutes</p>

      <div className={styles.slotList}>
        {slots.map((slot, i) => (
          <div key={i} className={styles.slotRow}>
            <div className={styles.slotIndex}>{i + 1}</div>
            <div className={styles.slotGroup}>
              <label>Start Time</label>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => onChange(i, "startTime", e.target.value)}
                required
              />
            </div>
            <div className={styles.slotArrow}>→</div>
            <div className={styles.slotGroup}>
              <label>End Time</label>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => onChange(i, "endTime", e.target.value)}
                required
              />
            </div>
            {slots.length > 1 && (
              <button
                type="button"
                className={styles.removeSlotBtn}
                onClick={() => onRemove(i)}
                title="Remove slot"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className={styles.addSlotBtn} onClick={onAdd}>
        <FiPlus size={14} />
        Add Another Slot
      </button>
    </div>
  );
}

function DayCheckboxGrid({ selected, onChange, days = WORKING_DAYS }) {
  return (
    <div className={styles.dayGrid}>
      {days.map((day) => {
        const active = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            className={`${styles.dayChip} ${active ? styles.dayChipActive : ""}`}
            onClick={() => onChange(day)}
          >
            <span>{day.slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorProfileEdit({ isProfileIncomplete = false }) {
  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Profile State ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    phone: "",
    gender: "",
    dateOfBirth: "",
    specialization: "",
    superSpecialization: "",
    qualification: "",
    medicalRegistrationNumber: "",
    experience: "",
    hospitalName: "",
    consultationFee: "",
    languagesSpoken: "",
    workingDays: [],
    startTime: "",
    endTime: "",
    consultationModes: [],
    aboutDoctor: "",
    shortBio: "",
  });

  // ── Availability State ─────────────────────────────────────────────────────
  const [scheduleType, setScheduleType] = useState("custom"); // 'custom' | 'weekly' | 'monthly'
  const [slots, setSlots] = useState([emptySlot()]);
  const [existingAvailability, setExistingAvailability] = useState([]);

  // Custom date form
  const [customDate, setCustomDate] = useState("");

  // Weekly form
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [weekDuration, setWeekDuration] = useState(4);

  // Monthly form
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthDayFilter, setMonthDayFilter] = useState("weekdays");
  const [monthCustomDays, setMonthCustomDays] = useState([]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await doctorProfileApi.getProfile();
        if (res.data.success) {
          setProfileData({
            ...res.data.profile,
            languagesSpoken: Array.isArray(res.data.profile.languagesSpoken)
              ? res.data.profile.languagesSpoken.join(", ")
              : res.data.profile.languagesSpoken,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setFetchLoading(false);
      }
    })();
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await doctorAvailabilityApi.getMySlots();
      setExistingAvailability(
        res.data.success && Array.isArray(res.data.availability)
          ? res.data.availability
          : [],
      );
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setExistingAvailability([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "availability") fetchAvailability();
  }, [activeTab, fetchAvailability]);

  // ── Notifications ──────────────────────────────────────────────────────────
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 4000);
  };
  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // ── Profile Handlers ───────────────────────────────────────────────────────
  const handleProfileChange = (e) =>
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileCheckbox = (field, value) =>
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await doctorProfileApi.updateProfile({
        ...profileData,
        languagesSpoken: profileData.languagesSpoken
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(profileData.experience),
        consultationFee: Number(profileData.consultationFee),
      });
      showSuccess("Profile updated successfully!");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ── Slot Handlers ──────────────────────────────────────────────────────────
  const handleSlotChange = (idx, field, val) =>
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)),
    );
  const addSlot = () => setSlots((prev) => [...prev, emptySlot()]);
  const removeSlot = (idx) =>
    setSlots((prev) => prev.filter((_, i) => i !== idx));

  // ── Validate Slots ─────────────────────────────────────────────────────────
  const validateSlots = () => {
    if (!slots.every((s) => s.startTime && s.endTime)) {
      showError("Please fill all time slot fields.");
      return false;
    }
    for (const s of slots) {
      if (s.startTime >= s.endTime) {
        showError("Each start time must be before its end time.");
        return false;
      }
    }
    return true;
  };

  // ── Build dates to submit ──────────────────────────────────────────────────
  const buildDates = () => {
    if (scheduleType === "custom") {
      if (!customDate) {
        showError("Please select a date.");
        return null;
      }
      return [customDate];
    }
    if (scheduleType === "weekly") {
      if (weeklyDays.length === 0) {
        showError("Please select at least one weekday.");
        return null;
      }
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + weekDuration * 7 - 1);
      return getDatesByDayNames(start, end, weeklyDays);
    }
    if (scheduleType === "monthly") {
      if (monthDayFilter === "custom" && monthCustomDays.length === 0) {
        showError("Please select at least one day.");
        return null;
      }
      return getDatesInMonth(selectedMonth, monthDayFilter, monthCustomDays);
    }
    return null;
  };

  // ── Availability Submit ────────────────────────────────────────────────────
  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (!validateSlots()) return;
    const dates = buildDates();
    if (!dates || dates.length === 0) {
      showError("No valid dates found for the selected configuration.");
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        dates.map((date) =>
          doctorAvailabilityApi.createAvailability({
            availableDate: date,
            slots: slots.map((s) => ({ ...s })),
          }),
        ),
      );
      showSuccess(
        `Availability set for ${dates.length} day${dates.length > 1 ? "s" : ""}!`,
      );
      setSlots([emptySlot()]);
      setCustomDate("");
      setWeeklyDays([]);
      await fetchAvailability();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to set availability");
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleWeeklyDay = (day) =>
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const toggleMonthCustomDay = (day) =>
    setMonthCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  // ── Preview date count ─────────────────────────────────────────────────────
  const previewCount = (() => {
    try {
      if (scheduleType === "custom") return customDate ? 1 : 0;
      if (scheduleType === "weekly") {
        if (weeklyDays.length === 0) return 0;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + weekDuration * 7 - 1);
        return getDatesByDayNames(start, end, weeklyDays).length;
      }
      if (scheduleType === "monthly") {
        if (monthDayFilter === "custom" && monthCustomDays.length === 0)
          return 0;
        return getDatesInMonth(selectedMonth, monthDayFilter, monthCustomDays)
          .length;
      }
    } catch {
      return 0;
    }
    return 0;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <div className={styles.dashboardLayout}>
        <DoctorSidebar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p>Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar isProfileIncomplete={isProfileIncomplete} />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.title}>Manage Your Profile</h1>
              <p className={styles.subtitle}>
                Update your professional details and availability schedule
              </p>
            </div>
          </div>

          {/* Toast Notifications */}
          {successMsg && (
            <div className={styles.toast + " " + styles.toastSuccess}>
              <FiCheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className={styles.toast + " " + styles.toastError}>
              <FiX size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            {["profile", "availability"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "profile"
                  ? "Profile Information"
                  : "Availability Hours"}
              </button>
            ))}
          </div>

          {/* ── PROFILE TAB ─────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <form className={styles.form} onSubmit={handleProfileSubmit}>
              {/* Personal */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2>Personal Information</h2>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">
                      Phone Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="gender">
                      Gender <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="dateOfBirth">
                      Date of Birth <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      name="dateOfBirth"
                      value={
                        profileData.dateOfBirth
                          ? profileData.dateOfBirth.split("T")[0]
                          : ""
                      }
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2>Professional Information</h2>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Specialization <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={profileData.specialization}
                      onChange={handleProfileChange}
                      placeholder="e.g., Cardiology"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Super Specialization</label>
                    <input
                      type="text"
                      name="superSpecialization"
                      value={profileData.superSpecialization}
                      onChange={handleProfileChange}
                      placeholder="e.g., Pediatric Cardiology"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      Qualification <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={profileData.qualification}
                      onChange={handleProfileChange}
                      placeholder="e.g., MBBS, MD"
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Medical Registration No.{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="medicalRegistrationNumber"
                      value={profileData.medicalRegistrationNumber}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      Experience (Years){" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={profileData.experience}
                      onChange={handleProfileChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      Hospital Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="hospitalName"
                      value={profileData.hospitalName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Consultation Fee (₹){" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={profileData.consultationFee}
                      onChange={handleProfileChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Languages Spoken</label>
                    <input
                      type="text"
                      name="languagesSpoken"
                      value={profileData.languagesSpoken}
                      onChange={handleProfileChange}
                      placeholder="e.g., English, Hindi, Marathi"
                    />
                  </div>
                </div>
              </div>

              {/* Working Schedule */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2>Working Schedule</h2>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Working Days <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.checkboxGrid}>
                    {WORKING_DAYS.map((day) => (
                      <label key={day} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={profileData.workingDays.includes(day)}
                          onChange={() =>
                            handleProfileCheckbox("workingDays", day)
                          }
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formRow} style={{ marginTop: "20px" }}>
                  <div className={styles.formGroup}>
                    <label>
                      Start Time <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={profileData.startTime}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      End Time <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={profileData.endTime}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Preferences */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2>Consultation Preferences</h2>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Consultation Modes{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.checkboxGrid}>
                    {MODE_OPTIONS.map((mode) => (
                      <label key={mode} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={profileData.consultationModes.includes(mode)}
                          onChange={() =>
                            handleProfileCheckbox("consultationModes", mode)
                          }
                        />
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formRow} style={{ marginTop: "20px" }}>
                  <div className={styles.formGroup}>
                    <label>Short Bio</label>
                    <textarea
                      name="shortBio"
                      value={profileData.shortBio}
                      onChange={handleProfileChange}
                      placeholder="Brief introduction (max 200 characters)"
                      rows="3"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>About You</label>
                    <textarea
                      name="aboutDoctor"
                      value={profileData.aboutDoctor}
                      onChange={handleProfileChange}
                      placeholder="Write about your experience and approach to patient care"
                      rows="5"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.btnSpinner} /> Saving...
                    </>
                  ) : (
                    "Save Profile Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── AVAILABILITY TAB ─────────────────────────────────────────── */}
          {activeTab === "availability" && (
            <div className={styles.availabilityContainer}>
              {/* LEFT — Form */}
              <form
                className={styles.availabilityForm}
                onSubmit={handleAvailabilitySubmit}
              >
                {/* Schedule type selector */}
                <div className={styles.scheduleTypeSection}>
                  <p className={styles.scheduleTypeLabel}>Schedule Type</p>
                  <ScheduleTypeSelector
                    value={scheduleType}
                    onChange={(t) => {
                      setScheduleType(t);
                      setSlots([emptySlot()]);
                    }}
                  />
                </div>

                {/* ── Custom Date Form ──────────────────────────────────── */}
                {scheduleType === "custom" && (
                  <div className={styles.scheduleFormBody}>
                    <div className={styles.formSectionInner}>
                      <div className={styles.innerSectionTitle}>
                        <FiCalendar size={15} />
                        <span>Select Date</span>
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Date <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          min={toYYYYMMDD(new Date())}
                          required
                        />
                      </div>
                    </div>

                    <SlotEditor
                      slots={slots}
                      onChange={handleSlotChange}
                      onAdd={addSlot}
                      onRemove={removeSlot}
                    />
                  </div>
                )}

                {/* ── Weekly Form ───────────────────────────────────────── */}
                {scheduleType === "weekly" && (
                  <div className={styles.scheduleFormBody}>
                    <div className={styles.formSectionInner}>
                      <div className={styles.innerSectionTitle}>
                        <FiRepeat size={15} />
                        <span>Recurring Days</span>
                      </div>
                      <p className={styles.helperText}>
                        Select which days of the week you'll be available
                      </p>
                      <DayCheckboxGrid
                        selected={weeklyDays}
                        onChange={toggleWeeklyDay}
                      />
                    </div>

                    <div className={styles.formSectionInner}>
                      <div className={styles.innerSectionTitle}>
                        <FiCalendar size={15} />
                        <span>Duration</span>
                      </div>
                      <div className={styles.durationGrid}>
                        {WEEK_DURATIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles.durationChip} ${weekDuration === value ? styles.durationChipActive : ""}`}
                            onClick={() => setWeekDuration(value)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SlotEditor
                      slots={slots}
                      onChange={handleSlotChange}
                      onAdd={addSlot}
                      onRemove={removeSlot}
                    />
                  </div>
                )}

                {/* ── Monthly Form ──────────────────────────────────────── */}
                {scheduleType === "monthly" && (
                  <div className={styles.scheduleFormBody}>
                    <div className={styles.formSectionInner}>
                      <div className={styles.innerSectionTitle}>
                        <FiGrid size={15} />
                        <span>Select Month</span>
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Month <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}
                        />
                      </div>
                    </div>

                    <div className={styles.formSectionInner}>
                      <div className={styles.innerSectionTitle}>
                        <FiCalendar size={15} />
                        <span>Day Selection</span>
                      </div>
                      <div className={styles.presetGrid}>
                        {MONTH_DAY_PRESETS.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`${styles.presetChip} ${monthDayFilter === key ? styles.presetChipActive : ""}`}
                            onClick={() => {
                              setMonthDayFilter(key);
                              setMonthCustomDays([]);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {monthDayFilter === "custom" && (
                        <div style={{ marginTop: "16px" }}>
                          <p className={styles.helperText}>
                            Choose specific days
                          </p>
                          <DayCheckboxGrid
                            selected={monthCustomDays}
                            onChange={toggleMonthCustomDay}
                          />
                        </div>
                      )}
                    </div>

                    <SlotEditor
                      slots={slots}
                      onChange={handleSlotChange}
                      onAdd={addSlot}
                      onRemove={removeSlot}
                    />
                  </div>
                )}

                {/* Preview Banner */}
                {previewCount > 0 && (
                  <div className={styles.previewBanner}>
                    <FiCheckCircle size={15} />
                    <span>
                      This will create availability for{" "}
                      <strong>
                        {previewCount} day{previewCount !== 1 ? "s" : ""}
                      </strong>
                      {scheduleType === "weekly" && weeklyDays.length > 0 && (
                        <>
                          {" "}
                          — {weeklyDays
                            .map((d) => d.slice(0, 3))
                            .join(", ")}{" "}
                          for the next {weekDuration} weeks
                        </>
                      )}
                      {scheduleType === "monthly" && (
                        <>
                          {" "}
                          in{" "}
                          {new Date(selectedMonth + "-01").toLocaleDateString(
                            "en-US",
                            { month: "long", year: "numeric" },
                          )}
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || previewCount === 0}
                  >
                    {loading ? (
                      <>
                        <span className={styles.btnSpinner} /> Setting
                        Availability...
                      </>
                    ) : previewCount > 0 ? (
                      `Set Availability (${previewCount} day${previewCount !== 1 ? "s" : ""})`
                    ) : (
                      "Set Availability"
                    )}
                  </button>
                </div>
              </form>

              {/* RIGHT — Existing Availability */}
              <div className={styles.existingAvailability}>
                <div className={styles.existingHeader}>
                  <FiCheckCircle size={18} />
                  <h2>Your Existing Availability</h2>
                </div>

                {existingAvailability.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FiCalendar size={32} />
                    <p>No availability set yet.</p>
                    <span>Configure your schedule using the form.</span>
                  </div>
                ) : (
                  <div className={styles.availabilityList}>
                    {existingAvailability.map((avail) => {
                      const booked =
                        avail.slots?.filter((s) => s.isBooked).length || 0;
                      const total = avail.slots?.length || 0;
                      return (
                        <div
                          key={avail._id || Math.random()}
                          className={styles.availabilityCard}
                        >
                          <div className={styles.cardHeader}>
                            <h3>{formatDate(avail.availableDate)}</h3>
                            <div className={styles.cardMeta}>
                              {booked > 0 && (
                                <span className={styles.bookedCount}>
                                  {booked}/{total} booked
                                </span>
                              )}
                              <span
                                className={
                                  avail.isActive
                                    ? styles.activeBadge
                                    : styles.inactiveBadge
                                }
                              >
                                {avail.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.slotsDisplay}>
                            {Array.isArray(avail.slots) &&
                            avail.slots.length > 0 ? (
                              avail.slots.map((slot, i) => (
                                <div
                                  key={i}
                                  className={`${styles.slotPill} ${slot.isBooked ? styles.slotPillBooked : styles.slotPillAvailable}`}
                                >
                                  <span className={styles.slotTime}>
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                  <span className={styles.slotStatus}>
                                    {slot.isBooked ? "Booked" : "Free"}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className={styles.noSlots}>No slots</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
