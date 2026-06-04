import { useContext, useEffect, useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { API } from "./Config/Api";
import { AuthContext } from "./Context/AuthContext";

import Intro from "./Pages/Intro";
import Auth from "./Pages/Auth";
import Dashboard from "./Pages/Dashboard";
import Profile from "./Pages/Profile";
import Chat from "./Pages/Chat";
import Doctors from "./Pages/Doctors";
import Appointments from "./Pages/Appointments";
import Prescriptions from "./Pages/Prescriptions";
import UploadPrescription from "./Pages/Upload_prescription";

import "./index.css";

import Sidebar from "./Components/Sidebar";
import ProtectedRoute from "./Components/ProtectedRoute";
import type { User } from "./Config/Types";

const App = () => {
    const authContext = useContext(AuthContext);
    const location = useLocation();
    const [loadingUser, setLoadingUser] = useState(false);
    
    const isAuthPage = location.pathname === "/" || location.pathname === "/login";

    useEffect(() => {
        const access = localStorage.getItem("access");
        if (!access || !authContext) {
            return;
        }

        if (authContext.user) {
            return;
        }

        setLoadingUser(true);
        API<User>("GET", "/auth/me")
            .then(user => {
                authContext.setUser(user);
                authContext.setrole(user.role);
            })
            .catch(() => {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
            })
            .finally(() => setLoadingUser(false));
    }, [authContext]);

    if (loadingUser) {
        return <div className="app-loading">Loading your session…</div>;
    }

    // --- FIX: STRUCTURAL DECOUPLING ---
    // If we are on Intro or Login, return them directly inside a clean, unstyled div container.
    // This makes it completely impossible for the dashboard's CSS grids/sidebars to push the pages right.
    if (isAuthPage) {
        return (
            <div style={{ width: "100vw", minHeight: "100vh", margin: 0, padding: 0 }}>
                <Routes>
                    <Route path="/" element={<Intro />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        );
    }

    // The standard Dashboard/Authenticated Layout remains untouched down here
    return (
        <div className="appMainLayoutContainer">
            <Sidebar />

            <main className="page-content-wrapper">
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/appointments"
                        element={
                            <ProtectedRoute>
                                <Appointments />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctors"
                        element={
                            <ProtectedRoute>
                                <Doctors />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/prescriptions"
                        element={
                            <ProtectedRoute>
                                <Prescriptions />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/uploadprescription"
                        element={
                            <ProtectedRoute>
                                <UploadPrescription />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;