import { NavLink } from "react-router-dom";
import "../../Style/login.css";
import GoogleAuth from "./Google/GoogleAuth";

const Login = () => {
    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Health Helper</h1>

                <div className="login-field">
                    <label>Email</label>
                    <input type="email" placeholder="Email id" maxLength={40} />
                </div>

                <div className="login-field">
                    <label>Password</label>
                    <input type="password" placeholder="Password" maxLength={15} minLength={8} />
                </div>

                <button className="login-btn">Login</button>

                <div style={{ marginTop: "20px", textAlign: "center" }}>
                    <GoogleAuth />
                </div>

                <p className="login-footer">
                    Don’t have an account?{" "}
                    <NavLink to="/Signup" className="signup-link">
                        Signup
                    </NavLink>
                </p>
            </div>
        </div>
    );
};

export default Login;
