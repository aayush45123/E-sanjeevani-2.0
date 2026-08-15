// FULL FINAL UPDATED ProfileCompletion.jsx
// Minimalist, polished SaaS design (e.g. Vercel, Linear style)
// FOR PATIENTS ONLY - Medical history, vitals, lifestyle, address
// Doctors should use DoctorProfileSetup instead

import React, { useEffect, useState } from "react";
import { ProfileCompletionSkeleton } from "../../components/Skeletons";
import Sidebar from "../../components/Sidebar/Sidebar";
import AddressInput from "../../components/AddressInput/AddressInput";
import styles from "./ProfileCompletion.module.css";
import { apiClient, authApi } from "../../utils/api";
import { useNavigate } from "react-router-dom";

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

  patientAddress: {
    apartment: "",
    street: "",
    district: "",
    city: "",
    pinCode: "",
    state: "",
  },
  patientCoordinates: {},
};

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

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
            patientAddress:
              profile.patientAddress || initialFormState.patientAddress,
            patientCoordinates: profile.patientCoordinates || {},
          });
          setHasProfile(true); // NEW — profile exists, use PATCH later
          setIsEditMode(false);
        } else {
          setHasProfile(false); // NEW — no profile yet, use POST later
          setIsEditMode(true); // NEW — put a new user straight into edit mode
        }
        setIsProfileComplete(complete);
        if (complete || profile?.isProfileComplete) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (address, coordinates) => {
    setFormData((prev) => ({
      ...prev,
      patientAddress: address,
      patientCoordinates: coordinates,
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        age: formData.age !== "" ? Number(formData.age) : undefined,
        height: formData.height !== "" ? Number(formData.height) : undefined,
        weight: formData.weight !== "" ? Number(formData.weight) : undefined,
        patientLatitude: formData.patientCoordinates?.latitude,
        patientLongitude: formData.patientCoordinates?.longitude,
      };

      if (hasProfile) {
        await apiClient.patch("/patient/profile", submitData);
      } else {
        await apiClient.post("/patient/profile", submitData);
        setHasProfile(true); // NEW — now that it's created, future saves are PATCH
      }

      setIsEditMode(false);
      setIsProfileComplete(true);
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile save failed:", error);
      alert(error?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileCompletionSkeleton />;
  }

  return (
    <div className={styles.pageLayout}>
      <Sidebar />

      <div className={styles.contentArea}>
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <div>
              <h1>Profile Settings</h1>
              <p>Manage your personal information and medical history.</p>
            </div>

            {!isEditMode && (
              <button className={styles.editButton} onClick={handleEdit}>
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.formContainer}>
            {/* ===================================== */}
            {/* PERSONAL DETAILS */}
            {/* ===================================== */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Details</h2>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
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
                </div>

                <div className={styles.inputGroup}>
                  <label>Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {/* ===================================== */}
            {/* PHYSICAL VITALS */}
            {/* ===================================== */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Physical Vitals</h2>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="E.g. 175"
                    value={formData.height}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="E.g. 70"
                    value={formData.weight}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Blood Pressure</label>
                  <input
                    name="bloodPressure"
                    placeholder="E.g. 120/80"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {/* ===================================== */}
            {/* LIFESTYLE */}
            {/* ===================================== */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Lifestyle</h2>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Smoking Habit</label>
                  <select
                    name="smoking"
                    value={formData.smoking}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Alcohol Consumption</label>
                  <select
                    name="alcohol"
                    value={formData.alcohol}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Diet Preference</label>
                  <select
                    name="diet"
                    value={formData.diet}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Exercise Routine</label>
                  <select
                    name="exercise"
                    value={formData.exercise}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Never">Never</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {/* ===================================== */}
            {/* MEDICAL HISTORY */}
            {/* ===================================== */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Medical History</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Allergies</label>
                  <textarea
                    name="allergies"
                    placeholder="List any allergies..."
                    value={formData.allergies}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Chronic Conditions</label>
                  <textarea
                    name="chronicConditions"
                    placeholder="E.g. Diabetes, Asthma..."
                    value={formData.chronicConditions}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Current Medications</label>
                  <textarea
                    name="currentMedications"
                    placeholder="List current medications and dosages..."
                    value={formData.currentMedications}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Past Surgeries</label>
                  <textarea
                    name="pastSurgeries"
                    placeholder="List any past surgeries..."
                    value={formData.pastSurgeries}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {/* ===================================== */}
            {/* ADDRESS INFORMATION */}
            {/* ===================================== */}
            {isEditMode && (
              <>
                <AddressInput
                  label="Patient Address"
                  address={formData.patientAddress}
                  coordinates={formData.patientCoordinates}
                  onChange={handleAddressChange}
                  showGeolocation={true}
                  required={false}
                />
                <div className={styles.divider}></div>
              </>
            )}

            {/* ===================================== */}
            {/* ACTIONS */}
            {/* ===================================== */}
            {isEditMode && (
              <>
                <div className={styles.divider}></div>
                <div className={styles.submitRow}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setIsEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className={styles.buttonSpinner}></span>
                    ) : (
                      "Save Profile"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
