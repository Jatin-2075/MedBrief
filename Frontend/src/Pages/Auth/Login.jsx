import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../Style/Login.css";
import { API_BASE_URL } from "../../config/api";
import { toast } from "react-toastify";
import { useEffect } from "react";

const Login = () => {
  // ===============================
  // LOGIN STATES
  // ===============================
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ===============================
  // FORGOT PASSWORD STATES
  // ===============================
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = email, 2 = otp + new password

  const navigate = useNavigate();

  // ===============================
  // OTP TIMER STATES
  // ===============================
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }

    if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, step]);


  // ===============================
  // LOGIN HANDLER
  // ===============================
  const handleSubmit = async () => {
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);

      const res = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        navigate("/Profile_create", { replace: true });
      } else {
        toast.error(data.msg || "Invalid login credentials.");
      }
    } catch {
      toast.error("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // SEND OTP
  // ===============================
  const sendOtp = async () => {
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("email", email);

      const res = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("An OTP has been sent to your email.");
        setStep(2);
        setTimer(60);
        setCanResend(false);
      }
      else {
        toast.error(data.msg || "Unable to send OTP.");
      }
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  

  // ===============================
  // RESET PASSWORD
  // ===============================
  const resetPassword = async () => {
    if (!otp || !newPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("otp", otp);
      form.append("new_password", newPassword);

      const res = await fetch(`${API_BASE_URL}/reset-password/`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        toast.error("Your password has been reset successfully.");

        // Reset UI
        setShowForgot(false);
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
      } else {
        toast.error(data.msg || "Invalid OTP.");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // JSX
  // ===============================
  return (
    <div className="login-page">
      <div className="login-container">
        <h2>SmartZen</h2>

        {!showForgot && (
          <>
            <div className="login-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: "12px" }}>
              <span
                style={{
                  color: "#2a7be4",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </span>
            </div>

            <button
              className="login-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="login-footer">
              Don't have an account?{" "}
              <NavLink to="/Signup">Create one</NavLink>
            </div>
          </>
        )}

        {showForgot && (
          <>
            <h3 style={{ textAlign: "center", color: "#2a7be4" }}>
              Reset Password
            </h3>

            {step === 1 && (
              <>
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  className="login-btn"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="login-field">
                  <label>OTP</label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <div className="login-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  className="login-btn"
                  onClick={resetPassword}
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  {canResend ? (
                    <span
                      style={{
                        color: "#2a7be4",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                      onClick={sendOtp}
                    >
                      Resend OTP
                    </span>
                  ) : (
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      Resend OTP in {timer}s
                    </span>
                  )}
                </div>

              </>
            )}

            <div className="login-footer">
              <span
                style={{ cursor: "pointer", color: "#2a7be4" }}
                onClick={() => {
                  setShowForgot(false);
                  setStep(1);
                  setTimer(60);
                  setCanResend(false);
                }}
              >
                Back to login
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
