import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { signupUser, loginUser } from "../../utils/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = isLogin ? await loginUser(form) : await signupUser(form);

      // ✅ LOGIN SUCCESS → go dashboard
      if (isLogin && data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard"); // 🔥 redirect
      }

      // ✅ SIGNUP SUCCESS → go login
      if (!isLogin && data.message === "User created") {
        setIsLogin(true); // switch to login
        setMessage("Signup successful! Please login.");
      } else {
        setMessage(data.message || "Success");
      }
    } catch (err) {
      setMessage("Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>{isLogin ? "Login" : "Signup"}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <select name="role" onChange={handleChange}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          )}

          <button type="submit">{isLogin ? "Login" : "Signup"}</button>
        </form>

        <p className={styles.toggle}>
          {isLogin ? "New user?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Signup" : " Login"}
          </span>
        </p>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default Auth;
