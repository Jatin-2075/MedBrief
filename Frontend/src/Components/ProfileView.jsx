import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../Style/profile_view.css";

const BASE_URL = "http://127.0.0.1:8000";

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    bloodgroup: "",
    allergies: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      toast.error("Session expired. Login again.");
      navigate("/Login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BASE_URL}/profile/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        navigate("/Profile_create");
        return;
      }

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
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Name required");
    if (!formData.age || formData.age < 0 || formData.age > 150)
      return toast.error("Invalid age");

    setSaving(true);

    try {
      const res = await fetch(`${BASE_URL}/profile/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          weight: formData.weight || null,
          height: formData.height || null,
          bloodgroup: formData.bloodgroup || null,
          allergies: formData.allergies || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profile updated");
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(data.msg || "Update failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  if (loading) return <div className="loading">Loading profile…</div>;

  return (
    <div className="profile-view-container">
      <div className="profile-header">
        <h2>Your Health Profile</h2>
        {!isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            ✏️ Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="profile-grid">
          <Field label="Name" value={profile.name} />
          <Field label="Age" value={profile.age} />
          <Field label="Gender" value={profile.gender} />
          <Field label="Weight" value={profile.weight && `${profile.weight} kg`} />
          <Field label="Height" value={profile.height && `${profile.height} cm`} />
          <Field label="Blood Group" value={profile.bloodgroup} />
          <Field label="Allergies" value={profile.allergies || "None"} full />

          <button className="back-btn" onClick={() => navigate("/Home")}>
            Back to Home
          </button>
          <button className="back-btn" onClick={() => navigate("/")}>
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="profile-edit-form">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} />
          <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
          <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Select>
          <Input label="Weight (kg)" name="weight" value={formData.weight} onChange={handleChange} />
          <Input label="Height (cm)" name="height" value={formData.height} onChange={handleChange} />
          <Select label="Blood Group" name="bloodgroup" value={formData.bloodgroup} onChange={handleChange}>
            <option value="">Select</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => (
              <option key={b}>{b}</option>
            ))}
          </Select>
          <Textarea label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} />

          <div className="form-actions">
            <button className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const Field = ({ label, value, full }) => (
  <div className={`profile-field ${full ? "full-width" : ""}`}>
    <label>{label}</label>
    <p>{value || "Not provided"}</p>
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="form-field">
    <label>{label}</label>
    <input {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="form-field">
    <label>{label}</label>
    <select {...props}>{children}</select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="form-field full-width">
    <label>{label}</label>
    <textarea rows="3" {...props} />
  </div>
);

export default ProfileView;
