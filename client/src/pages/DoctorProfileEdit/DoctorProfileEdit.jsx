// src/pages/DoctorProfileEdit/DoctorProfileEdit.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const emptySlot = () => ({ startTime: "", endTime: "" });

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScheduleTypeSelector({ value, onChange }) {
  return (
    <div className={styles.segmentedControl}>
      {SCHEDULE_TYPES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className={`${styles.segmentBtn} ${
            value === key ? styles.segmentBtnActive : ""
          }`}
          onClick={() => onChange(key)}
        >
          <Icon size={14} className={styles.segmentIcon} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function SlotEditor({ slots, onChange, onAdd, onRemove }) {
  return (
    <div className={styles.slotsWidget}>
      <div className={styles.slotsWidgetHeader}>
        <div className={styles.slotsWidgetTitle}>
          <FiClock size={15} />
          <span>Time Slots</span>
        </div>
        <span className={styles.slotBadge}>
          {slots.length} slot{slots.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.slotList}>
        {slots.map((slot, i) => (
          <div key={i} className={styles.slotRow}>
            <div className={styles.slotIndex}>{i + 1}</div>

            <div className={styles.timeInputWrapper}>
              <label>Start</label>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => onChange(i, "startTime", e.target.value)}
                required
              />
            </div>

            <div className={styles.slotDivider}>
              <div className={styles.slotDividerLine}></div>
            </div>

            <div className={styles.timeInputWrapper}>
              <label>End</label>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => onChange(i, "endTime", e.target.value)}
                required
              />
            </div>

            {slots.length > 1 ? (
              <button
                type="button"
                className={styles.removeSlotBtn}
                onClick={() => onRemove(i)}
                title="Remove slot"
              >
                <FiX size={15} />
              </button>
            ) : (
              <div className={styles.removeSlotPlaceholder} />
            )}
          </div>
        ))}
      </div>

      <button type="button" className={styles.addSlotBtn} onClick={onAdd}>
        <FiPlus size={16} />
        <span>Add Another Slot</span>
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
            className={`${styles.dayPill} ${active ? styles.dayPillActive : ""}`}
            onClick={() => onChange(day)}
          >
            {day.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorProfileEdit({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const [scheduleType, setScheduleType] = useState("custom");
  const [slots, setSlots] = useState([emptySlot()]);
  const [existingAvailability, setExistingAvailability] = useState([]);
  const [customDate, setCustomDate] = useState("");
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [weekDuration, setWeekDuration] = useState(4);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthDayFilter, setMonthDayFilter] = useState("weekdays");
  const [monthCustomDays, setMonthCustomDays] = useState([]);

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
      // Display error to user instead of silently failing
      const errorMessage =
        err?.response?.data?.message ||
        "Failed to load availability. Please complete your profile first.";
      showError(errorMessage);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "availability") fetchAvailability();
  }, [activeTab, fetchAvailability]);

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

  // Validate before switching to availability tab
  const handleTabSwitch = (tab) => {
    if (tab === "availability") {
      // Check if profile has required fields
      if (
        !profileData.specialization ||
        !profileData.qualification ||
        !profileData.hospitalName
      ) {
        showError(
          "⚠️ Please complete your profile details first before setting availability.",
        );
        return;
      }
    }
    setActiveTab(tab);
  };

  const handleSlotChange = (idx, field, val) =>
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)),
    );
  const addSlot = () => setSlots((prev) => [...prev, emptySlot()]);
  const removeSlot = (idx) =>
    setSlots((prev) => prev.filter((_, i) => i !== idx));

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

  const toggleWeeklyDay = (day) =>
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  const toggleMonthCustomDay = (day) =>
    setMonthCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

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

  if (fetchLoading) {
    return (
      <div className={styles.dashboardLayout}>
        <DoctorSidebar onLogout={handleLogout} />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p>Loading workspace...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar
        isProfileIncomplete={isProfileIncomplete}
        onLogout={handleLogout}
      />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Workspace Settings</h1>
              <p className={styles.subtitle}>
                Manage your professional identity and consultation schedule.
              </p>
            </div>
          </div>

          {/* Toast Notifications */}
          {successMsg && (
            <div className={`${styles.toast} ${styles.toastSuccess}`}>
              <FiCheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className={`${styles.toast} ${styles.toastError}`}>
              <FiX size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Master Tabs (Segmented Control) */}
          <div className={styles.masterTabsWrapper}>
            <div className={styles.masterTabs}>
              {["profile", "availability"].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTabBtn : ""}`}
                  onClick={() => handleTabSwitch(tab)}
                >
                  {tab === "profile"
                    ? "Profile Details"
                    : "Availability Engine"}
                </button>
              ))}
            </div>
          </div>

          {/* ── PROFILE TAB ─────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <form className={styles.saasCard} onSubmit={handleProfileSubmit}>
              <div className={styles.formSection}>
                <h2 className={styles.sectionHeading}>Personal Information</h2>
                <div className={styles.formGridRow}>
                  <div className={styles.inputBox}>
                    <label>
                      Phone Number <span className={styles.asterisk}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      required
                      placeholder="+91"
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>
                      Gender <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
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
                  </div>
                  <div className={styles.inputBox}>
                    <label>
                      Date of Birth <span className={styles.asterisk}>*</span>
                    </label>
                    <input
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

              <div className={styles.formSection}>
                <h2 className={styles.sectionHeading}>
                  Professional Credentials
                </h2>
                <div className={styles.formGridRow}>
                  <div className={styles.inputBox}>
                    <label>
                      Specialization <span className={styles.asterisk}>*</span>
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
                  <div className={styles.inputBox}>
                    <label>Super Specialization</label>
                    <input
                      type="text"
                      name="superSpecialization"
                      value={profileData.superSpecialization}
                      onChange={handleProfileChange}
                      placeholder="e.g., Pediatric Cardiology"
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>
                      Qualification <span className={styles.asterisk}>*</span>
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
                <div className={styles.formGridRow}>
                  <div className={styles.inputBox}>
                    <label>
                      Medical Reg. No.{" "}
                      <span className={styles.asterisk}>*</span>
                    </label>
                    <input
                      type="text"
                      name="medicalRegistrationNumber"
                      value={profileData.medicalRegistrationNumber}
                      onChange={handleProfileChange}
                      required
                      placeholder="State Medical Council Reg"
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>
                      Experience (Years){" "}
                      <span className={styles.asterisk}>*</span>
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
                  <div className={styles.inputBox}>
                    <label>
                      Hospital Name <span className={styles.asterisk}>*</span>
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
                <div className={styles.formGridRow}>
                  <div className={styles.inputBox}>
                    <label>
                      Consultation Fee (₹){" "}
                      <span className={styles.asterisk}>*</span>
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={profileData.consultationFee}
                      onChange={handleProfileChange}
                      min="0"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>Languages Spoken</label>
                    <input
                      type="text"
                      name="languagesSpoken"
                      value={profileData.languagesSpoken}
                      onChange={handleProfileChange}
                      placeholder="English, Hindi, Marathi"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h2 className={styles.sectionHeading}>
                  Standard Operating Hours
                </h2>
                <div className={styles.inputBox}>
                  <label>
                    Working Days <span className={styles.asterisk}>*</span>
                  </label>
                  <div className={styles.checkboxPillGroup}>
                    {WORKING_DAYS.map((day) => (
                      <label key={day} className={styles.checkboxPill}>
                        <input
                          type="checkbox"
                          checked={profileData.workingDays.includes(day)}
                          onChange={() =>
                            handleProfileCheckbox("workingDays", day)
                          }
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div
                  className={styles.formGridRow}
                  style={{ marginTop: "24px", maxWidth: "500px" }}
                >
                  <div className={styles.inputBox}>
                    <label>
                      Start Time <span className={styles.asterisk}>*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={profileData.startTime}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>
                      End Time <span className={styles.asterisk}>*</span>
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

              <div className={styles.formSection}>
                <h2 className={styles.sectionHeading}>Practice Details</h2>
                <div className={styles.inputBox}>
                  <label>
                    Consultation Modes{" "}
                    <span className={styles.asterisk}>*</span>
                  </label>
                  <div className={styles.checkboxPillGroup}>
                    {MODE_OPTIONS.map((mode) => (
                      <label key={mode} className={styles.checkboxPill}>
                        <input
                          type="checkbox"
                          checked={profileData.consultationModes.includes(mode)}
                          onChange={() =>
                            handleProfileCheckbox("consultationModes", mode)
                          }
                        />
                        <span>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div
                  className={styles.formGridRow}
                  style={{ marginTop: "24px" }}
                >
                  <div className={styles.inputBox}>
                    <label>Short Bio</label>
                    <textarea
                      name="shortBio"
                      value={profileData.shortBio}
                      onChange={handleProfileChange}
                      placeholder="Write a brief 1-2 sentence hook for patients..."
                      rows="2"
                    />
                  </div>
                </div>
                <div className={styles.formGridRow}>
                  <div className={styles.inputBox}>
                    <label>About You</label>
                    <textarea
                      name="aboutDoctor"
                      value={profileData.aboutDoctor}
                      onChange={handleProfileChange}
                      placeholder="Detail your background, approach to care, and specific treatments..."
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.btnSpinner} /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── AVAILABILITY TAB ─────────────────────────────────────────── */}
          {activeTab === "availability" && (
            <div className={styles.splitLayout}>
              {/* LEFT — Builder */}
              <form
                className={styles.saasCard}
                onSubmit={handleAvailabilitySubmit}
              >
                <div className={styles.cardHeaderArea}>
                  <h2 className={styles.cardTitle}>Schedule Builder</h2>
                  <p className={styles.cardSub}>
                    Generate booking slots for your patients.
                  </p>
                </div>

                <div className={styles.builderBody}>
                  <div className={styles.configBlock}>
                    <label className={styles.blockLabel}>
                      Distribution Pattern
                    </label>
                    <ScheduleTypeSelector
                      value={scheduleType}
                      onChange={(t) => {
                        setScheduleType(t);
                        setSlots([emptySlot()]);
                      }}
                    />
                  </div>

                  {scheduleType === "custom" && (
                    <div className={styles.configBlock}>
                      <label className={styles.blockLabel}>Target Date</label>
                      <input
                        type="date"
                        className={styles.standaloneInput}
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={toYYYYMMDD(new Date())}
                        required
                      />
                    </div>
                  )}

                  {scheduleType === "weekly" && (
                    <>
                      <div className={styles.configBlock}>
                        <label className={styles.blockLabel}>
                          Recurring Days
                        </label>
                        <DayCheckboxGrid
                          selected={weeklyDays}
                          onChange={toggleWeeklyDay}
                        />
                      </div>
                      <div className={styles.configBlock}>
                        <label className={styles.blockLabel}>
                          Rollout Duration
                        </label>
                        <div className={styles.presetGrid}>
                          {WEEK_DURATIONS.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              className={`${styles.presetBtn} ${weekDuration === value ? styles.presetBtnActive : ""}`}
                              onClick={() => setWeekDuration(value)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {scheduleType === "monthly" && (
                    <>
                      <div className={styles.configBlock}>
                        <label className={styles.blockLabel}>
                          Target Month
                        </label>
                        <input
                          type="month"
                          className={styles.standaloneInput}
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}
                        />
                      </div>
                      <div className={styles.configBlock}>
                        <label className={styles.blockLabel}>Day Filters</label>
                        <div className={styles.presetGrid}>
                          {MONTH_DAY_PRESETS.map(({ key, label }) => (
                            <button
                              key={key}
                              type="button"
                              className={`${styles.presetBtn} ${monthDayFilter === key ? styles.presetBtnActive : ""}`}
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
                          <div style={{ marginTop: "12px" }}>
                            <DayCheckboxGrid
                              selected={monthCustomDays}
                              onChange={toggleMonthCustomDay}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Enhanced Slot Editor */}
                  <div className={styles.configBlock}>
                    <SlotEditor
                      slots={slots}
                      onChange={handleSlotChange}
                      onAdd={addSlot}
                      onRemove={removeSlot}
                    />
                  </div>

                  {previewCount > 0 && (
                    <div className={styles.summaryBanner}>
                      <div className={styles.bannerIcon}>
                        <FiCheckCircle size={16} />
                      </div>
                      <div className={styles.bannerText}>
                        Generating slots for{" "}
                        <strong>
                          {previewCount} day{previewCount !== 1 ? "s" : ""}
                        </strong>
                        .
                        {scheduleType === "weekly" &&
                          weeklyDays.length > 0 &&
                          ` Rolling out over ${weekDuration} weeks.`}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formFooter}>
                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={loading || previewCount === 0}
                    style={{ width: "100%" }}
                  >
                    {loading ? (
                      <>
                        <span className={styles.btnSpinner} /> Compiling...
                      </>
                    ) : previewCount > 0 ? (
                      `Publish ${previewCount} Day${previewCount !== 1 ? "s" : ""}`
                    ) : (
                      "Publish Schedule"
                    )}
                  </button>
                </div>
              </form>

              {/* RIGHT — Active Overview */}
              <div className={styles.overviewSidebar}>
                <div className={styles.sidebarHeader}>
                  <h2 className={styles.sidebarTitle}>Active Roster</h2>
                  <div className={styles.pulseDot}></div>
                </div>

                {existingAvailability.length === 0 ? (
                  <div className={styles.emptyBoard}>
                    <FiCalendar size={28} />
                    <p>Your calendar is clear.</p>
                    <span>Use the builder to add working hours.</span>
                  </div>
                ) : (
                  <div className={styles.timelineList}>
                    {existingAvailability.map((avail) => {
                      const booked =
                        avail.slots?.filter((s) => s.isBooked).length || 0;
                      const total = avail.slots?.length || 0;
                      return (
                        <div
                          key={avail._id || Math.random()}
                          className={styles.timelineCard}
                        >
                          <div className={styles.tCardHeader}>
                            <h3>{formatDate(avail.availableDate)}</h3>
                            <div className={styles.tCardBadges}>
                              {booked > 0 && (
                                <span className={styles.badgeWarning}>
                                  {booked}/{total} Booked
                                </span>
                              )}
                              <span
                                className={
                                  avail.isActive
                                    ? styles.badgeSuccess
                                    : styles.badgeMuted
                                }
                              >
                                {avail.isActive ? "Live" : "Draft"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.tCardBody}>
                            {Array.isArray(avail.slots) &&
                            avail.slots.length > 0 ? (
                              avail.slots.map((slot, i) => (
                                <div
                                  key={i}
                                  className={`${styles.microSlot} ${slot.isBooked ? styles.microSlotBooked : styles.microSlotFree}`}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </div>
                              ))
                            ) : (
                              <span className={styles.noSlotsText}>
                                Empty Configuration
                              </span>
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
