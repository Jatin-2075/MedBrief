import GoogleLogin from "./Google/GoogleAuth";
import "../../Style/signup.css";
import { NavLink } from "react-router";

const Signup = () => {
    return (
        <div className="signup-page">
            <div className="signup-card">
                <div className="signup-header">
                    <h1>Health Helper</h1>
                    <p>Create your account</p>
                </div>

                <div className="signup-field">
                    <label>Email</label>
                    <input type="email" placeholder="Email" maxLength={40} />
                </div>

                <div className="signup-field">
                    <label>Password</label>
                    <input type="password" placeholder="Password" maxLength={15} minLength={8} />
                </div>

                <div className="signup-field">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="Confirm password" />
                </div>

                <div className="signup-actions">
                    <button className="btn-primary">Sign up</button>
                    <div className="divider">or</div>
                    <GoogleLogin />
                </div>
                <div className="auth-switch">
                    <p>Already have an account?</p>
                    <NavLink to="/Login" className="auth-link">
                        Login
                    </NavLink>
                </div>

            </div>
        </div>
    );
};

export default Signup;
