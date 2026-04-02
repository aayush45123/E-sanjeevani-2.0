import { useState } from "react";
import styles from "./ProfileCompletion.module.css";

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

export default function ProfileCompletion() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Basic
    fullName: "Aayush Sharma",
    age: "",
    gender: "",
    phone: "",
    emergencyContact: "",
    // Medical
    conditions: [],
    allergies: "",
    medications: "",
    // Lifestyle
    smoking: "",
    alcohol: "",
    // Preferences
    language: "",
    city: "",
    state: "",
  });

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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

  const progressPct = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else setSubmitted(true);
  };

  const handleBack = () => setStep((s) => s - 1);

  if (submitted) {
    return <SuccessScreen name={form.fullName.split(" ")[0]} />;
  }

  return (
    <div className={styles.page}>
      {/* LEFT PANEL */}
      <aside className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>✚</div>
            <span className={styles.brandName}>E-Sanjeevani 2.0</span>
          </div>
          <div className={styles.leftBadge}>ONE-TIME SETUP</div>
          <h1 className={styles.leftTitle}>
            Build your
            <br />
            <em className={styles.leftTitleAccent}>health profile.</em>
          </h1>
          <p className={styles.leftDesc}>
            We collect this information once to ensure every consultation is
            clinically accurate and personalized to your needs.
          </p>
        </div>

        {/* Step indicators */}
        <nav className={styles.stepNav}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.stepItem} ${i === step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className={styles.stepNum}>{i < step ? "✓" : s.label}</span>
              <span className={styles.stepLabel}>{s.title}</span>
            </button>
          ))}
        </nav>

        <div className={styles.leftFooter}>
          <p className={styles.privacyNote}>
            🔒 Your data is encrypted and used solely for clinical purposes.
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className={styles.rightPanel}>
        {/* Progress bar */}
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
              <button className={styles.backBtn} onClick={handleBack}>
                ← Back
              </button>
            )}
            <button className={styles.nextBtn} onClick={handleNext}>
              {step === STEPS.length - 1 ? "Complete Profile ✓" : "Continue →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── STEP 1: BASIC INFO ──────────────────────────────────── */
function StepBasic({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <Row>
        <Field label="FULL NAME" hint="Auto-filled from your account">
          <input
            className={styles.input}
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Full name"
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
        <Field label="PHONE NUMBER">
          <input
            className={styles.input}
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="EMERGENCY CONTACT" hint="Optional">
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

/* ─── STEP 2: MEDICAL HISTORY ─────────────────────────────── */
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
                {form.conditions.includes(cond) ? "✓" : ""}
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
        hint="Optional — helps doctors avoid drug interactions"
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

/* ─── STEP 3: LIFESTYLE ───────────────────────────────────── */
function StepLifestyle({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.lifestyleNote}>
        <span>💡</span>
        <p>
          Lifestyle data helps our AI predict risk factors and personalize
          health recommendations. All fields optional.
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

/* ─── STEP 4: PREFERENCES ─────────────────────────────────── */
function StepPreferences({ form, updateField }) {
  return (
    <div className={styles.stepContent}>
      <Field
        label="PREFERRED LANGUAGE"
        hint="For doctor matching and consultation"
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
        <Field label="CITY">
          <input
            className={styles.input}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </Field>
        <Field label="STATE">
          <input
            className={styles.input}
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="e.g. Maharashtra"
          />
        </Field>
      </Row>

      {/* Summary card */}
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

/* ─── SUCCESS SCREEN ──────────────────────────────────────── */
function SuccessScreen({ name }) {
  return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <span className={styles.successBadge}>PROFILE COMPLETE</span>
        <h1 className={styles.successTitle}>You're all set, {name}!</h1>
        <p className={styles.successDesc}>
          Your health profile is saved. All features are now unlocked — start
          your first AI consultation.
        </p>
        <div className={styles.successUnlocked}>
          {[
            "🤖 AI Symptom Check",
            "👨‍⚕️ Doctor Matching",
            "📊 Health Records",
            "📸 Skin Analysis",
          ].map((f) => (
            <div key={f} className={styles.successFeature}>
              <span className={styles.successCheck}>✓</span>
              {f}
            </div>
          ))}
        </div>
        <a href="/dashboard" className={styles.successBtn}>
          Go to Dashboard →
        </a>
      </div>
    </div>
  );
}

/* ─── HELPERS ─────────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabelRow}>
        <label className={styles.fieldLabel}>{label}</label>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div className={styles.row}>{children}</div>;
}
