import { useState, useEffect } from "react";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiShield,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiInfo,
  FiActivity,
  FiCamera,
  FiUserCheck,
  FiCpu,
} from "react-icons/fi";

import styles from "./ProfileCompletion.module.css";
import { profileApi, authApi } from "../../utils/api";

// ─── Constants ───────────────────────────────────────────────
const STEPS = [
  { id: "basic", label: "01", title: "Basic Info" },
  { id: "medical", label: "02", title: "Medical History" },
  { id: "lifestyle", label: "03", title: "Lifestyle" },
  { id: "preferences", label: "04", title: "Preferences" },
];

const CONDITIONS = [
  "Diabetes",
  "Hypertension (BP)",
  "Heart Disease",
  "Asthma",
  "Thyroid",
  "None of the above",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Other",
];

const EMPTY_FORM = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  emergencyContact: "",
  conditions: [],
  allergies: "",
  medications: "",
  smoking: "",
  alcohol: "",
  language: "",
  city: "",
  state: "",
};

// ─────────────────────────────────────────────────────────────
export default function ProfileCompletion() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true); // fetching user on mount
  const [saving, setSaving] = useState(false); // submitting form
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  // On mount: fetch current user to pre-fill fullName
  useEffect(() => {
    async function prefill() {
      try {
        const res = await authApi.me();
        const user = res.data;
        setUserName(user.name || user.email?.split("@")[0] || "");
        setForm((prev) => ({ ...prev, fullName: user.name || "" }));
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    prefill();
  }, []);

  const updateField = (field, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (cond) => {
    setForm((prev) => {
      const has = prev.conditions.includes(cond);
      if (cond === "None of the above") {
        return { ...prev, conditions: has ? [] : ["None of the above"] };
      }
      const filtered = prev.conditions.filter((c) => c !== "None of the above");
      return {
        ...prev,
        conditions: has
          ? filtered.filter((c) => c !== cond)
          : [...filtered, cond],
      };
    });
  };

  // ── Per-step validation ─────────────────────────────────
  function validateStep() {
    if (step === 0) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.age || form.age < 1 || form.age > 120)
        return "Please enter a valid age.";
      if (!form.gender) return "Please select a gender.";
      if (!form.phone.trim()) return "Phone number is required.";
    }
    if (step === 3) {
      if (!form.language) return "Please select a language preference.";
    }
    return null;
  }

  // ── Navigation ──────────────────────────────────────────
  const handleNext = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Last step — submit to backend
    if (step === STEPS.length - 1) {
      await handleSubmit();
      return;
    }

    setStep((s) => s + 1);
    setError("");
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setError("");
  };

  // ── Final submit ────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    const payload = {
      fullName: form.fullName.trim(),
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone.trim(),
      emergencyContact: form.emergencyContact.trim() || undefined,
      conditions: form.conditions,
      allergies: form.allergies.trim(),
      medications: form.medications.trim(),
      smoking: form.smoking,
      alcohol: form.alcohol,
      language: form.language,
      city: form.city.trim(),
      state: form.state.trim(),
    };

    try {
      await profileApi.create(payload);
      setSubmitted(true);
    } catch (err) {
      // Backend validation errors come as an array
      if (err.errors?.length) {
        setError(err.errors[0]);
      } else if (err.status === 409) {
        // Profile already exists — use update instead
        try {
          await profileApi.update(payload);
          setSubmitted(true);
        } catch (updateErr) {
          setError(
            updateErr.message || "Failed to save profile. Please try again.",
          );
        }
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <FiLoader className={styles.spinner} size={28} />
        <p className={styles.loadingText}>Preparing your profile...</p>
      </div>
    );
  }

  if (submitted) {
    return <SuccessScreen name={form.fullName.split(" ")[0] || userName} />;
  }

  return (
    <div className={styles.page}>
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <aside className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>+</div>
            <span className={styles.brandName}>E-Sanjeevani 2.0</span>
          </div>
          <div className={styles.leftBadge}>ONE-TIME SETUP</div>
          <h1 className={styles.leftTitle}>
            Build your
            <br />
            <em className={styles.leftTitleAccent}>health profile.</em>
          </h1>
          <p className={styles.leftDesc}>
            We collect this once so every consultation is accurate and
            personalised to your needs.
          </p>
        </div>

        <nav className={styles.stepNav}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.stepItem}
                ${i === step ? styles.stepActive : ""}
                ${i < step ? styles.stepDone : ""}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className={styles.stepNum}>
                {i < step ? <FiCheck size={13} /> : s.label}
              </span>
              <span className={styles.stepLabel}>{s.title}</span>
            </button>
          ))}
        </nav>

        <div className={styles.leftFooter}>
          <FiShield size={13} className={styles.privacyIcon} />
          <p className={styles.privacyNote}>
            Your data is encrypted and used solely for clinical purposes.
          </p>
        </div>
      </aside>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <main className={styles.rightPanel}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className={styles.formArea}>
          <div className={styles.formHeader}>
            <span className={styles.formStepBadge}>
              STEP {step + 1} OF {STEPS.length}
            </span>
            <h2 className={styles.formTitle}>{STEPS[step].title}</h2>
          </div>

          {/* Inline error */}
          {error && (
            <div className={styles.errorBanner}>
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formBody}>
            {step === 0 && <StepBasic form={form} updateField={updateField} />}
            {step === 1 && (
              <StepMedical
                form={form}
                updateField={updateField}
                toggleCondition={toggleCondition}
              />
            )}
            {step === 2 && (
              <StepLifestyle form={form} updateField={updateField} />
            )}
            {step === 3 && (
              <StepPreferences form={form} updateField={updateField} />
            )}
          </div>

          <div className={styles.formActions}>
            {step > 0 && (
              <button
                className={styles.backBtn}
                onClick={handleBack}
                disabled={saving}
              >
                <FiArrowLeft size={14} />
                Back
              </button>
            )}
            <button
              className={styles.nextBtn}
              onClick={handleNext}
              disabled={saving}
            >
              {saving ? (
                <>
                  <FiLoader size={14} className={styles.btnSpinner} /> Saving...
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  <FiCheckCircle size={14} /> Complete Profile
                </>
              ) : (
                <>
                  Continue <FiArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── STEP 1: Basic Info ───────────────────────────────────────
function StepBasic({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <Row>
        <Field
          label="FULL NAME"
          Icon={FiUser}
          hint="Auto-filled from your account"
        >
          <input
            className={styles.input}
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Your full name"
          />
        </Field>
        <Field label="AGE">
          <input
            className={styles.input}
            type="number"
            value={form.age}
            onChange={(e) => updateField("age", e.target.value)}
            placeholder="e.g. 24"
            min="1"
            max="120"
          />
        </Field>
      </Row>

      <Field label="GENDER">
        <div className={styles.pillGroup}>
          {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
            <button
              key={g}
              className={`${styles.pill} ${form.gender === g ? styles.pillActive : ""}`}
              onClick={() => updateField("gender", g)}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>

      <Row>
        <Field label="PHONE NUMBER" Icon={FiPhone}>
          <input
            className={styles.input}
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="EMERGENCY CONTACT" Icon={FiPhone} hint="Optional">
          <input
            className={styles.input}
            type="tel"
            value={form.emergencyContact}
            onChange={(e) => updateField("emergencyContact", e.target.value)}
            placeholder="Family member's number"
          />
        </Field>
      </Row>
    </div>
  );
}

// ─── STEP 2: Medical History ──────────────────────────────────
function StepMedical({ form, updateField, toggleCondition }) {
  return (
    <div className={styles.stepContent}>
      <Field label="EXISTING CONDITIONS" hint="Select all that apply">
        <div className={styles.checkGrid}>
          {CONDITIONS.map((cond) => (
            <button
              key={cond}
              className={`${styles.checkCard} ${form.conditions.includes(cond) ? styles.checkCardActive : ""}`}
              onClick={() => toggleCondition(cond)}
            >
              <span className={styles.checkBox}>
                {form.conditions.includes(cond) && <FiCheck size={11} />}
              </span>
              {cond}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="KNOWN ALLERGIES"
        hint="Optional — e.g. Penicillin, Shellfish, Pollen"
      >
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={form.allergies}
          onChange={(e) => updateField("allergies", e.target.value)}
          placeholder="List any known allergies..."
          rows={3}
        />
      </Field>

      <Field
        label="CURRENT MEDICATIONS"
        hint="Optional — helps avoid drug interactions"
      >
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={form.medications}
          onChange={(e) => updateField("medications", e.target.value)}
          placeholder="e.g. Metformin 500mg, Aspirin..."
          rows={3}
        />
      </Field>
    </div>
  );
}

// ─── STEP 3: Lifestyle ────────────────────────────────────────
function StepLifestyle({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.lifestyleNote}>
        <FiInfo size={16} className={styles.lifestyleNoteIcon} />
        <p>
          Lifestyle data helps our AI predict risk factors and personalise
          recommendations. All fields are optional.
        </p>
      </div>

      <Field label="SMOKING STATUS">
        <div className={styles.pillGroup}>
          {["Never", "Occasionally", "Regularly", "Ex-smoker"].map((o) => (
            <button
              key={o}
              className={`${styles.pill} ${form.smoking === o ? styles.pillActive : ""}`}
              onClick={() => updateField("smoking", o)}
            >
              {o}
            </button>
          ))}
        </div>
      </Field>

      <Field label="ALCOHOL CONSUMPTION">
        <div className={styles.pillGroup}>
          {["Never", "Occasionally", "Regularly"].map((o) => (
            <button
              key={o}
              className={`${styles.pill} ${form.alcohol === o ? styles.pillActive : ""}`}
              onClick={() => updateField("alcohol", o)}
            >
              {o}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── STEP 4: Preferences ─────────────────────────────────────
function StepPreferences({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <Field
        label="PREFERRED LANGUAGE"
        Icon={FiGlobe}
        hint="For consultation and doctor matching"
      >
        <div className={styles.langGrid}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`${styles.pill} ${form.language === lang ? styles.pillActive : ""}`}
              onClick={() => updateField("language", lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </Field>

      <Row>
        <Field label="CITY" Icon={FiMapPin}>
          <input
            className={styles.input}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </Field>
        <Field label="STATE" Icon={FiMapPin}>
          <input
            className={styles.input}
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="e.g. Maharashtra"
          />
        </Field>
      </Row>

      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>PROFILE SUMMARY</p>
        <div className={styles.summaryGrid}>
          {[
            { k: "Language", v: form.language || "—" },
            { k: "City", v: form.city || "—" },
            { k: "State", v: form.state || "—" },
          ].map(({ k, v }) => (
            <div key={k} className={styles.summaryItem}>
              <span className={styles.summaryKey}>{k}</span>
              <span className={styles.summaryVal}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────
function SuccessScreen({ name }) {
  return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <FiCheckCircle size={32} />
        </div>
        <span className={styles.successBadge}>PROFILE COMPLETE</span>
        <h1 className={styles.successTitle}>You are all set, {name}!</h1>
        <p className={styles.successDesc}>
          Your health profile is saved. All features are now unlocked — start
          your first AI consultation.
        </p>
        <div className={styles.successUnlocked}>
          {[
            { Icon: FiCpu, label: "AI Symptom Check" },
            { Icon: FiUserCheck, label: "Doctor Matching" },
            { Icon: FiActivity, label: "Health Records" },
            { Icon: FiCamera, label: "Skin Analysis" },
          ].map(({ Icon, label }) => (
            <div key={label} className={styles.successFeature}>
              <FiCheck size={13} className={styles.successCheck} />
              <Icon size={15} className={styles.successFeatureIcon} />
              {label}
            </div>
          ))}
        </div>
        <a href="/dashboard" className={styles.successBtn}>
          Go to Dashboard
          <FiArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function Field({ label, hint, Icon, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabelRow}>
        <label className={styles.fieldLabel}>
          {Icon && <Icon size={11} className={styles.fieldLabelIcon} />}
          {label}
        </label>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div className={styles.row}>{children}</div>;
}
