// src/pages/DoctorProfileSetup/DoctorProfileSetup.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorProfileSetup.module.css";
import { doctorProfileApi } from "../../utils/api";

export default function DoctorProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const existing = prev[field];

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

      alert("Doctor profile completed successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to save doctor profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>Complete Doctor Profile</h1>
          <p className={styles.subtitle}>
            Complete your professional details before accessing the dashboard
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
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
                label="Years of Experience"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleChange}
                required
              />

              <Input
                label="Hospital / Clinic Name"
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
                label="Languages Spoken (comma separated)"
                name="languagesSpoken"
                value={formData.languagesSpoken}
                onChange={handleChange}
                required
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

            <div className={styles.checkboxSection}>
              <h3>Working Days</h3>
              <div className={styles.checkboxGrid}>
                {workingDayOptions.map((day) => (
                  <label key={day}>
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

            <div className={styles.checkboxSection}>
              <h3>Consultation Modes</h3>
              <div className={styles.checkboxGrid}>
                {modeOptions.map((mode) => (
                  <label key={mode}>
                    <input
                      type="checkbox"
                      checked={formData.consultationModes.includes(mode)}
                      onChange={() =>
                        handleCheckboxChange("consultationModes", mode)
                      }
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            <TextArea
              label="About Doctor"
              name="aboutDoctor"
              value={formData.aboutDoctor}
              onChange={handleChange}
            />

            <TextArea
              label="Short Bio"
              name="shortBio"
              value={formData.shortBio}
              onChange={handleChange}
            />

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </main>
    </div>
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

function TextArea({ label, ...props }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <textarea {...props} />
    </div>
  );
}
