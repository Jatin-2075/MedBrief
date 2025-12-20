import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";
import "../../Style/profile_create.css";

const CreateProfile = () => {
    const [profile, setProfile] = useState({
        name: "",
        age: "",
        gender: "",
        weight: "",
        height: "",
        bloodgroup: "",
        allergies: "",
    });

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            toast.error("Session expired. Please login again.");
            navigate("/Login");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/profile/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    name: profile.name.trim(),
                    age: Number(profile.age),
                    gender: profile.gender,
                    weight: profile.weight || null,
                    height: profile.height || null,
                    bloodgroup: profile.bloodgroup || null,
                    allergies: profile.allergies || null,
                }),
            });

            console.log("Response status:", res.status);

            const data = await res.json();
            console.log("Response data:", data);

            if (!res.ok) {
                throw new Error(data.msg || "Failed to create profile");
            }

            toast.success("Profile created successfully");
            
            // Update local storage to reflect profile is completed
            localStorage.setItem("profile_completed", "true");
            
            navigate("/Home", { replace: true });
        } catch (err) {
            console.error("Profile creation error:", err);
            toast.error(err.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    const skiphandle = async () => {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            toast.error("Session expired. Please login again.");
            navigate("/Login");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/profile/status/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ profile_completed: false }),
            });

            console.log("Skip STATUS:", res.status);

            const data = await res.json();
            console.log("Skip data:", data);

            if (!res.ok) {
                throw new Error(data.msg || "Failed to skip profile");
            }

            toast.info("Profile skipped");
            
            // Update local storage
            localStorage.setItem("profile_completed", "false");
            
            navigate("/Home", { replace: true });
        } catch (err) {
            console.error("Skip error:", err);
            toast.error(err.message || "Skip failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <h2>Create Health Profile</h2>

            <form onSubmit={handleSubmit} className="profile-form">
                <input name="name" placeholder="Name" onChange={handleChange} required />
                <input name="age" type="number" placeholder="Age" onChange={handleChange} required />

                <select name="gender" onChange={handleChange} required>
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>

                <input name="weight" placeholder="Weight (kg)" onChange={handleChange} />
                <input name="height" placeholder="Height (cm)" onChange={handleChange} />

                <select name="bloodgroup" onChange={handleChange}>
                    <option value="">Blood Group</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                    <option>O+</option><option>O-</option>
                </select>

                <textarea name="allergies" placeholder="Allergies" onChange={handleChange} />

                <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                </button>

                <button type="button" onClick={skiphandle} disabled={loading}>
                    Skip for now
                </button>
            </form>
        </div>
    );
};

export default CreateProfile;