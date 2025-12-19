import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const Profile_Status = () => {
  const [completed, setCompleted] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("access");

  useEffect(() => {
    const checkStatus = async () => {
      if (!token) {
        setCompleted(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/Status_view/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setCompleted(data.profile_completed);
        } else {
          setCompleted(false);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
        setCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [token]);

  if (loading) {
    return (
      <button style={buttonStyle} disabled>
        ⏳ Loading...
      </button>
    );
  }

  if (completed === null) return null;

  const handleClick = () => {
    if (completed) {
      navigate("/Profile");
    } else {
      navigate("/Profile_create");
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        ...buttonStyle,
        background: completed ? "#e8f5e9" : "#fff3e0",
        color: completed ? "#2e7d32" : "#e65100",
        fontWeight: completed ? "normal" : "600",
      }}
      title={completed ? "View Profile" : "Complete Profile"}
    >
      {completed ? "👤 View Profile" : "⚠️ Complete Profile"}
    </button>
  );
};

const buttonStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s",
};

export default Profile_Status;
