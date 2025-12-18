import { useState } from "react";
import "../Style/Navbar.css";
import { NavLink } from "react-router-dom";
import Profile_Status from "./Profile";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <span className="logo">HealthApp</span>
      </div>

      <nav className={`nav-center ${open ? "open" : ""}`}>
        <NavLink to="/Home" className="nav-item">Home</NavLink>
        <NavLink to="/Dashboard" className="nav-item">Dashboard</NavLink>
        <NavLink to="/Upload" className="nav-item">Upload</NavLink>
        <NavLink to="/Reports" className="nav-item">Reports</NavLink>
        <NavLink to="/SmartHelper" className="nav-item">Smart Helper</NavLink>
        <NavLink to="/Help" className="nav-item">Help</NavLink>
      </nav>

      <div className="nav-right">
        <Profile_Status />

        <button className="icon-btn">⚙</button>
        <div className="avatar">👤</div>

        <button
          className="hamburger"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>
    </header>
  );
};

export default Navbar;