// Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { authApi } from "../../utils/api";

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

  const handleAuthSuccess = (token) => {
    window.dispatchEvent(new Event("authChange"));
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const data = await authApi.login({
          email: form.email,
          password: form.password,
        });

        if (data.token) {
          handleAuthSuccess(data.token);
        } else {
          setMessage(data.message || "Login failed. Check your credentials.");
        }
      } else {
        const signupData = await authApi.signup(form);

        if (signupData.token) {
          handleAuthSuccess(signupData.token);
        } else if (signupData.message === "User created") {
          const loginData = await authApi.login({
            email: form.email,
            password: form.password,
          });

          if (loginData.token) {
            handleAuthSuccess(loginData.token);
          } else {
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
      {/* LEFT SIDEBAR - Light & Airy Brand Section */}
      <div className={styles.leftSidebar}>
        <div className={styles.leftContent}>
          {/* Logo */}
          <div className={styles.logoSection}>
            <div className={styles.logoIconWrapper}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
               </svg>
            </div>
            <span className={styles.logoText}>E-Sanjeevani</span>
          </div>

          <h1 className={styles.headline}>
            Your health,
            <br />
            <span className={styles.highlight}>instantly accessible.</span>
          </h1>

          <p className={styles.tagline}>
            Join thousands of patients getting expert healthcare from the comfort of their homes. AI-powered triage meets clinical excellence.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>24/7 availability to top specialists</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>AI-powered instant symptom diagnosis</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>Military-grade secure video consultations</span>
            </li>
          </ul>

          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              <div className={styles.avatar}></div>
              <div className={styles.avatar}></div>
              <div className={styles.avatar}></div>
            </div>
            <p className={styles.proofText}>
              Trusted by <strong>50,000+</strong> patients
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM SECTION - Crisp & Clean */}
      <div className={styles.rightSection}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className={styles.formSubtitle}>
              {isLogin
                ? "Enter your details to access your dashboard."
                : "Start your seamless healthcare journey today."}
            </p>
          </div>

          {/* Premium Segmented Control for Roles */}
          {!isLogin && (
            <div className={styles.roleSelector}>
              <div className={styles.roleTrack}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${form.role === "patient" ? styles.roleActive : ""}`}
                  onClick={() => setForm({ ...form, role: "patient" })}
                >
                  Patient
                </button>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${form.role === "doctor" ? styles.roleActive : ""}`}
                  onClick={() => setForm({ ...form, role: "doctor" })}
                >
                  Doctor
                </button>
              </div>
            </div>
          )}

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
            </div>

            {message && (
              <div className={`${styles.message} ${message.includes("✕") ? styles.error : styles.success}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className={styles.authToggle}>
            <p className={styles.toggleText}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setForm({ name: "", email: "", password: "", role: "patient" });
                  setMessage("");
                }}
                className={styles.toggleLink}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;