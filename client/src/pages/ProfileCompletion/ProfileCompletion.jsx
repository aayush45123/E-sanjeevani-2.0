// FULL FINAL UPDATED ProfileCompletion.jsx
// Industry-level professional version
// Fixed:
// - 400 validation error
// - enum mismatch
// - edit mode flow
// - sidebar persistent
// - proper select dropdowns
// - save only after edit
// - no redirect loop

import React, { useEffect, useState } from "react";
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
  const [formData, setFormData] = useState(initialFormState);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
  Existing users first see VIEW mode
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
        const complete =
          response.data?.data?.isProfileComplete || false;

        if (profile) {
          setFormData({
            ...initialFormState,
            ...profile,
          });
        }

        setIsProfileComplete(complete);

        /*
        Always start in view mode
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
  HANDLE CHANGE
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
  EDIT MODE
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
      Refresh dashboard lock state
      */
      window.dispatchEvent(new Event("profileUpdated"));

      alert("Profile saved successfully");
    } catch (error) {
      console.error("Profile save failed:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ==================================================
  LOADING UI
  ==================================================
  */

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar />
        <div className={styles.contentArea}>
          <div className={styles.loadingBox}>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  /*
  ==================================================
  MAIN UI
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
              <p>
                Manage your medical information
                professionally and securely
              </p>
            </div>

            {!isEditMode && (
              <button
                className={styles.editButton}
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className={styles.formGrid}
          >
            {/* ===================================== */}
            {/* PERSONAL DETAILS */}
            {/* ===================================== */}

            <h2 className={styles.sectionTitle}>
              Personal Details
            </h2>

            <input
              type="number"
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
              <option value="Male">
                Male
              </option>
              <option value="Female">
                Female
              </option>
              <option value="Other">
                Other
              </option>
            </select>

            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Blood Group
              </option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Marital Status
              </option>
              <option value="Single">
                Single
              </option>
              <option value="Married">
                Married
              </option>
              <option value="Divorced">
                Divorced
              </option>
            </select>

            {/* ===================================== */}
            {/* PHYSICAL VITALS */}
            {/* ===================================== */}

            <h2 className={styles.sectionTitle}>
              Physical Vitals
            </h2>

            <input
              type="number"
              name="height"
              placeholder="Height (cm)"
              value={formData.height}
              onChange={handleChange}
              disabled={!isEditMode}
            />

            <input
              type="number"
              name="weight"
              placeholder="Weight (kg)"
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

            {/* ===================================== */}
            {/* LIFESTYLE */}
            {/* ===================================== */}

            <h2 className={styles.sectionTitle}>
              Lifestyle
            </h2>

            <select
              name="smoking"
              value={formData.smoking}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Smoking
              </option>
              <option value="Yes">
                Yes
              </option>
              <option value="No">
                No
              </option>
            </select>

            <select
              name="alcohol"
              value={formData.alcohol}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Alcohol
              </option>
              <option value="Yes">
                Yes
              </option>
              <option value="No">
                No
              </option>
            </select>

            <select
              name="diet"
              value={formData.diet}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Diet
              </option>
              <option value="Vegetarian">
                Vegetarian
              </option>
              <option value="Non-Vegetarian">
                Non-Vegetarian
              </option>
              <option value="Vegan">
                Vegan
              </option>
            </select>

            <select
              name="exercise"
              value={formData.exercise}
              onChange={handleChange}
              disabled={!isEditMode}
            >
              <option value="">
                Exercise
              </option>
              <option value="Daily">
                Daily
              </option>
              <option value="Weekly">
                Weekly
              </option>
              <option value="Rarely">
                Rarely
              </option>
              <option value="Never">
                Never
              </option>
            </select>

            {/* ===================================== */}
            {/* MEDICAL HISTORY */}
            {/* ===================================== */}

            <h2 className={styles.sectionTitle}>
              Medical History
            </h2>

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

            {/* ===================================== */}
            {/* SAVE BUTTON */}
            {/* ===================================== */}

            {isEditMode && (
              <div className={styles.submitRow}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
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
