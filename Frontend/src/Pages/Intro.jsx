import { NavLink } from "react-router-dom";
import "../Style/intro.css";

const Intro = () => {
  return (
    <div className="intro-container">
      {/* BACKGROUND */}
      <div className="blob-bg" />
      <div className="grid-overlay" />

      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <h2 className="logo-text">
            Smart<span>Zen</span>
          </h2>
          <span className="tagline">AI-Powered Health Intelligence</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/Login" className="btn-link">Login</NavLink>
          <NavLink to="/Signup" className="btn primary shadow-btn">Get Started</NavLink>
        </nav>
      </header>

      {/* HERO */}
      <main className="hero">
        <section className="hero-content">
          <span className="badge">🚀 Powered by AI + Real Medical Data</span>

          <h1>
            Smarter Health <br />
            <span className="text-gradient">Decisions, Instantly</span>
          </h1>

          <p className="hero-subtitle">
            SmartZen analyzes your medical reports, vitals, and lifestyle data
            to give you clear insights, predictions, and daily guidance —
            all in one secure dashboard.
          </p>

          <div className="cta-group">
            <NavLink to="/Signup" className="btn primary big-btn">
              Start Free
            </NavLink>
            <NavLink to="/Help" className="btn outline big-btn">
              See How It Works
            </NavLink>
          </div>
        </section>

        {/* HERO IMAGE / MOCKUP */}
        <section className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1581093588401-22d3b6e1c5c0"
            alt="Dashboard Preview"
            className="hero-image"
          />
          
        </section>


        {/* FEATURES */}
        <section className="features-section">
          <h2 className="section-title">
            Everything You Need for <span className="text-gradient">Smart Health</span>
          </h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="icon-box">📄</div>
              <h3>Report Analysis</h3>
              <p>
                Upload medical reports and get instant summaries, risks,
                and recommendations.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon-box">📊</div>
              <h3>Vitals Dashboard</h3>
              <p>
                Track BP, sugar, SpO₂, heart rate, and trends over time.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon-box">🤖</div>
              <h3>AI Health Assistant   ( Upcoming Soon )</h3>
              <p>
                Ask questions in plain language and get personalized guidance.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon-box">🍎</div>
              <h3>Diet & Workout Plans</h3>
              <p>
                AI-generated plans based on BMI, goals, and medical data.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon-box">🔔</div>
              <h3>Smart Alerts</h3>
              <p>
                Get notified before things go wrong — prevention first.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon-box">🔒</div>
              <h3>Privacy First</h3>
              <p>
                End-to-end encrypted. Your health data stays yours.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="steps-section">
          <h2 className="section-title">How It Works</h2>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h4>Create Profile</h4>
              <p>Enter basic health details securely.</p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h4>Upload Reports</h4>
              <p>Blood tests, scans, prescriptions.</p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h4>AI Analysis</h4>
              <p>We analyze trends, risks, and patterns.</p>
            </div>

            <div className="step-card">
              <span className="step-number">04</span>
              <h4>Take Action</h4>
              <p>Get plans, alerts, and daily insights.</p>
            </div>
          </div>
        </section>

        {/* NEWSLETTER / CTA */}
        <section className="contact-box-section">
          <div className="contact-card">
            <h2>Join the Smart Health Movement</h2>
            <p>
              Get early access updates, AI health tips, and feature drops.
            </p>

            <div className="input-group">
              <input type="email" placeholder="Enter your email address" />
              <button className="btn primary">Notify Me</button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h4>SmartZen</h4>
            <p>AI-driven health intelligence platform.</p>
          </div>

          <div>
            <h5>Product</h5>
            <ul>
              <li>Dashboard</li>
              <li>AI Assistant</li>
              <li>Reports</li>
              <li>Security</li>
            </ul>
          </div>

          <div>
            <h5>Company</h5>
            <ul>
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <h5>Legal</h5>
            <ul>
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>

        <p className="copyright">
          © 2025 SmartZen. Built for the future of healthcare.
        </p>
      </footer>
    </div>
  );
};

export default Intro;
