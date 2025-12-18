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
    if (!username || !email || !password || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/signup/", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        alert("Account created successfully");
  const loginform = new FormData()

        loginform.append("password", password)
        loginform.append("username", username)


        const dosomething = async () => {
          const res = await fetch("http://127.0.0.1:8000/login/",{
            method: "POST",
            body: loginform,
            credentials: "include",
          })
          const loginresponse = await res.json()

          console.log(loginresponse)
          if(loginresponse.success){
            alert("create a profile")
          }
          else{
            alert("some error occured from backend")
            window.location.href= "/Create_Profile";
          }

        }
        await dosomething()

      } else {
        alert(data.msg || "Signup failed");
      }
    } catch (err) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );

};

export default Signup;
