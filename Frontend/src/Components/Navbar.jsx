import { NavLink } from "react-router-dom";
import { useState } from "react";
import "../Style/navbar.css";

const Navbar = () => {
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [open, setOpen] = useState(false);

  return (
    <>
        <div className="menu">
          <NavLink to="/Home" className="item">Home</NavLink>
          <NavLink to="/Dashboard" className="item">Dashboard</NavLink>
          <NavLink to="/Upload" className="item">Uploads</NavLink>
          <NavLink to="/Reports" className="item">Medical Reports</NavLink>
          <NavLink to="/SmartHelper" className="item">Smart Helper</NavLink>
          <NavLink to="/Help" className="item">Help</NavLink>
        </div>
    </>
  );
};

export default Navbar;
