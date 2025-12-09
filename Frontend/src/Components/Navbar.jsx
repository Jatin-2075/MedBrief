import { NavLink } from "react-router-dom";
import '../Style/navbar.css'

const Navbar = () => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <span>SmartZen</span>
            </div>

            <nav className="menu">
                <NavLink to="/Home" className="item">Home</NavLink>
                <NavLink to="/Dashboard" className="item">Dashboard</NavLink>
                <NavLink to="/Upload" className="item">Uploads</NavLink>
                <NavLink to="/Reports" className="item">Medical Reports</NavLink>                <NavLink to="/SmartHelper" className="item">Smart Helper</NavLink>
                <NavLink to="/Help" className="item">Help</NavLink>
            </nav>
        </aside>
    );
};

export default Navbar;
