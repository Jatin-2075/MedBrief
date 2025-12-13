import { useState } from "react";

const CreateProfile = () => {
    const [profile, setProfile] = useState({
        image: null,
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

    try{
        
    } catch{

    }

    return (
        <div className="profile-container">
            <h2>Create Health Profile</h2>

            <form onSubmit={handleSubmit} className="profile-form">

                <div>
                    <label>Upload photo</label>
                    <input
                        name="photo"
                        placeholder="upload photo"
                        type="file"
                        required
                        value={profile.photo}
                        onChange={handleChange}
                        accept="image/"
                    />
                </div>

                <div>
                    <label>Name</label>
                    <input
                        name="name"
                        placeholder="Full Name"
                        value={profile.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Age</label>
                    <input
                        name="age"
                        type="number"
                        placeholder="Age"
                        value={profile.age}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Gender</label>
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
                </div>

                <div>
                    <label>Weight</label>
                    <input
                        name="weight"
                        type="number"
                        placeholder="Weight (kg)"
                        value={profile.weight}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Height</label>
                    <input
                        name="height"
                        type="number"
                        placeholder="Height (cm)"
                        value={profile.height}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Blood Group</label>
                    <input
                        name="bloodGroup"
                        placeholder="Blood Group (e.g. O+)"
                        value={profile.bloodGroup}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Allergies</label>
                    <textarea
                        name="allergies"
                        placeholder="Allergies (if any)"
                        value={profile.allergies}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">Save Profile</button>
            </form>
        </div>
    );
};

export default CreateProfile;
