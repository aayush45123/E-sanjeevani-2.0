// FULL UPDATED ProfileCompletion.jsx
// Industry-level profile page with:
// - sidebar always visible
// - no auto redirect loop
// - edit button first
// - save button only after edit
// - professional patient profile UX

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./ProfileCompletion.module.css";
import { apiClient } from "../../utils/api";

const initialFormState = {
  age: "",
  gender: "",
  bloodGroup: "",
  maritalStatus: "",

  height: "",
  weight: "",
  bloodPressure: "",

  smoking: "",
  alcohol: "",
  diet: "",
  exercise: "",

  allergies: "",
  chronicConditions: "",
  currentMedications: "",
  pastSurgeries: "",
};

const ProfileCompletion = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormState);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
  IMPORTANT:
  Existing users should first see VIEW mode
  not edit mode
  */
  const [isEditMode, setIsEditMode] = useState(false);

  const [isProfileComplete, setIsProfileComplete] = useState(false);

  /*
  ==================================================
  FETCH PROFILE
  ==================================================
  */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/patient/profile");

        const profile = response.data?.data?.profile || null;

        const complete = response.data?.data?.isProfileComplete || false;

        if (profile) {
          setFormData({
            ...initialFormState,
            ...profile,
          });
        }

        setIsProfileComplete(complete);

        /*
        FIX:
        Always start in VIEW mode
        */
        setIsEditMode(false);
      } catch (error) {
        console.error("Profile fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /*
  ==================================================
  INPUT CHANGE
  ==================================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  ==================================================
  EDIT BUTTON
  ==================================================
  */

  const handleEdit = () => {
    setIsEditMode(true);
  };

  /*
  ==================================================
  SAVE PROFILE
  ==================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await apiClient.patch("/patient/profile", formData);

      setIsEditMode(false);
      setIsProfileComplete(true);

      /*
      Important:
      refresh dashboard lock state
      */
      window.dispatchEvent(new Event("profileUpdated"));

      alert("Profile saved successfully");
    } catch (error) {
      console.error("Profile save failed:", error);

      alert(error?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar />
        <div className={styles.contentArea}>
          <div className={styles.loadingBox}>Loading profile...</div>
        </div>
      </div>
    );
  }

  /*
  ==================================================
  UI
  ==================================================
  */

  return (
    <div className={styles.pageLayout}>
      <Sidebar />

      <div className={styles.contentArea}>
        <div className={styles.profileCard}>
          <div className={styles.header}>
            <div>
              <h1>Patient Profile</h1>
              <p>Manage your medical information professionally and securely</p>
            </div>

            {!isEditMode && (
              <button className={styles.editButton} onClick={handleEdit}>
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.formGrid}>
            {/* PERSONAL */}

            <h2 className={styles.sectionTitle}>Personal Details</h2>

            <input
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <input
              name="bloodGroup"
              placeholder="Blood Group"
              value={formData.bloodGroup}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="maritalStatus"
              placeholder="Marital Status"
              value={formData.maritalStatus}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            {/* PHYSICAL */}

            <h2 className={styles.sectionTitle}>Physical Vitals</h2>

            <input
              name="height"
              placeholder="Height"
              value={formData.height}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="weight"
              placeholder="Weight"
              value={formData.weight}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="bloodPressure"
              placeholder="Blood Pressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            {/* LIFESTYLE */}

            <h2 className={styles.sectionTitle}>Lifestyle</h2>

            <input
              name="smoking"
              placeholder="Smoking"
              value={formData.smoking}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="alcohol"
              placeholder="Alcohol"
              value={formData.alcohol}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="diet"
              placeholder="Diet"
              value={formData.diet}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              name="exercise"
              placeholder="Exercise"
              value={formData.exercise}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            {/* MEDICAL */}

            <h2 className={styles.sectionTitle}>Medical History</h2>

            <textarea
              name="allergies"
              placeholder="Allergies"
              value={formData.allergies}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <textarea
              name="chronicConditions"
              placeholder="Chronic Conditions"
              value={formData.chronicConditions}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <textarea
              name="currentMedications"
              placeholder="Current Medications"
              value={formData.currentMedications}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <textarea
              name="pastSurgeries"
              placeholder="Past Surgeries"
              value={formData.pastSurgeries}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            {/* SAVE BUTTON ONLY IN EDIT MODE */}

            {isEditMode && (
              <div className={styles.submitRow}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
