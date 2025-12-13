import { useState } from "react";

const CreateProfile = () => {
    const [profile, setProfile] = useState({
        name: "",
        age: "",
        gender: "",
        weight: "",
        height: "",
        bloodGroup: "",
        allergies: "",
    });

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(profile);
        alert("Profile saved");
    };

    return (
        <div className="profile-container">
            <h2>Create Health Profile</h2>

            <form onSubmit={handleSubmit} className="profile-form">
                <input
                    name="name"
                    placeholder="Full Name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                />

                <input
                    name="age"
                    type="number"
                    placeholder="Age"
                    value={profile.age}
                    onChange={handleChange}
                    required
                />

                <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>

                <input
                    name="weight"
                    type="number"
                    placeholder="Weight (kg)"
                    value={profile.weight}
                    onChange={handleChange}
                />

                <input
                    name="height"
                    type="number"
                    placeholder="Height (cm)"
                    value={profile.height}
                    onChange={handleChange}
                />

                <input
                    name="bloodGroup"
                    placeholder="Blood Group (e.g. O+)"
                    value={profile.bloodGroup}
                    onChange={handleChange}
                />

                <textarea
                    name="allergies"
                    placeholder="Allergies (if any)"
                    value={profile.allergies}
                    onChange={handleChange}
                />

                <textarea
                    name="conditions"
                    placeholder="Medical Conditions"
                    value={profile.conditions}
                    onChange={handleChange}
                />

                <button type="submit">Save Profile</button>
            </form>
        </div>
    );
};

export default CreateProfile;
