import { useState } from "react";
import { NavLink } from "react-router-dom";
import "../../Style/signup.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();


    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      alert(
        "Username must be 3–20 characters long, start with a letter, and contain only letters, numbers, or underscores."
      );
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email address (e.g., example@gmail.com).");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long for security reasons.");
      return;
    }

    if (password !== confirmPassword) {
      alert("The passwords you entered do not match. Please try again.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("username", trimmedUsername);
      form.append("email", trimmedEmail);
      form.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/signup/", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        alert("Your account has been created successfully. You may now log in.");
        window.location.href = "/Login";
      } else {
        alert(data.msg || "Signup failed. Please try again.");
      }
    } catch (err) {
      alert("A server error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signup-page">
        <div className="signup-container">
        <h2>SmartZen</h2>

        <div className="signup-field">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="signup-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="signup-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="signup-field">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          className="signup-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="signup-login-text">
          Already have an account?{" "}
          <NavLink to="/Login">Login</NavLink>
        </p>
      </div>
    </div>
  );

};

export default Signup;
