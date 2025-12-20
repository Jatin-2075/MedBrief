import { useNavigate } from "react-router-dom";
import "../Style/home.css";

const Home = () => {
  const navigate = useNavigate();

  const latestVitals = {
    bp: "128/82",
    sugar: 130,
    spo2: 98,
    heartRate: 72,
  };

  const normalRanges = {
    bp: "120/80",
    sugar: "70–140 mg/dL",
    spo2: "95–100%",
    heartRate: "60–100 bpm",
  };

  const sugarTrend = [110, 115, 120, 118, 125, 130];

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <h1>Health Overview</h1>
        <p className="subtitle">
          Snapshot from your latest medical reports
        </p>

        {/* ACTION BLOCKS */}
        <div className="quick-actions">
          <div
            className="action-card"
            onClick={() => navigate("/report-summary")}
          >
            <h3>Upload Report</h3>
            <p>Upload a medical report and get an instant summary</p>
          </div>

          <div
            className="action-card secondary"
            onClick={() => navigate("/reports")}
          >
            <h3>View Reports</h3>
            <p>See summaries from your last 12 uploaded reports</p>
          </div>
        </div>

        {/* VITALS */}
        <div className="vitals-grid">
          <div className="vital-card">
            <h4>Blood Pressure</h4>
            <p className="value">{latestVitals.bp}</p>
            <p className="normal">
              Normal: {normalRanges.bp}
            </p>
            <span className="status attention">High</span>
          </div>

          <div className="vital-card">
            <h4>Blood Sugar</h4>
            <p className="value">{latestVitals.sugar} mg/dL</p>
            <p className="normal">
              Normal: {normalRanges.sugar}
            </p>
            <span className="status attention">High</span>
          </div>

          <div className="vital-card">
            <h4>SpO₂</h4>
            <p className="value">{latestVitals.spo2}%</p>
            <p className="normal">
              Normal: {normalRanges.spo2}
            </p>
            <span className="status normal">Normal</span>
          </div>

          <div className="vital-card">
            <h4>Heart Rate</h4>
            <p className="value">{latestVitals.heartRate} bpm</p>
            <p className="normal">
              Normal: {normalRanges.heartRate}
            </p>
            <span className="status normal">Normal</span>
          </div>
        </div>

        {/* TREND */}
        <div className="trend-card compact">
          <h3>Blood Sugar Trend</h3>
          <p className="trend-subtitle">
            Based on your last {sugarTrend.length} reports
          </p>

          <div className="bar-graph compact-graph">
            {sugarTrend.map((value, index) => (
              <div key={index} className="bar">
                <div
                  className="bar-fill"
                  style={{ height: `${value / 2}%` }}
                />
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
