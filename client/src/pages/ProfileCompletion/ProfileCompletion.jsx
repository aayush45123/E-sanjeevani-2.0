import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiCheck } from "react-icons/fi";
import styles from "./ProfileCompletion.module.css";
import { authApi } from "../../utils/api";

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await authApi.me();
        if (response.data.user) {
          const userData = response.data.user;

          // Check for profile completion status before setting data
          const isComplete =
            userData.phone &&
            userData.age &&
            userData.gender &&
            userData.bloodType;

          if (isComplete) {
            // If profile is already complete, redirect to the dashboard immediately.
            // This is the core fix to prevent existing users from being stuck here.
            navigate("/dashboard");
            return; // Stop further execution in this effect
          }

          // If profile is not complete, proceed to populate the form
          setFormData({
            name: userData.name || "",
            phone: userData.phone || "",
            age: userData.age || "",
            gender: userData.gender || "",
            bloodType: userData.bloodType || "",
            allergies: userData.allergies?.join(", ") || "",
            medicalHistory: userData.medicalHistory?.join(", ") || "",
            address: userData.address || "",
            city: userData.city || "",
            state: userData.state || "",
            zipCode: userData.zipCode || "",
          });

          setIsProfileComplete(isComplete);
          setIsEditMode(!isComplete);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Optionally, redirect to login or show an error message if the user is not authenticated
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert comma-separated strings to arrays
      const submitData = {
        ...formData,
        allergies: formData.allergies
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        medicalHistory: formData.medicalHistory
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
      };

      const response = await authApi.completePatientProfile(submitData);

      if (response.data.success) {
        alert("Profile saved successfully!");
        localStorage.setItem("patientProfileCompleted", "true");
        window.dispatchEvent(new Event("profileUpdated"));
        setIsProfileComplete(true);
        setIsEditMode(false);

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Failed to save profile");
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
    <div className={styles.profileCompletionContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Patient Profile</h1>
            {isProfileComplete && (
              <div className={styles.completeBadge}>
                <FiCheck size={16} />
                <span>Complete</span>
              </div>
            )}
          </div>
          <p className={styles.subtitle}>
            {isEditMode
              ? "Update your health information"
              : "Your healthcare information"}
          </p>
        </div>

        {isProfileComplete && !isEditMode ? (
          <div className={styles.viewMode}>
            {/* View Mode */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Information</h2>

              <div className={styles.viewGrid}>
                <div className={styles.viewField}>
                  <label>Full Name</label>
                  <p>{formData.name}</p>
                </div>

                <div className={styles.viewField}>
                  <label>Phone Number</label>
                  <p>{formData.phone}</p>
                </div>

                <div className={styles.viewField}>
                  <label>Age</label>
                  <p>{formData.age}</p>
                </div>

                <div className={styles.viewField}>
                  <label>Gender</label>
                  <p className={styles.capitalize}>{formData.gender}</p>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Medical Information</h2>

              <div className={styles.viewGrid}>
                <div className={styles.viewField}>
                  <label>Blood Type</label>
                  <p>{formData.bloodType}</p>
                </div>

                <div className={styles.viewField}>
                  <label>Allergies</label>
                  <p>{formData.allergies || "None reported"}</p>
                </div>
              </div>

              <div className={styles.viewField}>
                <label>Medical History</label>
                <p>{formData.medicalHistory || "None reported"}</p>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Address</h2>

              <div className={styles.viewGrid}>
                <div className={styles.viewField}>
                  <label>Street Address</label>
                  <p>{formData.address || "Not provided"}</p>
                </div>

                <div className={styles.viewField}>
                  <label>City</label>
                  <p>{formData.city || "Not provided"}</p>
                </div>

                <div className={styles.viewField}>
                  <label>State</label>
                  <p>{formData.state || "Not provided"}</p>
                </div>

                <div className={styles.viewField}>
                  <label>Zip Code</label>
                  <p>{formData.zipCode || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.editBtn}
                onClick={handleEditClick}
              >
                <FiEdit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Personal Information */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Information</h2>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter your age"
                    min="0"
                    max="120"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Medical Information</h2>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="bloodType">Blood Type</label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                  >
                    <option value="">Select blood type</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="allergies">Allergies (comma-separated)</label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Penicillin, Peanuts, Shellfish"
                  rows="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="medicalHistory">
                  Medical History (comma-separated)
                </label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="e.g., Diabetes, Asthma, Hypertension"
                  rows="3"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Address</h2>

              <div className={styles.formGroup}>
                <label htmlFor="address">Street Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your street address"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter your state"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="zipCode">Zip Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="Enter your zip code"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !formData.name}
              >
                {loading ? "Saving Profile..." : "Save Changes"}
              </button>
              {isProfileComplete && (
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancelClick}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
