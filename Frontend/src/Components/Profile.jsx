import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile_Status = () => {
    const [completed, setCompleted] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkStatus = async () => {
            const res = await fetch("http://localhost:8000/Status/", {
                credentials: "include",
            });
            const data = await res.json();
            setCompleted(data.status);
        };

        checkStatus();
    }, []);

    if (completed === null) return null;

    const handleClick = () => {
        if (completed) {
            navigate("/Profile");
        } else {
            navigate("/CreateProfile");
        }
    };

    return (
        <button
            onClick={handleClick}
            style={buttonStyle}
            title={completed ? "View Profile" : "Complete Profile"}
        >
            {completed ? "👤 View Profile" : "⚠️ Complete Profile"}
        </button>
    );
};

const buttonStyle = {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    background: "#f3f3f3",
};

export default Profile_Status;
