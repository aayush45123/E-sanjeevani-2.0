// src/pages/DoctorProfileSetup/DoctorProfileSetup.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiCheck } from "react-icons/fi";
import { DoctorProfileSetupSkeleton } from "../../components/Skeletons";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import AddressInput from "../../components/AddressInput/AddressInput";
import styles from "./DoctorProfileSetup.module.css";
import { doctorProfileApi, doctorAvailabilityApi } from "../../utils/api";
import { performLogout } from "../../utils/auth";

export default function DoctorProfileSetup({ isProfileIncomplete = true }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAvailabilitySection, setShowAvailabilitySection] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    availableDate: "",
    slots: [{ startTime: "", endTime: "" }],
  });

  const [formData, setFormData] = useState({
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
    hasClinic: false,
    clinicAddress: {
      apartment: "",
      street: "",
      district: "",
      city: "",
      pinCode: "",
      state: "",
    },
    clinicCoordinates: {},
  });

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

  useEffect(() => {
    const fetchProfile = async () => {
      const role = localStorage.getItem("userRole");
      if (role !== "doctor") return;

      try {
        const response = await doctorProfileApi.getProfile();

        const doc = response?.data?.profile || response?.data?.doctor;

        if (doc) {
          setFormData({
            phone: doc.phone || "",
            gender: doc.gender || "",
            dateOfBirth: doc.dateOfBirth ? String(doc.dateOfBirth).slice(0, 10) : "",
            specialization: doc.specialization || "",
            superSpecialization: doc.superSpecialization || "",
            qualification: doc.qualification || "",
            medicalRegistrationNumber: doc.medicalRegistrationNumber || "",
            experience: doc.experience !== undefined && doc.experience !== null ? doc.experience : "",
            hospitalName: doc.hospitalName || "",
            consultationFee: doc.consultationFee || "",
            languagesSpoken: Array.isArray(doc.languagesSpoken)
              ? doc.languagesSpoken.join(", ")
              : doc.languagesSpoken || "",
            workingDays: doc.workingDays || [],
            startTime: doc.startTime || "",
            endTime: doc.endTime || "",
            consultationModes: doc.consultationModes || [],
            aboutDoctor: doc.aboutDoctor || "",
            shortBio: doc.shortBio || "",
            hasClinic: doc.hasClinic || false,
            clinicAddress: doc.clinicAddress || {
              apartment: "",
              street: "",
              district: "",
              city: "",
              pinCode: "",
              state: "",
            },
            clinicCoordinates: doc.clinicCoordinates || {},
          });

          const isComplete =
            doc.profileCompleted === true ||
            (!!doc.phone &&
              !!doc.specialization &&
              !!doc.qualification &&
              doc.experience !== "" &&
              doc.experience !== undefined &&
              doc.experience !== null);

          setIsProfileComplete(isComplete);
          setIsEditMode(!isComplete);

          if (isComplete) {
            localStorage.setItem("doctorProfileCompleted", "true");
            // Redirect doctors who already have a complete profile back to dashboard
            navigate("/dashboard", { replace: true });
            return;
          }
        } else {
          setIsEditMode(true);
        }
      } catch (error) {
        if (error?.response?.status !== 403 && error?.response?.status !== 404) {
          console.error("Fetch profile error:", error);
        }
        setIsEditMode(true);
      } finally {
        setProfileChecked(true);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const existing = prev[field] || [];

      return {
        ...prev,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const handleHasClinicToggle = (e) => {
    setFormData((prev) => ({
      ...prev,
      hasClinic: e.target.checked,
    }));
  };

  const handleClinicAddressChange = (address, coordinates) => {
    setFormData((prev) => ({
      ...prev,
      clinicAddress: address,
      clinicCoordinates: coordinates,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        languagesSpoken: formData.languagesSpoken
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        experience: Number(formData.experience),
        consultationFee: Number(formData.consultationFee),
      };

      // Add clinic coordinates if clinic is enabled
      if (formData.hasClinic) {
        submitData.clinicLatitude = formData.clinicCoordinates.latitude;
        submitData.clinicLongitude = formData.clinicCoordinates.longitude;
      }

      await doctorProfileApi.createProfile(submitData);

      alert("Doctor profile saved successfully!");

      setIsProfileComplete(true);
      setIsEditMode(false);
      setShowAvailabilitySection(true);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to save doctor profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCompletionStep = () => {
    setIsProfileComplete(true);
    setIsEditMode(false);
    setShowAvailabilitySection(true);
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    setAvailabilityLoading(true);

    try {
      await doctorAvailabilityApi.createAvailability({
        availableDate: availabilityForm.availableDate,
        slots: availabilityForm.slots,
      });

      alert("Availability set successfully!");

      localStorage.setItem("doctorProfileCompleted", "true");
      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message || "Failed to set availability hours",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
  };

  const handleLogout = () => performLogout();

  if (!profileChecked) {
    return <DoctorProfileSetupSkeleton />;
  }

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar
        isProfileIncomplete={!isProfileComplete}
        onLogout={handleLogout}
      />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h1 className={styles.title}>
                {showAvailabilitySection
                  ? "Set Availability Hours"
                  : "Complete Your Profile"}
              </h1>

              {isProfileComplete && !showAvailabilitySection && (
                <div className={styles.completeBadge}>
                  <FiCheck size={16} />
                  <span>Profile Complete</span>
                </div>
              )}
            </div>

            <p className={styles.subtitle}>
              {showAvailabilitySection
                ? "Set your working hours and consultation availability"
                : isEditMode
                  ? "Please fill in all your professional details"
                  : "Your professional information"}
            </p>
          </div>

          {!showAvailabilitySection ? (
            <>
              {isProfileComplete && !isEditMode ? (
                <ViewMode formData={formData} onEdit={handleEditClick} />
              ) : (
                <EditForm
                  formData={formData}
                  handleChange={handleChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleHasClinicToggle={handleHasClinicToggle}
                  handleClinicAddressChange={handleClinicAddressChange}
                  handleSubmit={handleProfileSubmit}
                  loading={loading}
                  isProfileComplete={isProfileComplete}
                  onCancel={handleCancelClick}
                  workingDayOptions={workingDayOptions}
                  modeOptions={modeOptions}
                  onProfileComplete={handleProfileCompletionStep}
                />
              )}
            </>
          ) : (
            <AvailabilitySection
              availabilityForm={availabilityForm}
              setAvailabilityForm={setAvailabilityForm}
              loading={availabilityLoading}
              onSubmit={handleAvailabilitySubmit}
              formData={formData}
              workingDayOptions={workingDayOptions}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ViewMode({ formData, onEdit }) {
  return (
    <div className={styles.viewMode}>
      <button className={styles.editBtn} onClick={onEdit}>
        <FiEdit2 size={16} />
        Edit Profile
      </button>

      <div className={styles.grid}>
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className={styles.formGroup}>
            <label>{key}</label>
            <p>{Array.isArray(value) ? value.join(", ") : value || "-"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditForm({
  formData,
  handleChange,
  handleCheckboxChange,
  handleHasClinicToggle,
  handleClinicAddressChange,
  handleSubmit,
  loading,
  isProfileComplete,
  onCancel,
  workingDayOptions,
  modeOptions,
  onProfileComplete,
}) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <Input
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <Select
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          options={["male", "female", "other"]}
          required
        />

        <Input
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />

        <Input
          label="Specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
        />

        <Input
          label="Super Specialization"
          name="superSpecialization"
          value={formData.superSpecialization}
          onChange={handleChange}
        />

        <Input
          label="Qualification"
          name="qualification"
          value={formData.qualification}
          onChange={handleChange}
          required
        />

        <Input
          label="Medical Registration Number"
          name="medicalRegistrationNumber"
          value={formData.medicalRegistrationNumber}
          onChange={handleChange}
          required
        />

        <Input
          label="Experience (years)"
          name="experience"
          type="number"
          value={formData.experience}
          onChange={handleChange}
          required
        />

        <Input
          label="Hospital Name"
          name="hospitalName"
          value={formData.hospitalName}
          onChange={handleChange}
          required
        />

        <Input
          label="Consultation Fee"
          name="consultationFee"
          type="number"
          value={formData.consultationFee}
          onChange={handleChange}
          required
        />

        <Input
          label="Languages Spoken"
          name="languagesSpoken"
          value={formData.languagesSpoken}
          onChange={handleChange}
          placeholder="e.g., English, Hindi, Bengali"
        />

        <Input
          label="About Doctor"
          name="aboutDoctor"
          value={formData.aboutDoctor}
          onChange={handleChange}
          placeholder="Brief description"
        />

        <Input
          label="Short Bio"
          name="shortBio"
          value={formData.shortBio}
          onChange={handleChange}
        />

        <Input
          label="Start Time"
          name="startTime"
          type="time"
          value={formData.startTime}
          onChange={handleChange}
          required
        />

        <Input
          label="End Time"
          name="endTime"
          type="time"
          value={formData.endTime}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.checkboxGroup}>
        <label>Working Days</label>
        <div className={styles.checkboxList}>
          {workingDayOptions.map((day) => (
            <label key={day} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.workingDays.includes(day)}
                onChange={() => handleCheckboxChange("workingDays", day)}
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.checkboxGroup}>
        <label>Consultation Modes</label>
        <div className={styles.checkboxList}>
          {modeOptions.map((mode) => (
            <label key={mode} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.consultationModes.includes(mode)}
                onChange={() => handleCheckboxChange("consultationModes", mode)}
              />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* ===================================== */}
      {/* CLINIC INFORMATION */}
      {/* ===================================== */}
      <div className={styles.sectionDivider}></div>

      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "12px",
          }}
        >
          Clinic Location (Optional but Recommended)
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
            lineHeight: "1.5",
          }}
        >
          📍 Help patients find you! When you enable clinic location, your
          profile will appear in location-based searches. Patients can filter
          doctors by proximity to find nearby medical professionals.
        </p>
      </div>

      <div className={styles.clinicSection}>
        <label className={styles.clinicCheckboxLabel}>
          <input
            type="checkbox"
            checked={formData.hasClinic}
            onChange={handleHasClinicToggle}
          />
          <span>I have a clinic with a physical address</span>
        </label>
      </div>

      {formData.hasClinic && (
        <div style={{ marginTop: "24px" }}>
          <AddressInput
            label="Clinic Address"
            address={formData.clinicAddress}
            coordinates={formData.clinicCoordinates}
            onChange={handleClinicAddressChange}
            showGeolocation={true}
            required={false}
          />
        </div>
      )}

      <div className={styles.buttonGroup}>
        {isProfileComplete && (
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Continue to Availability →"}
        </button>
      </div>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <select {...props}>
        <option value="">Select</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function AvailabilitySection({
  availabilityForm,
  setAvailabilityForm,
  loading,
  onSubmit,
  formData,
  workingDayOptions,
}) {
  const handleAddSlot = () => {
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: [...prev.slots, { startTime: "", endTime: "" }],
    }));
  };

  const handleSlotChange = (index, field, value) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: prev.slots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      ),
    }));
  };

  const handleRemoveSlot = (index) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const handleSkipAvailability = () => {
    if (
      confirm(
        "You can set availability hours later. Are you sure you want to skip?",
      )
    ) {
      localStorage.setItem("doctorProfileCompleted", "true");
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className={styles.availabilitySection}>
      <div className={styles.availabilityInfo}>
        <p>
          📅 <strong>Optional:</strong> Set your first availability to help
          patients book consultations faster.
        </p>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Select Date *</label>
          <input
            type="date"
            value={availabilityForm.availableDate}
            onChange={(e) =>
              setAvailabilityForm((prev) => ({
                ...prev,
                availableDate: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className={styles.slotsContainer}>
          <label>Time Slots (30-minute intervals)</label>
          {availabilityForm.slots.map((slot, index) => (
            <div key={index} className={styles.slotRow}>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  handleSlotChange(index, "startTime", e.target.value)
                }
                placeholder="Start Time"
                required
              />
              <span className={styles.separator}>-</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  handleSlotChange(index, "endTime", e.target.value)
                }
                placeholder="End Time"
                required
              />
              {availabilityForm.slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(index)}
                  className={styles.removeSlotBtn}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSlot}
            className={styles.addSlotBtn}
          >
            + Add Another Slot
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={handleSkipAvailability}
            className={styles.skipBtn}
          >
            Skip & Continue
          </button>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : "Save & Complete Setup"}
          </button>
        </div>
      </form>
    </div>
  );
}
