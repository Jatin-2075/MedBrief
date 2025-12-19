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

    const token = localStorage.getItem("access_token");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Session expired. Please login again.");
            navigate("/Login");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/Profile_creation/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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

            const data = await res.json();

            if (!res.ok) throw new Error(data.msg);

            toast.success("Profile created successfully");
            navigate("/Dashboard", { replace: true });
        } catch (err) {
            toast.error(err.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    const skiphandle = async () => {
        if (!token) {
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
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ profile_completed: false }),
            });

            console.log("STATUS:", res.status);

            const data = await res.json();

            if (!res.ok) throw new Error(data.msg);

            toast.info("Profile skipped");
            navigate("/Home", { replace: true });
        } catch (err) {
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
