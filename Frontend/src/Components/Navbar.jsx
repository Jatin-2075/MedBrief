import { NavLink } from "react-router-dom";
import "../Style/navbar.css";
import useWindowWidth from "../Hooks/Width";
import { useState, useEffect } from "react";

const Navbar = () => {
    const [toggle, setToggle] = useState(true);
    const [navToggle, setNavToggle] = useState(false);

    const width = useWindowWidth();

    // ✅ FIX 1: state update moved to useEffect
    useEffect(() => {
        if (width > 768) {
            setToggle(true);
            setNavToggle(false);
        } else {
            setToggle(false);
        }
    }, [width]);

    return (
        <aside className="sidebar">
            <div className="logo">
                <span>SmartZen</span>
            </div>

            {toggle ? (
                <>
                    {!navToggle && (
                        <button type="button" onClick={() => setNavToggle(true)}>
                            ☰
                        </button>
                    )}

                    {navToggle && (
                        <>
                            <button type="button" onClick={() => setNavToggle(false)}>
                                ✖
                            </button>

                            <nav className="menu">
                                <NavLink to="/Home" className="item">Home</NavLink>
                                <NavLink to="/Dashboard" className="item">Dashboard</NavLink>
                                <NavLink to="/Upload" className="item">Uploads</NavLink>
                                <NavLink to="/Reports" className="item">Medical Reports</NavLink>
                                <NavLink to="/SmartHelper" className="item">Smart Helper</NavLink>
                                <NavLink to="/Help" className="item">Help</NavLink>
                            </nav>
                        </>
                    )}
                </>
            ) : (
                <nav className="menu">
                    <NavLink to="/Home" className="item">Home</NavLink>
                    <NavLink to="/Dashboard" className="item">Dashboard</NavLink>
                    <NavLink to="/Upload" className="item">Uploads</NavLink>
                    <NavLink to="/Reports" className="item">Medical Reports</NavLink>
                    <NavLink to="/SmartHelper" className="item">Smart Helper</NavLink>
                    <NavLink to="/Help" className="item">Help</NavLink>
                </nav>
            )}
        </aside>
    );
};

export default Navbar;
