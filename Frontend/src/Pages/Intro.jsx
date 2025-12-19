import { NavLink } from "react-router-dom";
import "../Style/intro.css";
import { toast } from "react-toastify";

const Intro = () => {
    return (
        <div className="intro-container">
            <div className="blob-bg"></div>
            
            <header className="header fade-in-down">
                <div className="brand">
                    <h2 className="logo-text">Smart<span> Zen</span></h2>
                </div>
                <div className="nav-links">
                    <NavLink to="/Login" className="btn-link">Login</NavLink>
                    <NavLink to="/Signup" className="btn primary shadow-btn">Get Started</NavLink>
                </div>
            </header>

            <main className="hero">
                <div className="hero-content scale-in">
                    <span className="badge">✨ Now with Predictive Analytics</span>
                    <h1>The Future of <br /><span className="text-gradient">Data Intelligence</span></h1>
                    <p className="hero-subtitle">
                        Empowering teams to manage, analyze, and scale their data with 
                        integrated AI helper technology. All your tools, one interface.
                    </p>

                    <div className="cta-group">
                        <NavLink to="/Signup" className="btn primary big-btn">Start for Free</NavLink>
                        <NavLink to="/Help" className="btn outline big-btn">Watch Demo</NavLink>
                    </div>
                </div>

                {/* --- Added Stats Section --- */}
                <div className="stats-bar fadeInUp">
                    <div className="stat-item">
                        <h4>99.9%</h4>
                        <p>Uptime</p>
                    </div>
                    <div className="stat-item">
                        <h4>24/7</h4>
                        <p>AI Support</p>
                    </div>
                    <div className="stat-item">
                        <h4>10k+</h4>
                        <p>Active Users</p>
                    </div>
                </div>

                <section className="features-grid">
                    <div className="card stagger-1">
                        <div className="icon-box">📊</div>
                        <h3>Real-time Analytics</h3>
                        <p>Watch your data evolve with live streaming updates and visual heatmaps.</p>
                    </div>
                    <div className="card stagger-2">
                        <div className="icon-box">🤖</div>
                        <h3>AI Co-Pilot</h3>
                        <p>Ask our AI any question about your data and get instant, smart summaries.</p>
                    </div>
                    <div className="card stagger-3">
                        <div className="icon-box">🔒</div>
                        <h3>Secure Cloud</h3>
                        <p>Enterprise-grade encryption keeping your private data safe and compliant.</p>
                    </div>
                </section>

                {/* --- Added Interactive Text Box Section --- */}
                <section className="contact-box-section fadeInUp">
                    <div className="contact-card">
                        <h2>Ready to get started?</h2>
                        <p>Sign up for our newsletter to get the latest AI insights.</p>
                        <div className="input-group">
                            <input type="email" placeholder="Enter your business email..." />
                            <button className="btn primary">Subscribe</button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <p>&copy; 2025 Smart Dashboard Inc. Built for the next generation.</p>
            </footer>
        </div>
    );
};

export default Intro;