import { useState } from "react";
import api from "../../Auth/api";
import { useAuth } from "../../Auth/AuthContext";
import { NavLink } from "react-router";
import "../../Style/login.css";

function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        const res = await api.post("/api/token/", { username, password });
        login(res.data.access);
        window.location.href = "/dashboard";
    };

    return (
        <div className="login-container">

            <h2>Login</h2>

            <div className="login-field">
                <label>Email</label>
                <input
                    placeholder="Enter your username"
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div className="login-field">
                <label>Password</label>
                <input
                    type="password"
                    placeholder="Enter password"
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button className="login-btn" onClick={submit}>
                Login
            </button>

            <div className="login-footer">
                <p>New User?</p>
                <NavLink to="/Signup">Signup</NavLink>
            </div>

        </div>
    );
}

export default Login;
