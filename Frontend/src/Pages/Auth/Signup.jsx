import { useState } from "react";
import api from "../../Auth/api";
import { NavLink } from "react-router";
import "../../Style/signup.css";

function Signup() {
    const [email, setEmail] = useState("");
    const [username, setUser] = useState("");
    const [password, setPass] = useState("");

    const submit = async () => {
        await api.post("/api/user/register", { email, username, password });
        alert("Registered!");
    };

    return (
        <div className="signup-container">

            <h2>Create Account</h2>

            <div className="signup-field">
                <label>Email</label>
                <input
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="signup-field">
                <label>Username*</label>
                <input
                    placeholder="Enter your username"
                    onChange={(e) => setUser(e.target.value)}
                />
            </div>

            <div className="signup-field">
                <label>Password*</label>
                <input
                    placeholder="Enter password"
                    type="password"
                    onChange={(e) => setPass(e.target.value)}
                />
            </div>

            <button className="signup-btn" onClick={submit}>
                Register
            </button>

            <div className="signup-login-text">
                <p>Already have an account?</p>
                <NavLink to="/Login">Login</NavLink>
            </div>
        </div>
    );
}

export default Signup;
