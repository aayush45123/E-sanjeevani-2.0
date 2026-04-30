import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileCompletion.module.css";
import { authApi } from "../../utils/api";

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      try {
        const response = await authApi.me();
        if (response.data.user) {
          setFormData({
            name: response.data.user.name || "",
            phone: response.data.user.phone || "",
            age: response.data.user.age || "",
            gender: response.data.user.gender || "",
            bloodType: response.data.user.bloodType || "",
            allergies: response.data.user.allergies?.join(", ") || "",
            medicalHistory: response.data.user.medicalHistory?.join(", ") || "",
            address: response.data.user.address || "",
            city: response.data.user.city || "",
            state: response.data.user.state || "",
            zipCode: response.data.user.zipCode || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
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
        alert("Profile completed successfully!");
        // Dispatch event to refresh profile status in App.jsx
        window.dispatchEvent(new Event("profileUpdated"));
        // Give time for the event to be processed
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profileCompletionContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Profile</h1>
          <p className={styles.subtitle}>
            Help us know you better to provide personalized healthcare
          </p>
        </div>

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
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !formData.name}
          >
            {loading ? "Saving Profile..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
