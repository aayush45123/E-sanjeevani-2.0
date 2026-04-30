import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./ConsultationBookingForm.module.css";
import { consultationApi } from "../../utils/api";

export default function ConsultationBookingForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const doctor = location.state?.doctor;

  const [formData, setFormData] = useState({
    consultationType: "video",
    symptoms: "",
    currentProblem: "",
    currentMedication: "",
    medicalHistory: "",
    allergies: "",
    consultationDate: "",
    startTime: "",
    endTime: "",
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctor) {
      navigate("/consultations");
    }
  }, [doctor, navigate]);

  useEffect(() => {
    if (doctor && formData.consultationDate) {
      fetchDoctorSlots();
    }
  }, [formData.consultationDate]);

  const fetchDoctorSlots = async () => {
    try {
      const response = await consultationApi.getDoctorAvailableSlots({
        doctorId: doctor._id,
        date: formData.consultationDate,
      });

      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error(error);
      setAvailableSlots([]);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSlotSelect = (slot) => {
    setFormData((prev) => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await consultationApi.createConsultation({
        doctorId: doctor._id,
        ...formData,
      });

      alert("Consultation booked successfully");
      navigate("/consultations");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to book consultation");
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return null;

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>Book Consultation</h1>
          <p className={styles.subtitle}>with Dr. {doctor.name}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Consultation Type</label>
                <select
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleChange}
                >
                  <option value="video">Video Call</option>
                  <option value="call">Phone Call</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Select Date</label>
                <input
                  type="date"
                  name="consultationDate"
                  value={formData.consultationDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Symptoms</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Current Problem</label>
              <textarea
                name="currentProblem"
                value={formData.currentProblem}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Current Medication</label>
              <textarea
                name="currentMedication"
                value={formData.currentMedication}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <div className={styles.slotSection}>
              <h3>Available Time Slots</h3>

              {availableSlots.length === 0 ? (
                <p>No slots available</p>
              ) : (
                <div className={styles.slotGrid}>
                  {availableSlots.map((slot, index) => (
                    <button
                      type="button"
                      key={index}
                      className={`${styles.slotBtn} ${
                        formData.startTime === slot.startTime
                          ? styles.activeSlot
                          : ""
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
