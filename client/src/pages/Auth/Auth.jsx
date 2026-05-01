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
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
                className={styles.input}
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={styles.input}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className={styles.input}
            />

            {!isLogin && (
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            )}

            {message && <div className={styles.message}>{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin ? "Create new account" : "Already have account?"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
