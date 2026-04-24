import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import styles from "./ProfileCompletion.module.css";
import { profileApi } from "../../utils/api";

const stepsList = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Physical Vitals" },
  { id: 3, label: "Lifestyle Habits" },
  { id: 4, label: "Medical History" },
];

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1); // Remembers furthest step reached
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Move to next step and record progress
  const nextStep = () => {
    const next = Math.min(step + 1, 4);
    setStep(next);
    setHighestStep((prev) => Math.max(prev, next));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Sidebar clicking logic (can jump to any step you've already unlocked)
  const jumpToStep = (targetStep) => {
    if (targetStep <= highestStep) {
      setStep(targetStep);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.updateProfile(formData);
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile update failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      
      {/* ── FOCUS NAVBAR ── */}
      <nav className={styles.focusNavbar}>
        <div className={styles.brand}>
          <img src="/logo-svg.svg" alt="E-Sanjeevani Logo" className={styles.logoImg} />
          <span className={styles.brandName}>E-Sanjeevani 2.0</span>
        </div>
      </nav>

      {/* ── SPLIT LAYOUT ── */}
      <div className={styles.splitLayout}>
        
        {/* LEFT SIDEBAR: Vertical Stepper */}
        <aside className={styles.stepperSidebar}>
          <div className={styles.stepperHeader}>
            <h2 className={styles.stepperTitle}>Profile Setup</h2>
            <p className={styles.stepperDesc}>Please complete your clinical profile to enable smart routing.</p>
          </div>

          <div className={styles.stepperList}>
            {stepsList.map((s, index) => {
              const isActive = step === s.id;
              const isCompleted = s.id < step;
              const isClickable = s.id <= highestStep;
              
              return (
                <div 
                  key={s.id} 
                  className={`${styles.stepItem} ${isClickable ? styles.clickableStep : ""}`}
                  onClick={() => jumpToStep(s.id)}
                >
                  {/* Vertical Line Connector */}
                  {index !== stepsList.length - 1 && (
                    <div className={`${styles.stepConnector} ${isCompleted ? styles.connectorActive : ""}`} />
                  )}
                  
                  {/* Circle Styling matching your reference */}
                  <div className={`${styles.stepCircle} ${isActive ? styles.circleActive : isCompleted ? styles.circleCompleted : styles.circlePending}`}>
                    {isActive && <div className={styles.innerDot}></div>}
                  </div>
                  
                  <span className={`${styles.stepLabel} ${isActive ? styles.labelActive : ""}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.sidebarFooter}>
            <button className={styles.saveCloseBtn} onClick={() => navigate("/dashboard")}>
              Save & Close
            </button>
          </div>
        </aside>

        {/* RIGHT CANVAS: The Form */}
        <main className={styles.formCanvas}>
          <div className={styles.formBody}>
            
            <div className={styles.canvasHeader}>
              <h1 className={styles.canvasTitle}>{stepsList[step - 1].label}</h1>
              <p className={styles.canvasDesc}>Please fill in the accurate details below for your medical record.</p>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              
              {/* ── STEP 1: PERSONAL DETAILS ── */}
              {step === 1 && (
                <div className={styles.fadeEnter}>
                  <div className={styles.formGrid2}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Patient Age</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} required className={styles.inputField} placeholder="e.g., 24" />
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Gender</label>
                    <div className={styles.selectionGrid3}>
                      {['Male', 'Female', 'Other'].map(g => (
                        <div key={g} className={`${styles.selectionCard} ${formData.gender === g ? styles.cardActive : ""}`} onClick={() => handleSelect('gender', g)}>
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Blood Group</label>
                    <div className={styles.selectionGrid4}>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <div key={bg} className={`${styles.selectionCard} ${formData.bloodGroup === bg ? styles.cardActive : ""}`} onClick={() => handleSelect('bloodGroup', bg)}>
                          {bg}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Marital Status</label>
                    <div className={styles.selectionGrid3}>
                      {['Single', 'Married', 'Divorced'].map(status => (
                        <div key={status} className={`${styles.selectionCard} ${formData.maritalStatus === status ? styles.cardActive : ""}`} onClick={() => handleSelect('maritalStatus', status)}>
                          {status}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PHYSICAL VITALS ── */}
              {step === 2 && (
                <div className={styles.fadeEnter}>
                  <div className={styles.formGrid2}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Height (cm)</label>
                      <input type="number" name="height" value={formData.height} onChange={handleChange} required className={styles.inputField} placeholder="e.g., 175" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Weight (kg)</label>
                      <input type="number" name="weight" value={formData.weight} onChange={handleChange} required className={styles.inputField} placeholder="e.g., 70" />
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.formGrid2}>
                     <div className={styles.inputGroup}>
                      <label className={styles.label}>Est. Blood Pressure (Optional)</label>
                      <input type="text" name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} className={styles.inputField} placeholder="e.g., 120/80" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: LIFESTYLE HABITS ── */}
              {step === 3 && (
                <div className={styles.fadeEnter}>
                  <div className={styles.formGrid2}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Smoker Status</label>
                      <div className={styles.selectionGrid2}>
                        {['Yes', 'No'].map(opt => (
                          <div key={opt} className={`${styles.selectionCard} ${formData.smoking === opt ? styles.cardActive : ""}`} onClick={() => handleSelect('smoking', opt)}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Alcohol Consumption</label>
                      <div className={styles.selectionGrid2}>
                        {['Yes', 'No'].map(opt => (
                          <div key={opt} className={`${styles.selectionCard} ${formData.alcohol === opt ? styles.cardActive : ""}`} onClick={() => handleSelect('alcohol', opt)}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Dietary Preference</label>
                    <div className={styles.selectionGrid3}>
                      {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map(diet => (
                        <div key={diet} className={`${styles.selectionCard} ${formData.diet === diet ? styles.cardActive : ""}`} onClick={() => handleSelect('diet', diet)}>
                          {diet}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Exercise Frequency</label>
                    <div className={styles.selectionGrid4}>
                      {['Daily', 'Weekly', 'Rarely', 'Never'].map(freq => (
                        <div key={freq} className={`${styles.selectionCard} ${formData.exercise === freq ? styles.cardActive : ""}`} onClick={() => handleSelect('exercise', freq)}>
                          {freq}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: MEDICAL HISTORY ── */}
              {step === 4 && (
                <div className={styles.fadeEnter}>
                  <div className={styles.formGrid2}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Known Allergies</label>
                      <textarea name="allergies" value={formData.allergies} onChange={handleChange} className={styles.textAreaField} placeholder="E.g., Penicillin, Peanuts. Leave empty if none." />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Chronic Conditions</label>
                      <textarea name="chronicConditions" value={formData.chronicConditions} onChange={handleChange} className={styles.textAreaField} placeholder="E.g., Asthma, Diabetes. Leave empty if none." />
                    </div>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.formGrid2}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Current Medications</label>
                      <textarea name="currentMedications" value={formData.currentMedications} onChange={handleChange} className={styles.textAreaField} placeholder="E.g., Metformin 500mg. Leave empty if none." />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Past Surgeries</label>
                      <textarea name="pastSurgeries" value={formData.pastSurgeries} onChange={handleChange} className={styles.textAreaField} placeholder="E.g., Appendectomy (2019). Leave empty if none." />
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACTION BAR ── */}
              <div className={styles.actionBar}>
                {/* Back Button - Only render if past step 1 so it doesn't offset the Next button */}
                {step > 1 && (
                  <button type="button" onClick={prevStep} className={styles.btnBack}>
                    <FiChevronLeft size={18} /> Back
                  </button>
                )}
                
                {step < 4 ? (
                  <button type="submit" className={styles.btnNext}>
                    Next <FiChevronRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className={styles.btnSubmit}>
                    {loading ? "Saving..." : "Submit Profile"} <FiChevronRight size={18} />
                  </button>
                )}
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileCompletion;