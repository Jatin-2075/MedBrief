import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Style/home.css";

const Home = () => {
  const navigate = useNavigate();

  const [latestVitals, setLatestVitals] = useState(null);
  const [sugarTrend, setSugarTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalRanges = {
    bp: "120/80",
    sugar: "70-130 mg/dL",
    spo2: "95-100%",
    heartRate: "60-100 bpm",
  };

  // -----------------------------
  // FETCH DASHBOARD DATA
  // -----------------------------
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports/dashboard/")
      .then((res) => res.json())
      .then((data) => {
        setLatestVitals(data.latest_vitals);
        setSugarTrend(data.sugar_trend || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">

        {/* HEADER */}
        <header className="dashboard-header">
          <h1 className="header-title">Health Overview</h1>
          <p className="header-subtitle">
            Snapshot from your latest medical reports
          </p>
        </header>

        {/* ACTION BLOCKS */}
        <div className="action-grid">
          <div
            className="action-card-upload"
            onClick={() => navigate("/Upload")}
          >
            <div className="action-icon">↑</div>
            <h3 className="action-name">Upload Report</h3>
            <p className="action-text">Get an instant AI-powered summary</p>
          </div>

          <div
            className="action-card-view"
            onClick={() => navigate("/Reports")}
          >
            <div className="action-icon">📂</div>
            <h3 className="action-name">View History</h3>
            <p className="action-text">Access your last 12 medical records</p>
          </div>
        </div>

        {/* VITALS */}
        {latestVitals && (
          <div className="vitals-layout">
            <div className="vital-glass-card">
              <h4 className="vital-title">Blood Pressure</h4>
              <div className="vital-main-value">
                {latestVitals.bp || "—"}
              </div>
              <div className="vital-reference">
                Normal: {normalRanges.bp}
              </div>
              <span
                className={
                  latestVitals.bp_status === "High"
                    ? "badge-alert"
                    : "badge-safe"
                }
              >
                {latestVitals.bp_status || "Normal"}
              </span>
            </div>

            <div className="vital-glass-card">
              <h4 className="vital-title">Blood Sugar</h4>
              <div className="vital-main-value">
                {latestVitals.sugar ?? "—"} <small>mg/dL</small>
              </div>
              <div className="vital-reference">
                Normal: {normalRanges.sugar}
              </div>
              <span
                className={
                  latestVitals.sugar_status === "High"
                    ? "badge-alert"
                    : "badge-safe"
                }
              >
                {latestVitals.sugar_status || "Normal"}
              </span>
            </div>

            <div className="vital-glass-card">
              <h4 className="vital-title">SpO₂</h4>
              <div className="vital-main-value">
                {latestVitals.spo2 ?? "—"}%
              </div>
              <div className="vital-reference">
                Normal: {normalRanges.spo2}
              </div>
              <span className="badge-safe">Normal</span>
            </div>

            <div className="vital-glass-card">
              <h4 className="vital-title">Heart Rate</h4>
              <div className="vital-main-value">
                {latestVitals.heart_rate ?? "—"} <small>bpm</small>
              </div>
              <div className="vital-reference">
                Normal: {normalRanges.heartRate}
              </div>
              <span className="badge-safe">Normal</span>
            </div>
          </div>
        )}

        {/* SUGAR TREND */}
        {sugarTrend.length > 0 && (
          <div className="trend-glass-section">
            <h3 className="trend-main-title">Blood Sugar Trend</h3>
            <p className="trend-info">
              Based on your last {sugarTrend.length} reports
            </p>

            <div className="chart-container">
              {sugarTrend.map((value, index) => (
                <div key={index} className="chart-column">
                  <div className="chart-bar-wrapper">
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${(value / 160) * 100}%` }}
                    >
                      <span className="bar-tooltip">{value}</span>
                    </div>
                  </div>
                  <span className="chart-label">R{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
