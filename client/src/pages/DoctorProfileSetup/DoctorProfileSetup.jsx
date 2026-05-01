// src/pages/DoctorProfileSetup/DoctorProfileSetup.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiCheck } from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorProfileSetup.module.css";
import { doctorProfileApi } from "../../utils/api";

export default function DoctorProfileSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
      try {
        const response = await doctorProfileApi.getProfile();

        if (response?.data?.doctor) {
          const doc = response.data.doctor;

          setFormData({
            phone: doc.phone || "",
            gender: doc.gender || "",
            dateOfBirth: doc.dateOfBirth || "",
            specialization: doc.specialization || "",
            superSpecialization: doc.superSpecialization || "",
            qualification: doc.qualification || "",
            medicalRegistrationNumber: doc.medicalRegistrationNumber || "",
            experience: doc.experience || "",
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
          });

          const isComplete =
            !!doc.phone &&
            !!doc.specialization &&
            !!doc.qualification &&
            !!doc.experience;

          setIsProfileComplete(isComplete);
          setIsEditMode(!isComplete);

          if (isComplete) {
            localStorage.setItem("doctorProfileCompleted", "true");
          }
        } else {
          setIsEditMode(true);
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        setIsEditMode(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await doctorProfileApi.createProfile({
        ...formData,
        languagesSpoken: formData.languagesSpoken
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        experience: Number(formData.experience),
        consultationFee: Number(formData.consultationFee),
      });

      alert("Doctor profile saved successfully!");

      localStorage.setItem("doctorProfileCompleted", "true");
      window.dispatchEvent(new Event("profileUpdated"));

      setIsProfileComplete(true);
      setIsEditMode(false);

      setTimeout(() => {
        navigate("/dashboard");
      }, 200);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to save doctor profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
  };

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h1 className={styles.title}>Doctor Profile</h1>

              {isProfileComplete && (
                <div className={styles.completeBadge}>
                  <FiCheck size={16} />
                  <span>Complete</span>
                </div>
              )}
            </div>

            <p className={styles.subtitle}>
              {isEditMode
                ? "Update your professional details"
                : "Your professional information"}
            </p>
          </div>

          {isProfileComplete && !isEditMode ? (
            <ViewMode formData={formData} onEdit={handleEditClick} />
          ) : (
            <EditForm
              formData={formData}
              handleChange={handleChange}
              handleCheckboxChange={handleCheckboxChange}
              handleSubmit={handleSubmit}
              loading={loading}
              isProfileComplete={isProfileComplete}
              onCancel={handleCancelClick}
              workingDayOptions={workingDayOptions}
              modeOptions={modeOptions}
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
  handleSubmit,
  loading,
  isProfileComplete,
  onCancel,
  workingDayOptions,
  modeOptions,
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
          label="Qualification"
          name="qualification"
          value={formData.qualification}
          onChange={handleChange}
          required
        />

        <Input
          label="Experience"
          name="experience"
          type="number"
          value={formData.experience}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.buttonGroup}>
        {isProfileComplete && (
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
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
