import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Style/home.css";
import "../Components/customChecks" ; 
const Home = () => {
  const navigate = useNavigate();

  const [latestVitals, setLatestVitals] = useState(null);
  const [bmiTrend, setBmiTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalRanges = {
    bp: "120/80",
    bmi: "18.5 – 24.9",
    respiratory_rate: "12 – 20 /min",
    heartRate: "60 – 100 bpm",
  };

  const token = localStorage.getItem("access_token");

  // =============================
  // FETCH DASHBOARD DATA
  // =============================
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports/dashboard/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setLatestVitals(data.latest_vitals);
        setBmiTrend(data.bmi_trend || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
            {/* BLOOD PRESSURE */}
            <div className="vital-glass-card">
              <h4 className="vital-title">Blood Pressure</h4>
              <div className="vital-main-value">{latestVitals.bp || "—"}</div>
              <div className="vital-reference">Normal: {normalRanges.bp}</div>
              <span
                className={
                  latestVitals.bp_status === "High" ||
                  latestVitals.bp_status === "Low" ||
                  latestVitals.bp_status === "Abnormal"
                    ? "badge-alert"
                    : "badge-safe"
                }
              >
                {latestVitals.bp_status || "Normal"}
              </span>
            </div>

            {/* RESPIRATORY RATE */}
            <div className="vital-glass-card">
              <h4 className="vital-title">Respiratory Rate</h4>
              <div className="vital-main-value">
                {latestVitals.respiratory_rate ?? "—"} <small>/min</small>
              </div>
              <div className="vital-reference">
                Normal: {normalRanges.respiratory_rate}
              </div>
              <span className="badge-safe">Normal</span>
            </div>

            {/* BMI */}
            <div className="vital-glass-card">
              <h4 className="vital-title">BMI</h4>
              <div className="vital-main-value">{latestVitals.bmi ?? "—"}</div>
              <div className="vital-reference">Normal: {normalRanges.bmi}</div>
              <span className="badge-safe">Normal</span>
            </div>

            {/* HEART RATE */}
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

        {/* BMI TREND */}
        {bmiTrend.length > 0 && (
          <div className="trend-glass-section">
            <h3 className="trend-main-title">BMI Trend</h3>
            <p className="trend-info">
              Based on your last {bmiTrend.length} reports
            </p>

            <div className="chart-container">
              {bmiTrend.map((value, index) => {
                const maxBMI = 35;
                const height = Math.min((value / maxBMI) * 100, 100);

                return (
                  <div key={index} className="chart-column">
                    <div className="chart-bar-wrapper">
                      <div
                        className="chart-bar-fill"
                        style={{ height: `${height}%` }}
                      >
                        <span className="bar-tooltip">{value}</span>
                      </div>
                    </div>
                    <span className="chart-label">R{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
