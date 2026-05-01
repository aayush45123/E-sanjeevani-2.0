// src/pages/DoctorProfileEdit/DoctorProfileEdit.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorProfileEdit.module.css";
import { doctorProfileApi, doctorAvailabilityApi } from "../../utils/api";

export default function DoctorProfileEdit({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'availability'

  // Profile Form State
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

  // Availability Form State
  const [availabilityForm, setAvailabilityForm] = useState({
    availableDate: "",
    slots: [{ startTime: "", endTime: "" }],
  });

  const [existingAvailability, setExistingAvailability] = useState([]);

  const workingDayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const modeOptions = ["video", "call", "chat"];

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setFetchLoading(true);
        const response = await doctorProfileApi.getProfile();
        if (response.data.success) {
          setProfileData({
            ...response.data.profile,
            languagesSpoken: Array.isArray(
              response.data.profile.languagesSpoken,
            )
              ? response.data.profile.languagesSpoken.join(", ")
              : response.data.profile.languagesSpoken,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch availability data when availability tab is opened
  useEffect(() => {
    if (activeTab === "availability") {
      const fetchAvailability = async () => {
        try {
          const response = await doctorAvailabilityApi.getMySlots();
          if (response.data.success && response.data.availability) {
            setExistingAvailability(
              Array.isArray(response.data.availability)
                ? response.data.availability
                : [],
            );
          } else {
            setExistingAvailability([]);
          }
        } catch (error) {
          console.error("Failed to fetch availability:", error);
          setExistingAvailability([]);
        }
      };

      fetchAvailability();
    }
  }, [activeTab]);

  // ===== PROFILE HANDLERS =====
  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileCheckboxChange = (field, value) => {
    setProfileData((prev) => {
      const existing = prev[field];
      return {
        ...prev,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...profileData,
        languagesSpoken: profileData.languagesSpoken
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        experience: Number(profileData.experience),
        consultationFee: Number(profileData.consultationFee),
      };

      await doctorProfileApi.updateProfile(submitData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ===== AVAILABILITY HANDLERS =====
  const handleAvailabilityDateChange = (e) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      availableDate: e.target.value,
    }));
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...availabilityForm.slots];
    newSlots[index] = {
      ...newSlots[index],
      [field]: value,
    };
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: newSlots,
    }));
  };

  const addSlot = () => {
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: [...prev.slots, { startTime: "", endTime: "" }],
    }));
  };

  const removeSlot = (index) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!availabilityForm.availableDate) {
        alert("Please select a date");
        setLoading(false);
        return;
      }

      if (
        !availabilityForm.slots.every((slot) => slot.startTime && slot.endTime)
      ) {
        alert("Please fill all time slots");
        setLoading(false);
        return;
      }

      // Validate time slots
      for (let slot of availabilityForm.slots) {
        if (slot.startTime >= slot.endTime) {
          alert("Start time must be before end time");
          setLoading(false);
          return;
        }
      }

      await doctorAvailabilityApi.createAvailability({
        availableDate: availabilityForm.availableDate,
        slots: availabilityForm.slots,
      });

      alert("Availability set successfully!");

      // Reset form and refresh availability list
      setAvailabilityForm({
        availableDate: "",
        slots: [{ startTime: "", endTime: "" }],
      });

      // Fetch updated availability
      try {
        const response = await doctorAvailabilityApi.getMySlots();
        if (response.data.success && response.data.availability) {
          setExistingAvailability(
            Array.isArray(response.data.availability)
              ? response.data.availability
              : [],
          );
        }
      } catch (error) {
        console.error("Failed to refresh availability:", error);
      }
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to set availability");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Ensure date is in proper format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (fetchLoading) {
    return (
      <div className={styles.dashboardLayout}>
        <DoctorSidebar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <p>Loading...</p>
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
          <h1 className={styles.title}>Manage Your Profile</h1>
          <p className={styles.subtitle}>
            Update your professional details and availability hours
          </p>

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${
                activeTab === "profile" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile Information
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "availability" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("availability")}
            >
              Availability Hours
            </button>
          </div>

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <form className={styles.form} onSubmit={handleProfileSubmit}>
              <div className={styles.formSection}>
                <h2>Personal Information</h2>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
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
                    <label htmlFor="gender">Gender *</label>
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
                    <label htmlFor="dateOfBirth">Date of Birth *</label>
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

              <div className={styles.formSection}>
                <h2>Professional Information</h2>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="specialization">Specialization *</label>
                    <input
                      id="specialization"
                      type="text"
                      name="specialization"
                      value={profileData.specialization}
                      onChange={handleProfileChange}
                      placeholder="e.g., Cardiology"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="superSpecialization">
                      Super Specialization
                    </label>
                    <input
                      id="superSpecialization"
                      type="text"
                      name="superSpecialization"
                      value={profileData.superSpecialization}
                      onChange={handleProfileChange}
                      placeholder="e.g., Pediatric Cardiology"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="qualification">Qualification *</label>
                    <input
                      id="qualification"
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
                    <label htmlFor="medicalRegistrationNumber">
                      Medical Registration Number *
                    </label>
                    <input
                      id="medicalRegistrationNumber"
                      type="text"
                      name="medicalRegistrationNumber"
                      value={profileData.medicalRegistrationNumber}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="experience">Experience (Years) *</label>
                    <input
                      id="experience"
                      type="number"
                      name="experience"
                      value={profileData.experience}
                      onChange={handleProfileChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="hospitalName">Hospital Name *</label>
                    <input
                      id="hospitalName"
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
                    <label htmlFor="consultationFee">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      id="consultationFee"
                      type="number"
                      name="consultationFee"
                      value={profileData.consultationFee}
                      onChange={handleProfileChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="languagesSpoken">Languages Spoken</label>
                    <input
                      id="languagesSpoken"
                      type="text"
                      name="languagesSpoken"
                      value={profileData.languagesSpoken}
                      onChange={handleProfileChange}
                      placeholder="e.g., English, Hindi, Marathi"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h2>Working Schedule</h2>

                <div className={styles.formGroup}>
                  <label>Working Days *</label>
                  <div className={styles.checkboxGrid}>
                    {workingDayOptions.map((day) => (
                      <label key={day} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={profileData.workingDays.includes(day)}
                          onChange={() =>
                            handleProfileCheckboxChange("workingDays", day)
                          }
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="startTime">Start Time *</label>
                    <input
                      id="startTime"
                      type="time"
                      name="startTime"
                      value={profileData.startTime}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="endTime">End Time *</label>
                    <input
                      id="endTime"
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
                <h2>Consultation Preferences</h2>

                <div className={styles.formGroup}>
                  <label>Consultation Modes *</label>
                  <div className={styles.checkboxGrid}>
                    {modeOptions.map((mode) => (
                      <label key={mode} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={profileData.consultationModes.includes(mode)}
                          onChange={() =>
                            handleProfileCheckboxChange(
                              "consultationModes",
                              mode,
                            )
                          }
                        />
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="shortBio">Short Bio</label>
                    <textarea
                      id="shortBio"
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
                    <label htmlFor="aboutDoctor">About You</label>
                    <textarea
                      id="aboutDoctor"
                      name="aboutDoctor"
                      value={profileData.aboutDoctor}
                      onChange={handleProfileChange}
                      placeholder="Write about yourself, your experience, and approach to patient care"
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
                  {loading ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === "availability" && (
            <div className={styles.availabilityContainer}>
              <form className={styles.form} onSubmit={handleAvailabilitySubmit}>
                <div className={styles.formSection}>
                  <h2>Set Availability for a Specific Date</h2>

                  <div className={styles.formGroup}>
                    <label htmlFor="availableDate">Select Date *</label>
                    <input
                      id="availableDate"
                      type="date"
                      value={availabilityForm.availableDate}
                      onChange={handleAvailabilityDateChange}
                      required
                    />
                  </div>

                  <div className={styles.slotsContainer}>
                    <label>Time Slots *</label>
                    <p className={styles.slotInfo}>
                      Each slot is typically 30 minutes
                    </p>

                    {availabilityForm.slots.map((slot, index) => (
                      <div key={index} className={styles.slotRow}>
                        <div className={styles.slotGroup}>
                          <label htmlFor={`startTime-${index}`}>
                            Start Time
                          </label>
                          <input
                            id={`startTime-${index}`}
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleSlotChange(
                                index,
                                "startTime",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className={styles.slotGroup}>
                          <label htmlFor={`endTime-${index}`}>End Time</label>
                          <input
                            id={`endTime-${index}`}
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleSlotChange(index, "endTime", e.target.value)
                            }
                            required
                          />
                        </div>

                        {availabilityForm.slots.length > 1 && (
                          <button
                            type="button"
                            className={styles.removeSlotBtn}
                            onClick={() => removeSlot(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className={styles.addSlotBtn}
                      onClick={addSlot}
                    >
                      + Add Another Slot
                    </button>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                    >
                      {loading ? "Setting..." : "Set Availability"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Display existing availability */}
              <div className={styles.existingAvailability}>
                <h2>Your Existing Availability</h2>

                {existingAvailability.length === 0 ? (
                  <p className={styles.noData}>
                    No availability set yet. Create one above!
                  </p>
                ) : (
                  <div className={styles.availabilityList}>
                    {existingAvailability.map((availability) => (
                      <div
                        key={availability._id || Math.random()}
                        className={styles.availabilityCard}
                      >
                        <div className={styles.cardHeader}>
                          <h3>{formatDate(availability.availableDate)}</h3>
                          <span
                            className={
                              availability.isActive
                                ? styles.activeBadge
                                : styles.inactiveBadge
                            }
                          >
                            {availability.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className={styles.slotsDisplay}>
                          {Array.isArray(availability.slots) &&
                          availability.slots.length > 0 ? (
                            availability.slots.map((slot, idx) => (
                              <div key={idx} className={styles.slotDisplay}>
                                <span className={styles.slotTime}>
                                  {slot.startTime || "-"} -{" "}
                                  {slot.endTime || "-"}
                                </span>
                                <span
                                  className={
                                    slot.isBooked
                                      ? styles.slotBooked
                                      : styles.slotAvailable
                                  }
                                >
                                  {slot.isBooked ? "Booked" : "Available"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className={styles.noSlots}>No slots available</p>
                          )}
                        </div>
                      </div>
                    ))}
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
