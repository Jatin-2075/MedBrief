import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../utils/api";
import { toast } from "react-toastify";
import "../../Style/profile_view.css";

const ProfileView = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        weight: "",
        height: "",
        bloodgroup: "",
        allergies: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await get("/profile/");

            if (data.success) {
                setProfile(data);
                setFormData({
                    name: data.name || "",
                    age: data.age || "",
                    gender: data.gender || "",
                    weight: data.weight || "",
                    height: data.height || "",
                    bloodgroup: data.bloodgroup || "",
                    allergies: data.allergies || "",
                });
            } else {
                toast.error("Failed to load profile");
                navigate("/Profile_create");
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            toast.error(error.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        if (!formData.age || formData.age < 0 || formData.age > 150) {
            toast.error("Please enter a valid age");
            return;
        }

        setSaving(true);

        try {
            const data = await post("/profile/create/", {
                name: formData.name.trim(),
                age: parseInt(formData.age),
                gender: formData.gender,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                bloodgroup: formData.bloodgroup.trim() || null,
                allergies: formData.allergies.trim() || null,
            });

            if (data.success) {
                toast.success("Profile updated successfully!");
                setIsEditing(false);
                fetchProfile();
            } else {
                toast.error(data.msg || "Failed to update profile");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.message || "Server error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to original profile data
        setFormData({
            name: profile.name || "",
            age: profile.age || "",
            gender: profile.gender || "",
            weight: profile.weight || "",
            height: profile.height || "",
            bloodgroup: profile.bloodgroup || "",
            allergies: profile.allergies || "",
        });
    };

    if (loading) {
        return (
            <div className="profile-view-container">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-view-container">
                <div className="error">Profile not found</div>
            </div>
        );
    }

    return (
        <div className="profile-view-container">
            <div className="profile-header">
                <h2>Your Health Profile</h2>
                {!isEditing && (
                    <button
                        className="edit-btn"
                        onClick={() => setIsEditing(true)}
                    >
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            {!isEditing ? (
                // View Mode
                <div className="profile-view">
                    <div className="profile-section">
                        <h3>Personal Information</h3>
                        <div className="profile-grid">
                            <div className="profile-field">
                                <label>Username</label>
                                <p>{profile.username}</p>
                            </div>
                            <div className="profile-field">
                                <label>Email</label>
                                <p>{profile.email}</p>
                            </div>
                            <div className="profile-field">
                                <label>Name</label>
                                <p>{profile.name || "Not provided"}</p>
                            </div>
                            <div className="profile-field">
                                <label>Age</label>
                                <p>{profile.age || "Not provided"}</p>
                            </div>
                            <div className="profile-field">
                                <label>Gender</label>
                                <p>{profile.gender || "Not provided"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Health Information</h3>
                        <div className="profile-grid">
                            <div className="profile-field">
                                <label>Weight</label>
                                <p>{profile.weight ? `${profile.weight} kg` : "Not provided"}</p>
                            </div>
                            <div className="profile-field">
                                <label>Height</label>
                                <p>{profile.height ? `${profile.height} cm` : "Not provided"}</p>
                            </div>
                            <div className="profile-field">
                                <label>Blood Group</label>
                                <p>{profile.bloodgroup || "Not provided"}</p>
                            </div>
                            <div className="profile-field full-width">
                                <label>Allergies</label>
                                <p>{profile.allergies || "None reported"}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        className="back-btn"
                        onClick={() => navigate("/Dashboard")}
                    >
                        Back to Dashboard
                    </button>
                </div>
            ) : (
                // Edit Mode
                <form onSubmit={handleSave} className="profile-edit-form">
                    <div className="form-section">
                        <h3>Personal Information</h3>
                        
                        <div className="form-field">
                            <label>Name *</label>
                            <input
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="form-field">
                            <label>Age *</label>
                            <input
                                name="age"
                                type="number"
                                value={formData.age}
                                onChange={handleChange}
                                min="0"
                                max="150"
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="form-field">
                            <label>Gender *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                disabled={saving}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Health Information</h3>

                        <div className="form-field">
                            <label>Weight (kg)</label>
                            <input
                                name="weight"
                                type="number"
                                value={formData.weight}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                disabled={saving}
                            />
                        </div>

                        <div className="form-field">
                            <label>Height (cm)</label>
                            <input
                                name="height"
                                type="number"
                                value={formData.height}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                disabled={saving}
                            />
                        </div>

                        <div className="form-field">
                            <label>Blood Group</label>
                            <select
                                name="bloodgroup"
                                value={formData.bloodgroup}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div className="form-field full-width">
                            <label>Allergies</label>
                            <textarea
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                rows="3"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfileView;