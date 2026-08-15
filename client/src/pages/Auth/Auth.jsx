import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { authApi } from "../../utils/api";
import { AuthSkeleton } from "../../components/Skeletons";

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
    const user = responseData.user;

    if (!user) {
      setMessage("✕ Invalid login response from server");
      return;
    }

    // Clear old state but preserve/set token for port-isolated tab auth
    const token = responseData.accessToken;
    const refreshToken = responseData.refreshToken;
    localStorage.clear();
    if (token) {
      localStorage.setItem("access_token_local", token);
    }
    if (refreshToken) {
      localStorage.setItem("refresh_token_local", refreshToken);
    }
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userId", user.id || user._id);

    window.dispatchEvent(new Event("authChange"));
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

        if (response.data.success && response.data.user) {
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

        if (signupResponse.data.success && signupResponse.data.user) {
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

  if (loading) {
    return <AuthSkeleton />;
  }

  return (
    <div className={styles.pageWrapper}>
      {/* MAIN CONTENT */}
      <div className={styles.wrapper}>
        <div className={styles.leftSidebar}>
          <div className={styles.leftContent}>
            <div className={styles.logoSection}>
              <div className={styles.logoIconWrapper}>
                <img
                  src="/logo-svg.svg"
                  alt="eSanjeevani Logo"
                  style={{
                    width: "20px",
                    height: "20px",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </div>
              <span className={styles.logoText}>eSanjeevani</span>
            </div>

            <h1 className={styles.headline}>
              Clinical intelligence,
              <br />
              <span className={styles.highlight}>at your fingertips.</span>
            </h1>

            <p className={styles.tagline}>
              Integrate advanced AI symptom triage with secure video
              consultations. Get matched with the right healthcare specialist
              instantly.
            </p>

            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
                <span>AI symptom analysis with II-Medical-8B</span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
                <span>Direct, secure WebRTC video sessions</span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>✓</div>
                <span>Automated specialist matching by triage severity</span>
              </li>
            </ul>

            <div className={styles.socialProof}>
              <p className={styles.proofText}>
                Verified and secure <strong>HIPAA-aligned architecture</strong>
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
