// Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { authApi } from "../../utils/api"; // ✅ UPDATED

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Shared: store token, notify Navbar, redirect
  const handleAuthSuccess = (token) => {
    // ❌ localStorage.setItem("token", token);  // REMOVED (handled in api.js)
    window.dispatchEvent(new Event("authChange")); // Navbar re-syncs instantly
    navigate("/dashboard"); // React Router — no full reload
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        // ── LOGIN ──
        const data = await authApi.login({
          // ✅ UPDATED
          email: form.email,
          password: form.password,
        });

        if (data.token) {
          handleAuthSuccess(data.token);
        } else {
          setMessage(data.message || "Login failed. Check your credentials.");
        }
      } else {
        // ── SIGNUP ──
        const signupData = await authApi.signup(form); // ✅ UPDATED

        if (signupData.token) {
          // ✅ Direct login (since api.js already stores token)
          handleAuthSuccess(signupData.token);
        } else if (signupData.message === "User created") {
          // fallback (if backend doesn't return token)
          const loginData = await authApi.login({
            // ✅ UPDATED
            email: form.email,
            password: form.password,
          });

          if (loginData.token) {
            handleAuthSuccess(loginData.token);
          } else {
            // Fallback: send to login form manually
            setIsLogin(true);
            setForm({ name: "", email: "", password: "", role: "patient" });
            setMessage("✓ Account created! Please sign in.");
          }
        } else {
          setMessage(signupData.message || "Signup failed. Please try again.");
        }
      }
    } catch (err) {
      setMessage(err.message || "✕ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* LEFT SIDEBAR - Brand & Content */}
      <div className={styles.leftSidebar}>
        <div className={styles.leftContent}>
          {/* Logo */}
          <div className={styles.logoSection}>
            <svg className={styles.logo} viewBox="0 0 40 40" fill="none">
              <rect x="5" y="5" width="30" height="30" fill="currentColor" />
              <path
                d="M20 12V28M12 20H28"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className={styles.headline}>
            Your health,
            <br />
            <span className={styles.highlight}>instantly accessible</span>
          </h1>

          {/* Description */}
          <p className={styles.tagline}>
            Join thousands of patients getting expert healthcare from the
            comfort of their homes. AI-powered triage meets clinical excellence.
          </p>

          {/* Features List */}
          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>24/7 availability to specialists</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>AI-powered instant diagnosis</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>Secure video consultations</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>Digital prescriptions & follow-ups</span>
            </li>
          </ul>

          {/* Social Proof */}
          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              <div className={styles.avatar}>👤</div>
              <div className={styles.avatar}>👩</div>
              <div className={styles.avatar}>🧑</div>
            </div>
            <p className={styles.proofText}>
              Trusted by <strong>50,000+</strong> patients across India
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className={styles.rightSection}>
        <div className={styles.formContainer}>
          {/* Form Header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {isLogin ? "Welcome Back" : "Get Started"}
            </h2>
            <p className={styles.formSubtitle}>
              {isLogin
                ? "Login to access your healthcare dashboard"
                : "Create your account to begin your healthcare journey"}
            </p>
          </div>

          {/* Role Selection (Signup Only) */}
          {!isLogin && (
            <div className={styles.roleSelector}>
              <label className={styles.roleLabel}>I am a:</label>
              <div className={styles.roleButtons}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${
                    form.role === "patient" ? styles.roleActive : ""
                  }`}
                  onClick={() => setForm({ ...form, role: "patient" })}
                >
                  👤 Patient
                </button>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${
                    form.role === "doctor" ? styles.roleActive : ""
                  }`}
                  onClick={() => setForm({ ...form, role: "doctor" })}
                >
                  👨‍⚕️ Doctor
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className={styles.input}
              />
              {!isLogin && (
                <p className={styles.hint}>
                  Min 8 characters with numbers & symbols
                </p>
              )}
            </div>

            {/* Error/Success Message */}
            {message && (
              <div
                className={`${styles.message} ${
                  message.includes("✕") ? styles.error : styles.success
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading
                ? "Processing..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className={styles.authToggle}>
            <p className={styles.toggleText}>
              {isLogin ? "New here?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setForm({
                    name: "",
                    email: "",
                    password: "",
                    role: "patient",
                  });
                  setMessage("");
                }}
                className={styles.toggleLink}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Terms & Privacy */}
          <p className={styles.terms}>
            By signing up, you agree to our{" "}
            <a href="#terms">Terms of Service</a> and{" "}
            <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
