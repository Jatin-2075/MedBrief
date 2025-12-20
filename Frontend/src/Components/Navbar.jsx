import { useState } from "react";
import "../Style/Navbar.css";
import { NavLink, useLocation } from "react-router-dom";
import Profile_Status from "./Profile";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setOpen(false);

  return (
    <header className="top-navbar">
      {/* Left */}
      <div className="nav-left">
        <NavLink to="/Home" className="logo" onClick={closeMenu}>
          HealthApp
        </NavLink>
      </div>

      {/* Center */}
      <nav className={`nav-center ${open ? "open" : ""}`}>
        {[
          { path: "/Home", label: "Home" },
          { path: "/Upload", label: "Upload" },
          { path: "/Reports", label: "Reports" },
          { path: "/SmartHelper", label: "Smart Helper" },
          { path: "/Help", label: "Help" },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right */}
      <div className="nav-right">
        <Profile_Status />

        <button
          className="hamburger"
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>
    </header>
  );
};

export default Navbar;
