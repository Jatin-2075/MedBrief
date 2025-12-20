import { useState } from "react";
import "../Style/SmartHelp.css";
import { API_BASE_URL } from "../config/api";


const Smart_help = () => {
    const [selected, setSelected] = useState("");
    const [WorkoutLevel, SetWorkoutLevel] = useState("beginner")


    const [BMI, setBMI] = useState("");
    const [DietData, setDietData] = useState(null);
    const accessToken = localStorage.getItem("access_token");



    const [WorkoutData, SetWorkoutData] = useState({})

    const HandleSubmit = async () => {
        if (!selected) return alert("Please select an option first.");

        try {
            const res = await fetch(`${API_BASE_URL}/Smart_Help/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    know: selected,
                    Workoutlevel: WorkoutLevel,
                    bmi: BMI,
                })
            });

            // 1. Validate Content-Type to prevent parsing HTML as JSON
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server crashed and sent an HTML error page.");
            }

            const data = await res.json();

            // 2. Handle Logic Errors (502, 400, etc.)
            if (!res.ok || !data.success) {
                alert(data.msg || "An error occurred on the server.");
                return;
            }

            // 3. Update States
            if (data.type === "workout") {
                SetWorkoutData(data);
                setDietData(null);
            } else if (data.type === "diet") {
                setDietData(data.data);
                SetWorkoutData({});
            }

        } catch (err) {
            console.error("Frontend Critical Error:", err);
            alert("Failed to communicate with the server. Please check the console.");
        }
    };


    return (
        <div className="ai-layout simple-mode">
            <main className="ai-main">
                <h1 className="ai-title">Smart Help</h1>
                <p className="ai-subtitle">Health • Lifestyle • Guidance</p>

                <div className="options">
                    <button
                        className={`option-btn ${selected === "workout" ? "active" : ""}`}
                        onClick={() => setSelected("workout")}
                    >
                        Workout
                    </button>

                    <button
                        className={`option-btn ${selected === "diet" ? "active" : ""}`}
                        onClick={() => setSelected("diet")}
                    >
                        Diet
                    </button>
                </div>

                {/* ===== Workout Form ===== */}
                {selected === "workout" && (
                    <div className="form-card">
                        <div className="form-group">
                            <label>Level</label>
                            <select value={WorkoutLevel} onChange={(e) => SetWorkoutLevel(e.target.value)}>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="expert">expert</option>
                            </select>
                        </div>

                    </div>
                )}

                {/* ===== Diet Form ===== */}
                {selected === "diet" && (
                    <div className="form-card">
                        <div className="form-group">
                            <label>BMI</label>
                            <input
                                type="number"
                                step="0.1"
                                value={BMI}
                                onChange={(e) => setBMI(e.target.value)}
                                placeholder="Enter BMI"
                            />
                        </div>
                    </div>
                )}

                <button className="submit-btn" onClick={HandleSubmit}>
                    Submit
                </button>

                {/* ===== Workout Results ===== */}
                {WorkoutData?.data && Array.isArray(WorkoutData.data) && (
                    <div className="result-section">
                        <h2>Workout Suggestions</h2>

                        {WorkoutData.data.slice(0, 5).map((item, index) => (
                            <div className="result-card" key={index}>
                                <h3>{item.name}</h3>
                                <p><b>Type:</b> {item.type}</p>
                                <p><b>Muscle:</b> {item.muscle}</p>
                                <p><b>Difficulty:</b> {item.difficulty}</p>
                                <p className="instructions">{item.instructions}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===== Diet Results ===== */}
                {DietData && (
                    <div className="result-section">
                        <h2>{DietData.goal}</h2>
                        <p><b>BMI:</b> {DietData.bmi}</p>

                        {DietData.foods.slice(0, 5).map((food, index) => (
                            <div className="diet-card" key={index}>
                                <h4>{food.name}</h4>
                                <p>Calories: {food.calories}</p>
                                <p>Protein: {food.protein_g} g</p>
                                <p>Carbs: {food.carbohydrates_total_g} g</p>
                                <p>Fat: {food.fat_total_g} g</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>

    );
};

export default Smart_help;
