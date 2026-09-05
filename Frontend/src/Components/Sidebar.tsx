import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import {
    LayoutDashboard,
    User,
    CalendarDays,
    Stethoscope,
    Hospital,
    MessageCircle,
    Mail,
    Pill,
    FileUp,
    LogOut,
} from "lucide-react";
import "../Css/Sidebar.css";

const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/alldoctorlist", label: "All Doctors", icon: Hospital },
    { to: "/chat", label: "AI Chat", icon: MessageCircle },
    { to: "/messages", label: "Messages", icon: Mail },
    { to: "/prescriptions", label: "Prescriptions", icon: Pill },
];

export default function Sidebar() {
    const [isCollapsed] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const authContext = useContext(AuthContext);

    if (!authContext) return null;

    const { user, setUser, setrole } = authContext;

    useEffect(() => {
        const rootContainer = document.querySelector(".appMainLayoutContainer");
        if (!rootContainer) return;

        if (isCollapsed) {
            rootContainer.classList.add("sidebar-is-collapsed");
        } else {
            rootContainer.classList.remove("sidebar-is-collapsed");
        }
    }, [isCollapsed]);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        setrole(null);
        navigate("/login");
    };

    const allItems = [
        ...navItems,
        ...(user?.role === "doctor"
            ? [{ to: "/uploadprescription", label: "Upload Prescription", icon: FileUp }]
            : []),
    ];

    return (
        <nav className="navbar">
            <div className="navbar-spacer" aria-hidden="true" />

            <div className="navbar-nav">
                {allItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`navbar-link ${location.pathname === item.to ? "active" : ""
                                }`}
                        >
                            <span className="nav-icon">
                                <Icon size={18} strokeWidth={2} />
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="navbar-footer">
                <div className={`navbar-user ${isCollapsed ? "collapsed" : ""}`}>
                    {!isCollapsed && (
                        <div className="user-info">
                            <span className="user-role">{user?.role ?? ""}</span>
                        </div>
                    )}
                </div>

                <button type="button" className="navbar-logout" onClick={handleLogout}>
                    <span className="nav-icon">
                        <LogOut size={16} strokeWidth={2} />
                    </span>
                    {!isCollapsed && <span className="nav-label">Logout</span>}
                </button>
            </div>
        </nav>
    );
}