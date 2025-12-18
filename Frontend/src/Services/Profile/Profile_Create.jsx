import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateProfile = () => {
    const [profile, setProfile] = useState({
        photo: null,
        name: "",
        age: "",
        gender: "",
        weight: "",
        height: "",
        bloodGroup: "",
        allergies: "",
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }))
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(profile);

        const formdata = new FormData();
        Object.keys(profile).forEach(key => {
            formdata.append(key, profile[key]);
        })
        try {
            const res = await fetch("http://localhost:8000/Create_profile/", {
                method: 'POST',
                body: formdata,
                credentials: 'include'

            });

            if (!res.ok) {
                alert("Server Error Sorry")
            }
            const data = await res.json()
            console.log(data);

            if (data.success) {
                alert(data.msg)
                navigate("/Dashboard")
            }
            else {
                alert(data.msg)
            }
        } catch (err) {
            console.log(err)
        };

    }

    const skiphandle = async () => {
        const response = await fetch("http://localhost:8000/Status/", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: false
            })
        });

        const data = await response.json();
        alert(data.msg);

        navigate("/Dashboard");
    };




    return (
        <div className="profile-container">
            <h2>Create Health Profile</h2>

            <form onSubmit={handleSubmit} className="profile-form">

                <div>
                    <label>Upload photo</label>
                    <input
                        name="photo"
                        type="file"
                        required
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
                <button type="button" onClick={skiphandle}>Skip</button>
            </form>
        </div>
    );
};

export default CreateProfile;