import { NavLink } from "react-router";
import "../Style/intro.css";
import Navbar from "../Components/Navbar";

const Intro = () => {
    return (
        <div className="page">
            <Navbar />
            <header className="header">
                <div className="brand">
                    <h2>Smart Dashboard</h2>
                </div>
                <NavLink to="/Login" className="btn primary">Login</NavLink>

            </header>

            <main className="hero">
                <h1>Welcome to Smart Dashboard</h1>
                <p>
                    Manage, analyze, upload, and get smart help — all in one place.
                </p>

                <div className="cta">
                    <NavLink to="/Signup" className="btn primary">Signup</NavLink>
                    <NavLink to="/Help" className="btn outline">Help / Learn More</NavLink>
                </div>

                <section className="features">
                    <div className="card">
                        <h3>Dashboard</h3>
                        <p>Centralized management of all your projects.</p>
                    </div>
                    <div className="card">
                        <h3>Reports</h3>
                        <p>In-depth analysis and insightful reports.</p>
                    </div>
                    <div className="card">
                        <h3>Upload</h3>
                        <p>Easily upload and organize your data.</p>
                    </div>
                    <div className="card">
                        <h3>AI Helper</h3>
                        <p>Get smart assistance powered by AI.</p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Intro;
