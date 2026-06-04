import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar"; // Adjust path to your Sidebar component file

export default function DashboardLayout() {
    return (
        <div className="appMainLayoutContainer">
            {/* 1. Sidebar remains permanently mounted on the left side */}
            <Sidebar />

            {/* 2. Page content wrapper handles the fluid margin offset automatically */}
            <main className="page-content-wrapper">
                {/* 3. This Outlet acts as a slot where your children pages inject */}
                <Outlet />
            </main>
        </div>
    );
}