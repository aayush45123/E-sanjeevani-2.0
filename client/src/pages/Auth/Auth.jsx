import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { authApi } from "../../utils/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /*
  ==================================================
  HANDLE INPUT CHANGE
  ==================================================
  */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /*
  ==================================================
  INDUSTRY LEVEL AUTH SUCCESS HANDLER
  IMPORTANT:
  Save full user object + userId + role + token
  This fixes WebRTC video call issue
  ==================================================
  */

  const handleAuthSuccess = (responseData) => {
    const token = responseData.token;
    const user = responseData.user;

    if (!token || !user) {
      setMessage("✕ Invalid login response from server");
      return;
    }

    /*
    Clear old broken localStorage first
    */

    localStorage.clear();

    /*
    Save auth token
    */

    localStorage.setItem("token", token);

    /*
    Save user role
    */

    localStorage.setItem("userRole", user.role);

    /*
    VERY IMPORTANT
    Save complete user object
    */

    localStorage.setItem("user", JSON.stringify(user));

    /*
    VERY IMPORTANT
    Save userId separately for WebRTC socket room
    */

    localStorage.setItem("userId", user._id);

    /*
    Trigger global auth update
    */

    window.dispatchEvent(new Event("authChange"));

    /*
    Debug (remove later if needed)
    */

    console.log("LOGIN SUCCESS");
    console.log("Saved User:", user);
    console.log("Saved User ID:", user._id);

    /*
    Navigate to dashboard
    */

    navigate("/dashboard");
  };

  /*
  ==================================================
  SUBMIT LOGIN / SIGNUP
  ==================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      /*
      ==============================================
      LOGIN
      ==============================================
      */

      if (isLogin) {
        const response = await authApi.login({
          email: form.email,
          password: form.password,
        });

        if (response.data.success && response.data.token) {
          setMessage("✓ Login successful!");
          handleAuthSuccess(response.data);
        } else {
          setMessage(
            response.data.message ||
              "✕ Login failed. Please check credentials.",
          );
        }
      } else {
        /*
      ==============================================
      SIGNUP
      ==============================================
      */
        const signupResponse = await authApi.signup({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });

        if (signupResponse.data.success && signupResponse.data.token) {
          setMessage("✓ Account created successfully!");
          handleAuthSuccess(signupResponse.data);
        } else {
          setMessage(
            signupResponse.data.message || "✕ Signup failed. Please try again.",
          );
        }
      }
    } catch (err) {
      console.error("Auth error:", err);

      setMessage(
        err.response?.data?.message ||
          err.message ||
          "✕ Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ==================================================
  UI
  ==================================================
  */

  return (
    <div className={styles.pageWrapper}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>E-Sanjeevani 2.0</span>
            </div>
          </div>
          <div className={styles.navCenter}>
            <a href="#platform" className={styles.navLink}>
              Platform
            </a>
            <a href="#triage" className={styles.navLink}>
              AI Triage
            </a>
            <a href="#specialties" className={styles.navLink}>
              Specialties
            </a>
            <a href="#intelligence" className={styles.navLink}>
              Clinical Intelligence
            </a>
            <a href="#archives" className={styles.navLink}>
              Archives
            </a>
          </div>
          <div className={styles.navRight}>
            <button className={styles.navIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button className={styles.navIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className={styles.wrapper}>
        <div className={styles.leftSidebar}>
          <div className={styles.leftContent}>
            <div className={styles.logoSection}>
              <div className={styles.logoIconWrapper}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
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
              Join thousands of patients getting expert healthcare from the
              comfort of their homes.
            </p>

            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
                <span>24/7 availability to top specialists</span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
                <span>AI-powered instant symptom diagnosis</span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
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
                Trusted by <strong>50,000+ patients</strong>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin
                  ? "Enter your details to access your dashboard."
                  : "Join thousands of patients getting expert healthcare."}
              </p>
            </div>

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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              {!isLogin && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>I am a</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={styles.roleSelect}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              )}

              {message && (
                <div
                  className={`${styles.message} ${message.includes("✕") ? styles.error : styles.success}`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading
                  ? "Processing..."
                  : isLogin
                    ? "Sign in"
                    : "Create Account"}
              </button>
            </form>

            <div className={styles.authToggle}>
              <span className={styles.toggleText}>
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage("");
                  }}
                  className={styles.toggleLink}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
