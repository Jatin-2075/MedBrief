import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../Style/home.css";
import { toast } from "react-toastify";

const Home = () => {
    const [userData, setUserData] = useState({ name: "User", healthScore: 85 });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("http://localhost:8000/Send_Profile/", { credentials: "include" });
                const data = await res.json();
                if (data.success) setUserData(prev => ({...prev, name: data.name}));
            } catch (err) { console.error("Sync Error:", err); }
        };
        fetchUser();
    }, []);

    return (
        <div className="home-wrapper">

            {/* Main Content Area */}
            <main className="dashboard-content">
                <header className="content-header fade-in">
                    <div className="greeting">
                        <h1>Welcome back, {userData.name || "Zen User"}!</h1>
                        <p>Your health metrics are looking stable today.</p>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Primary Status Card */}
                    <div className="glass-card main-stats slide-up">
                        <div className="stats-header">
                            <h3>SmartHealth Score</h3>
                            <span className="trend positive">↑ 12% this month</span>
                        </div>
                        <div className="score-container">
                            <div className="score-ring">
                                <svg>
                                    <circle cx="70" cy="70" r="70"></circle>
                                    <circle cx="70" cy="70" r="70" style={{strokeDashoffset: `calc(440 - (440 * ${userData.healthScore}) / 100)`}}></circle>
                                </svg>
                                <div className="score-number">
                                    <h2>{userData.healthScore}%</h2>
                                    <p>Good</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="shortcuts-grid">
                        <div className="mini-card stagger-1">
                            <div className="mini-icon blue">🩸</div>
                            <div>
                                <h4>Blood Group</h4>
                                <p>Checking profile...</p>
                            </div>
                        </div>
                        <div className="mini-card stagger-2">
                            <div className="mini-icon green">🥗</div>
                            <div>
                                <h4>Diet Plan</h4>
                                <p>AI Generated</p>
                            </div>
                        </div>
                        <div className="mini-card stagger-3">
                            <div className="mini-icon orange">⚡</div>
                            <div>
                                <h4>Activity</h4>
                                <p>45m Exercise</p>
                            </div>
                        </div>
                        <div className="mini-card stagger-4">
                            <div className="mini-icon purple">🧠</div>
                            <div>
                                <h4>Mental Health</h4>
                                <p>Calm State</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Interaction Banner */}
                <section className="ai-banner fadeInUp">
                    <div className="ai-text">
                        <h3>Ask SmartZen AI anything</h3>
                        <p>Get instant insights based on your uploaded medical reports.</p>
                    </div>
                    <NavLink to="/SmartHelper" className="btn-ai-launch">Open Chatbot →</NavLink>
                </section>
            </main>
        </div>
    );
};

export default Home;